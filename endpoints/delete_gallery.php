<?php
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ini_set('error_log', __DIR__ . '/php_errors.log');
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_auth_guard.php';
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
/* =============================================================
     Endpoint: delete_gallery.php
     Resumen: Elimina un registro de galería y su archivo físico si está bajo MEDIA_DIR.
     Diccionario:
         - MEDIA_DIR: Directorio raíz configurado para almacenamiento de media.
     Parámetros: (POST) id (int). Cabecera X-CSRF-Token opcional.
     Respuesta: { success:true, message:string, data:{ fileDeleted, deletedPath?, id } }
     ============================================================= */

/*
Nombre de la función: respond
Parámetros: ok (bool), message (string), extra (array), code (int)
Proceso y salida: Wrapper para json_ok/json_error enviando extra como data.
*/
function respond($ok, $message, $extra = [], $code = 200) {
    $payload = $extra ?: null;
    if ($ok) { json_ok($payload, $message, $code); }
    else { json_error($message, $code, $extra); }
}

// CSRF obligatorio
$authCtx = require_auth();
$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if ($csrfHeader === '' && function_exists('getallheaders')) {
    $headers = getallheaders();
    if (is_array($headers)) {
        foreach ($headers as $k => $v) {
            if (strcasecmp($k, 'X-CSRF-Token') === 0) { $csrfHeader = $v; break; }
        }
    }
}
if ($csrfHeader === '' || !validate_csrf($csrfHeader)) {
    respond(false, 'Token CSRF requerido o inválido', ['csrf_required'=>true], 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método no permitido', [], 405);
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($id <= 0) {
    respond(false, 'ID inválido', [], 400);
}

try {
    $conn = db();
    $stmt = $conn->prepare('SELECT url FROM galeria WHERE id = ?');
    if (!$stmt) respond(false, 'Error prepare select: ' . $conn->error, [], 500);
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        $err = $stmt->error; $stmt->close();
        respond(false, 'Error execute select: ' . $err, [], 500);
    }
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();

    if (!$row) {
        respond(false, 'Registro no encontrado', [], 404);
    }

    $relativePath = ltrim($row['url'], '/'); // media/imagenes/xxx.jpg
    if (!defined('MEDIA_DIR')) {
        respond(false, 'MEDIA_DIR no está definido en config.php', [ 'url' => $relativePath ], 500);
    }
    $base = rtrim(MEDIA_DIR, '/\\');
    $rel = preg_replace('#^media/#', '', $relativePath);
    $candidate = $base . '/' . $rel;

    $deletedFile = false;
    $deletedPath = null;
    if (is_file($candidate)) {
        $deletedFile = @unlink($candidate);
        if ($deletedFile) { $deletedPath = $candidate; }
    }

    // Borrar registro de la DB
    $del = $conn->prepare('DELETE FROM galeria WHERE id = ?');
    if (!$del) respond(false, 'Error prepare delete: ' . $conn->error, [], 500);
    $del->bind_param('i', $id);
    if (!$del->execute()) {
        $err = $del->error; $del->close();
        respond(false, 'Error execute delete: ' . $err, [], 500);
    }
    $del->close();

    respond(true, 'Elemento eliminado', [
        'fileDeleted' => $deletedFile,
        'deletedPath' => $deletedPath,
        'id' => $id
    ]);
} catch (Throwable $e) {
    respond(false, 'Excepción: ' . $e->getMessage(), [], 500);
}
