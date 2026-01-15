<?php
// Konfigurasi Database
$host = 'localhost';
$db_name = 'db_sahabatpos'; // Pastikan nama DB sama dengan yang dibuat
$username = 'root';         // Default XAMPP biasanya 'root'
$password = '';             // Default XAMPP biasanya kosong

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    // Set mode error PDO ke Exception agar mudah debugging
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Jika koneksi gagal, hentikan proses dan tampilkan pesan JSON
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Koneksi Database Gagal: ' . $e->getMessage()]);
    exit();
}
?>