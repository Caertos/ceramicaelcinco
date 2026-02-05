<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_auth_guard.php';
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
/* =============================================================
     Endpoint: update_gallery.php
     Resumen: Renombra el campo nombre de un elemento existente en galería.
     Diccionario:
         - caption: Texto alternativo / descriptivo mostrado al usuario.
     Parámetros: (POST form) id (int), nombre (string). Cabecera X-CSRF-Token opcional.
     Respuesta: { success:true, message:string, data:{ id } }
     ============================================================= */

/*
Nombre de la función: respond
Parámetros: ok (bool), message (string), extra (array), code (int)
Proceso y salida: Envuelve json_ok/json_error manteniendo contrato unificado y permitiendo incluir data.
*/
function respond($ok, $message, $extra = [], $code = 200) {
    if ($ok) {
        json_ok($extra ?: null, $message, $code);
    } else { json_error($message, $code, $extra); }
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
$nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
if ($id <= 0 || $nombre === '') {
    respond(false, 'Parámetros inválidos', [], 400);
}

try {
    $conn = db();
    $stmt = $conn->prepare('UPDATE galeria SET nombre = ? WHERE id = ?');
    if (!$stmt) respond(false, 'Error prepare: ' . $conn->error, [], 500);
    $stmt->bind_param('si', $nombre, $id);
    if (!$stmt->execute()) {
        $err = $stmt->error; $stmt->close();
        respond(false, 'Error execute: ' . $err, [], 500);
    }
    $stmt->close();
    respond(true, 'Elemento actualizado', [ 'id' => $id ]);
} catch (Throwable $e) {
    respond(false, 'Excepción: ' . $e->getMessage(), [], 500);
}
?>
