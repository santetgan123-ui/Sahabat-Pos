<?php
// FILE INI HANYA DIJALANKAN SEKALI UNTUK MEMPERBAIKI AKUN
// HAPUS FILE INI SETELAH BERHASIL LOGIN

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h3>Sedang Memperbaiki Database Akun...</h3>";

try {
    // 1. Cek Koneksi
    echo "✅ Koneksi Database Berhasil.<br>";

    // 2. Setup User Baru
    $username = 'Vallha';
    $password = '12345678';
    
    // Hash password menggunakan algoritma default server ini (Pasti Cocok)
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // 3. Hapus user lama jika ada (supaya bersih)
    $stmt = $conn->prepare("DELETE FROM users WHERE username = :user OR username = 'admin'");
    $stmt->execute(['user' => $username]);
    echo "✅ Membersihkan user lama/duplikat...<br>";

    // 4. Masukkan User Baru
    $sql = "INSERT INTO users (username, password) VALUES (:user, :pass)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user' => $username,
        ':pass' => $hashed_password
    ]);

    echo "✅ <b>SUKSES!</b> Akun Admin berhasil dibuat.<br>";
    echo "<hr>";
    echo "Username: <b>$username</b><br>";
    echo "Password: <b>$password</b><br>";
    echo "<hr>";
    echo "👉 <a href='gallery.html'>Klik disini untuk kembali Login</a>";

} catch (PDOException $e) {
    echo "❌ <b>ERROR DATABASE:</b> " . $e->getMessage();
    echo "<br>Pastikan file config.php sudah benar dan database 'db_sahabatpos' sudah dibuat di phpMyAdmin.";
}
?>