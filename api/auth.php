<?php
// ============================================================
// auth.php — Đăng nhập, đăng ký, đăng xuất, quản lý session
// ============================================================

require_once 'config.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = getRequestBody();
$action = ($method === 'GET') ? ($_GET['action'] ?? '') : ($body['action'] ?? '');

switch ($action) {

    // ——— Kiểm tra session đang đăng nhập ———
    case 'me':
        if (!empty($_SESSION['user'])) {
            jsonResponse(['user' => $_SESSION['user']]);
        } else {
            jsonResponse(['user' => null], 401);
        }
        break;

    // ——— Đăng nhập ———
    case 'login':
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            jsonResponse(['message' => 'Vui lòng nhập email và mật khẩu.'], 400);
        }

        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['message' => 'Email hoặc mật khẩu không đúng.'], 401);
        }

        $_SESSION['user'] = [
            'id'    => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ];

        jsonResponse(['user' => $_SESSION['user']]);
        break;

    // ——— Đăng ký ———
    case 'register':
        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$name || !$email || !$password) {
            jsonResponse(['message' => 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['message' => 'Địa chỉ email không hợp lệ.'], 400);
        }
        if (mb_strlen($password) < 6) {
            jsonResponse(['message' => 'Mật khẩu phải có ít nhất 6 ký tự.'], 400);
        }

        $db   = getDB();
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonResponse(['message' => 'Email này đã được sử dụng.'], 409);
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt   = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "member")');
        $stmt->execute([$name, $email, $hashed]);
        $id = $db->lastInsertId();

        $_SESSION['user'] = [
            'id'    => $id,
            'name'  => $name,
            'email' => $email,
            'role'  => 'member',
        ];

        jsonResponse(['user' => $_SESSION['user']], 201);
        break;

    // ——— Đăng xuất ———
    case 'logout':
        session_destroy();
        jsonResponse(['message' => 'Đã đăng xuất thành công.']);
        break;

    // ——— Lấy danh sách tất cả user (để hiển thị thành viên nhóm) ———
    case 'users':
        if (empty($_SESSION['user'])) {
            jsonResponse(['message' => 'Chưa đăng nhập.'], 401);
        }
        $db   = getDB();
        $stmt = $db->query('SELECT id, name, email, role FROM users ORDER BY name ASC');
        jsonResponse(['users' => $stmt->fetchAll()]);
        break;

    // ——— Cập nhật hồ sơ bản thân ———
    case 'update_profile':
        if (empty($_SESSION['user'])) {
            jsonResponse(['message' => 'Chưa đăng nhập.'], 401);
        }
        $name  = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        if (!$name || !$email) {
            jsonResponse(['message' => 'Tên và email không được để trống.'], 400);
        }

        $db = getDB();
        // Kiểm tra email đã tồn tại chưa (trừ chính mình)
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $_SESSION['user']['id']]);
        if ($stmt->fetch()) {
            jsonResponse(['message' => 'Email này đã được sử dụng bởi tài khoản khác.'], 409);
        }

        $stmt = $db->prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
        $stmt->execute([$name, $email, $_SESSION['user']['id']]);

        $_SESSION['user']['name']  = $name;
        $_SESSION['user']['email'] = $email;
        jsonResponse(['user' => $_SESSION['user']]);
        break;

    // ——— Xóa toàn bộ công việc (chỉ admin) ———
    case 'truncate_tasks':
        if (empty($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
            jsonResponse(['message' => 'Chỉ Admin mới có quyền thực hiện.'], 403);
        }
        $db = getDB();
        $db->exec('DELETE FROM tasks');
        jsonResponse(['message' => 'Đã xóa toàn bộ công việc.']);
        break;

    default:
        jsonResponse(['message' => 'Action không hợp lệ.'], 400);
}
