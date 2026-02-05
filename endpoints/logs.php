<?php
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json; charset=utf-8');
/* =============================================================
     Endpoint: logs.php
     Resumen: Consulta paginada/filtrada de uploads_log (solo rol super) con
                        rotación best-effort (>6 meses) para controlar crecimiento.
     Diccionario:
         - rotación: Eliminación periódica de registros antiguos.
     Parámetros (GET): page, per_page, search, action, user, from_date, to_date.
     Respuesta: { success:true, data:{ items, page, per_page, total, total_pages } }
     ============================================================= */
if (!isset($_SESSION['usuario']) || ($_SESSION['role'] ?? 'user') !== 'super') {
    json_error('No autorizado', 403);
}
$conn = db();
ensure_uploads_log_table($conn);

// Rotación inteligente de logs con configuración por entorno
$rotation_config = get_log_rotation_config();
$rotation_result = rotate_uploads_log($conn, $rotation_config);

$page = max(1, (int)($_GET['page'] ?? 1));
$per = (int)($_GET['per_page'] ?? 25);
if ($per < 1) $per = 25; elseif ($per > 200) $per = 200;
$offset = ($page - 1) * $per;
$search = trim($_GET['search'] ?? '');
$action = trim($_GET['action'] ?? '');
$user = trim($_GET['user'] ?? '');
$where = [];
$params = [];
$types = '';

if ($search !== '') {
    $where[] = '(username LIKE ? OR action LIKE ? OR file_name LIKE ?)';
    $like = "%$search%"; $params[] = $like; $params[] = $like; $params[] = $like; $types .= 'sss';
}
if ($action !== '') { $where[] = 'action = ?'; $params[] = $action; $types .= 's'; }
if ($user !== '') { $where[] = 'username = ?'; $params[] = $user; $types .= 's'; }

// Filtros de fecha
$fromDate = trim($_GET['from_date'] ?? '');
$toDate = trim($_GET['to_date'] ?? '');
if ($fromDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fromDate)) {
    $where[] = 'DATE(created_at) >= ?'; $params[] = $fromDate; $types .= 's';
}
if ($toDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $toDate)) {
    $where[] = 'DATE(created_at) <= ?'; $params[] = $toDate; $types .= 's';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
// Total
$sqlCount = "SELECT COUNT(*) c FROM uploads_log $whereSql";
$stmtCount = $conn->prepare($sqlCount);
if ($params) { $stmtCount->bind_param($types, ...$params); }
$stmtCount->execute(); $resC = $stmtCount->get_result(); $total = (int)($resC->fetch_assoc()['c'] ?? 0); $stmtCount->close();
$totalPages = $total > 0 ? (int)ceil($total / $per) : 1;
$sql = "SELECT id, username, action, file_name, file_path, ip, extra, created_at FROM uploads_log $whereSql ORDER BY id DESC LIMIT ? OFFSET ?";
// Añadimos limit/offset
$params2 = $params; $types2 = $types . 'ii'; $params2[] = $per; $params2[] = $offset;
$stmt = $conn->prepare($sql);
$stmt->bind_param($types2, ...$params2);
$stmt->execute(); $res = $stmt->get_result();
$items = [];
while ($row = $res->fetch_assoc()) {
    if ($row['extra']) {
        $decoded = json_decode($row['extra'], true);
        if (json_last_error() === JSON_ERROR_NONE) $row['extra'] = $decoded; else $row['extra_raw'] = $row['extra'];
    }
    $items[] = $row;
}
$stmt->close();

// Incluir estadísticas de rotación si se ejecutó
$response_data = [
    'items' => $items,
    'page' => $page,
    'per_page' => $per,
    'total' => $total,
    'total_pages' => $totalPages
];

// Añadir información de rotación para monitoreo (solo si se ejecutó)
if ($rotation_result['executed'] && $rotation_result['deleted_records'] > 0) {
    $response_data['log_rotation'] = [
        'deleted_records' => $rotation_result['deleted_records'],
        'retention_months' => $rotation_result['retention_months'],
        'remaining_to_clean' => $rotation_result['remaining_to_delete'] ?? 0
    ];
}

json_ok($response_data);
