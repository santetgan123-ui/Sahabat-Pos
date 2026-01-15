<?php
// Mencegah error PHP muncul di output JSON dan merusak struktur
error_reporting(0); 
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST');

require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// 1. LOGIN
if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->username) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username dan Password wajib diisi']);
        exit();
    }

    try {
        $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = :username");
        $stmt->execute(['username' => trim($data->username)]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify(trim($data->password), $user['password'])) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Username atau Password salah']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB Error']);
    }
    exit();
}

// 2. LOGOUT
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

// 3. CHECK AUTH
if ($method === 'GET' && $action === 'check_auth') {
    $isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    echo json_encode(['is_logged_in' => $isLoggedIn]);
    exit();
}

// 4. GET GALLERY
if ($method === 'GET' && $action === '') {
    try {
        $stmt = $conn->query("SELECT * FROM sahabatpos ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit();
}

// 5. UPLOAD (FILE)
if ($method === 'POST' && $action === 'upload') {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(403);
        echo json_encode(['error' => 'Sesi habis, login ulang.']);
        exit();
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'File tidak valid atau terlalu besar.']);
        exit();
    }

    $title = $_POST['title'] ?? 'Tanpa Judul';
    $desc = $_POST['desc'] ?? '';
    $uploadDir = 'uploads/';

    // Buat folder uploads jika belum ada
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!in_array($ext, $allowed)) {
        echo json_encode(['error' => 'Hanya format JPG, PNG, WEBP yang diperbolehkan.']);
        exit();
    }

    $filename = uniqid() . '.' . $ext;
    $target = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
        try {
            $stmt = $conn->prepare("INSERT INTO sahabatpos (image_url, title, description) VALUES (:url, :title, :desc)");
            $stmt->execute([':url' => $target, ':title' => $title, ':desc' => $desc]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            unlink($target); // Hapus file jika DB gagal
            http_response_code(500);
            echo json_encode(['error' => 'Database Error']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal memindahkan file. Cek izin folder.']);
    }
    exit();
}
?>