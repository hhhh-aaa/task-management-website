<?php
// ============================================================
// config.php — Cấu hình kết nối database và hàm tiện ích
// Sao chép file này thành config.php và điền thông tin thực tế.
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'qlcv_db');
define('DB_USER', 'root');
define('DB_PASS', '');           // Laragon mặc định không có mật khẩu
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function jsonResponse($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Khởi động session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
