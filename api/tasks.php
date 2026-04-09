<?php
// ============================================================
// tasks.php — CRUD công việc: GET, POST, PUT, DELETE
// ============================================================

require_once 'config.php';

header('Content-Type: application/json; charset=UTF-8');

// Kiểm tra đăng nhập
if (empty($_SESSION['user'])) {
    jsonResponse(['message' => 'Chưa đăng nhập.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

// ——— Hàm chuyển datetime từ JS ISO sang MySQL DATETIME ———
function parseDateTime(?string $val): ?string {
    if (!$val) return null;
    try {
        $dt = new DateTime($val);
        return $dt->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}

switch ($method) {

    // ——— Lấy tất cả công việc ———
    case 'GET':
        $db   = getDB();
        $stmt = $db->query('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC');
        $tasks = $stmt->fetchAll();
        foreach ($tasks as &$task) {
            $task['is_completed'] = (bool)$task['is_completed'];
        }
        jsonResponse($tasks);
        break;

    // ——— Tạo công việc mới ———
    case 'POST':
        $body = getRequestBody();
        if (empty($body['content']) || empty($body['due_date'])) {
            jsonResponse(['message' => 'Thiếu tên hoặc ngày hết hạn.'], 400);
        }

        // Tạo UUID v4
        $uuid = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $db   = getDB();
        $stmt = $db->prepare(
            'INSERT INTO tasks (id, content, due_date, is_completed, priority, category, status,
             assigned_to_email, assigned_to_name, completed_at, created_by_email)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $uuid,
            $body['content'],
            $body['due_date'],
            empty($body['is_completed']) ? 0 : 1,
            $body['priority']          ?? 'Trung bình',
            $body['category']          ?? 'Chung',
            $body['status']            ?? 'Cần làm',
            $body['assigned_to_email'] ?? null,
            $body['assigned_to_name']  ?? null,
            parseDateTime($body['completed_at'] ?? null),
            $_SESSION['user']['email'],
        ]);

        $stmt2 = $db->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt2->execute([$uuid]);
        $task = $stmt2->fetch();
        $task['is_completed'] = (bool)$task['is_completed'];
        jsonResponse($task, 201);
        break;

    // ——— Cập nhật công việc ———
    case 'PUT':
        if (!$id) jsonResponse(['message' => 'Thiếu ID công việc.'], 400);
        $body = getRequestBody();

        $allowed = ['content', 'due_date', 'is_completed', 'priority', 'category',
                    'status', 'assigned_to_email', 'assigned_to_name', 'completed_at'];
        $fields = [];
        $values = [];

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $body)) continue;
            $fields[] = "`$field` = ?";
            if ($field === 'is_completed') {
                $values[] = $body[$field] ? 1 : 0;
            } elseif ($field === 'completed_at') {
                $values[] = parseDateTime($body[$field]);
            } else {
                $values[] = $body[$field];
            }
        }

        if (!$fields) jsonResponse(['message' => 'Không có dữ liệu để cập nhật.'], 400);

        $values[] = $id;
        $db   = getDB();
        $stmt = $db->prepare('UPDATE tasks SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);

        $stmt2 = $db->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt2->execute([$id]);
        $task = $stmt2->fetch();
        if (!$task) jsonResponse(['message' => 'Không tìm thấy công việc.'], 404);
        $task['is_completed'] = (bool)$task['is_completed'];
        jsonResponse($task);
        break;

    // ——— Xóa công việc ———
    case 'DELETE':
        if (!$id) jsonResponse(['message' => 'Thiếu ID công việc.'], 400);
        $db   = getDB();
        $stmt = $db->prepare('DELETE FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Đã xóa công việc thành công.']);
        break;

    default:
        jsonResponse(['message' => 'Method không hợp lệ.'], 405);
}
