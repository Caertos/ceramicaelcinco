<?php
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json; charset=utf-8');
/* =============================================================
     Endpoint: users.php
     Resumen: Gestiona operaciones CRUD sobre usuarios y cambios de rol / contraseña.
                        Requiere sesión autenticada; acciones mutantes protegidas por rol 'super'
                        (salvo cambio de contraseña propia) y token CSRF.
     Diccionario:
         - CRUD: Crear, Leer, Actualizar, Eliminar.
         - promote: Acción para cambiar el rol de un usuario (user ↔ super).
         - CSRF: Token anti falsificación exigido en mutaciones.
     Parámetros (query/body):
         - action (GET): list | create | update_password | promote
         - create (POST JSON): { username, password, role?='user' }
         - update_password (POST JSON):
                 * super → { user_id, new_password }
                 * usuario normal → { current_password, new_password }
         - promote (POST JSON): { user_id, role='user'|'super' }
     Respuestas:
         - Éxito: { success:true, data?, message? }
         - Error: { success:false, message:string, csrf_required?:true }
     Notas:
         - Las validaciones de formato de username y presencia de password se aplican antes de escribir en DB.
         - Hash de password generado con password_hash() (algoritmo por defecto).
     ============================================================= */

if (!isset($_SESSION['usuario'])) {
    json_error('No autenticado', 401);
}
$conn = db();
ensure_user_schema($conn);
$role = $_SESSION['role'] ?? 'user';
$action = $_GET['action'] ?? 'list';



// Nombre de la función: require_csrf_if_post
// Parámetros: action (string)
// Proceso y salida: Si la petición es POST y la acción es mutante, exige y valida token CSRF en cabecera o cuerpo.
function require_csrf_if_post(string $action): void {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') return; // Sólo POST
    // Acciones que mutan
    $mutating = ['create','update_password','promote'];
    if (!in_array($action, $mutating, true)) return;
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (!$token) {
        // Intentar cuerpo JSON
        $maybe = read_json_body();
        if (isset($maybe['csrf_token'])) $token = $maybe['csrf_token'];
        // Si no era JSON, intentar POST form
        if (!$token && isset($_POST['csrf_token'])) $token = $_POST['csrf_token'];
    }
    if (!$token || !validate_csrf($token)) {
        json_error('CSRF token inválido o ausente', 400, ['csrf_required'=>true]);
    }
}

require_csrf_if_post($action);

// Nombre de la función: require_super
// Parámetros: role (string)
// Proceso y salida: Lanza error 403 si el rol no es 'super'.
function require_super($role) { if ($role !== 'super') json_error('No autorizado (super requerido)', 403); }

switch ($action) {
    case 'list':
        require_super($role);
        $res = $conn->query("SELECT id, username, role, created_at FROM usuarios ORDER BY id ASC");
        $users = [];
        while ($r = $res->fetch_assoc()) { unset($r['password']); $users[] = $r; }
        json_ok($users);
        break;
    case 'create':
        require_super($role);
        $body = read_json_body();
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        $newRole = $body['role'] ?? 'user';
        if ($username === '' || $password === '') json_error('Datos incompletos');
        if (!preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $username)) json_error('Username inválido');
        if (!in_array($newRole, ['user','super'], true)) json_error('Role inválido');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare('INSERT INTO usuarios (username, password, role) VALUES (?,?,?)');
        $stmt->bind_param('sss', $username, $hash, $newRole);
        if (!$stmt->execute()) json_error('No se pudo crear usuario: ' . $stmt->error, 500);
        json_ok(['id' => $stmt->insert_id], 'Usuario creado');
        break;
    case 'update_password':
        $body = read_json_body();
        $targetId = isset($body['user_id']) ? (int)$body['user_id'] : null;
        $newPass = $body['new_password'] ?? '';
        $current = $body['current_password'] ?? '';
        if ($newPass === '') json_error('Nueva contraseña requerida');
        if ($targetId) { // super cambiando a otro
            require_super($role);
            $hash = password_hash($newPass, PASSWORD_DEFAULT);
            $stmt = $conn->prepare('UPDATE usuarios SET password=? WHERE id=?');
            $stmt->bind_param('si', $hash, $targetId);
            if (!$stmt->execute()) json_error('Error al actualizar: ' . $stmt->error, 500);
            json_ok(null, 'Contraseña actualizada (forzada)');
        } else { // usuario cambiando la suya
            $uid = $_SESSION['user_id'] ?? null;
            if (!$uid) json_error('Sesión inválida', 400);
            // Verificar password actual
            $stmt = $conn->prepare('SELECT password FROM usuarios WHERE id=?');
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            if (!$row || !password_verify($current, $row['password'])) json_error('Contraseña actual incorrecta', 403);
            $hash = password_hash($newPass, PASSWORD_DEFAULT);
            $upd = $conn->prepare('UPDATE usuarios SET password=? WHERE id=?');
            $upd->bind_param('si', $hash, $uid);
            if (!$upd->execute()) json_error('Error al actualizar: ' . $upd->error, 500);
            json_ok(null, 'Contraseña actualizada');
        }
        break;
    case 'promote':
        require_super($role);
        $body = read_json_body();
        $uid = (int)($body['user_id'] ?? 0);
        $newRole = $body['role'] ?? '';
        if ($uid <= 0) json_error('user_id requerido');
        if (!in_array($newRole, ['user','super'], true)) json_error('Role inválido');
        $stmt = $conn->prepare('UPDATE usuarios SET role=? WHERE id=?');
        $stmt->bind_param('si', $newRole, $uid);
        if (!$stmt->execute()) json_error('Error al actualizar role: ' . $stmt->error, 500);
        json_ok(null, 'Role actualizado');
        break;
    default:
        json_error('Acción no válida', 404);
}
