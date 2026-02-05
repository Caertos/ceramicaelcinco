<?php
require_once __DIR__ . '/_config_loader.php';
/* =============================================================
     Endpoint: download.php
     Resumen: Sirve PDFs de productos en modo inline o descarga (dl=1) con
                        soporte Range (reanudación / vistas parciales) y fallback diagnóstico.
     Diccionario:
         - Range: Cabecera solicitando bytes parciales.
         - Content-Disposition: Define inline vs attachment.
     Parámetros (GET): id (int), dl (bool opcional), dbg (bool diagnóstico rutas).
     Respuesta: 200/206 binario; 4xx/5xx texto plano; 500 JSON si dbg=1.
     ============================================================= */

$DEBUG = isset($_GET['dbg']) && ($_GET['dbg'] === '1' || $_GET['dbg'] === 'true');

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) { http_response_code(400); exit('ID inválido'); }

$conn = db();
$stmt = $conn->prepare("SELECT archivo, nombre FROM productos WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
if (!$row) { http_response_code(404); exit('Producto no encontrado'); }

$filename = $row['archivo'];
$downloadName = $row['nombre'] ?? basename($filename);
$forceDownload = isset($_GET['dl']) && ($_GET['dl'] == '1' || $_GET['dl'] === 'true');

$candidateRoots = [];
if (defined('UPLOAD_DIR')) { $candidateRoots[] = rtrim(UPLOAD_DIR, "/\\"); }
$docRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;
if ($docRoot) { $candidateRoots[] = rtrim($docRoot, '/\\') . '/uploads'; }
$parent = $docRoot ? dirname($docRoot) : null; // public_html -> domains/<dominio>
if ($parent && $parent !== '/' && $parent !== '') { $candidateRoots[] = rtrim($parent, '/\\') . '/uploads'; }
$user = function_exists('get_current_user') ? @get_current_user() : '';
if ($user) { $candidateRoots[] = '/home/' . $user . '/uploads'; }

$attempts = [];
$filepath = null;
$baseReal = null; // raíz efectiva donde se encontró
foreach ($candidateRoots as $root) {
    $rootReal = realpath($root);
    if ($rootReal === false) {
        $attempts[] = ['root' => $root, 'exists' => false];
        continue;
    }
    $requestedPath = $rootReal . DIRECTORY_SEPARATOR . $filename;
    $real = realpath($requestedPath);
    $attempts[] = [
        'root' => $rootReal,
        'candidate' => $requestedPath,
        'resolved' => $real ?: null,
        'ok' => ($real && strpos($real, $rootReal) === 0 && is_file($real))
    ];
    if ($real && strpos($real, $rootReal) === 0 && is_file($real)) {
        $filepath = $real;
        $baseReal = $rootReal;
        break;
    }
}

if (!$filepath) {
    if ($DEBUG) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            'error' => 'Directorio de uploads no disponible o archivo no encontrado',
            'id' => $id,
            'filename' => $filename,
            'documentRoot' => $docRoot,
            'candidateRoots' => $candidateRoots,
            'attempts' => $attempts
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    $anyRootExists = array_reduce($attempts, function($acc, $a){ return $acc || (!empty($a['root']) && !empty($a['candidate'])); }, false);
    http_response_code($anyRootExists ? 404 : 500);
    exit($anyRootExists ? 'Archivo no encontrado en el servidor' : 'Directorio de uploads no disponible');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $filepath);
finfo_close($finfo);

if ($mime !== 'application/pdf') {
    http_response_code(415);
    exit('Tipo de archivo no soportado');
}

$filesize = filesize($filepath);

$start = 0;
$end = $filesize - 1;
$httpRange = isset($_SERVER['HTTP_RANGE']) ? $_SERVER['HTTP_RANGE'] : null;
if ($httpRange) {
    if (preg_match('/bytes=(\d*)-(\d*)/', $httpRange, $matches)) {
        if ($matches[1] !== '') $start = intval($matches[1]);
        if ($matches[2] !== '') $end = intval($matches[2]);
    }
    if ($start > $end || $start < 0 || $end >= $filesize) {
        header('HTTP/1.1 416 Requested Range Not Satisfiable');
        header("Content-Range: bytes */$filesize");
        exit;
    }
    $statusHeader = 'HTTP/1.1 206 Partial Content';
} else {
    $statusHeader = 'HTTP/1.1 200 OK';
}

$length = $end - $start + 1;

header($statusHeader);
header('Content-Type: ' . $mime);
header('X-Content-Type-Options: nosniff');
$dispositionFilename = basename($downloadName);

if ($forceDownload) {
    header('Content-Disposition: attachment; filename="' . $dispositionFilename . '"; filename*=UTF-8\'\'' . rawurlencode($dispositionFilename));
} else {
    header('Content-Disposition: inline; filename="' . $dispositionFilename . '"; filename*=UTF-8\'\'' . rawurlencode($dispositionFilename));
}

header('Accept-Ranges: bytes');
header('Content-Length: ' . $length);
header('Cache-Control: private, must-revalidate');
header('Pragma: public');
// Si quieres, añade cache largo: header('Cache-Control: public, max-age=86400');

$fp = fopen($filepath, 'rb');
if ($fp === false) { http_response_code(500); exit('No se puede abrir el archivo'); }

fseek($fp, $start);

$bufferSize = 8192;
$bytesSent = 0;
while (!feof($fp) && $bytesSent < $length) {
    $readSize = min($bufferSize, $length - $bytesSent);
    $data = fread($fp, $readSize);
    echo $data;
    flush();
    $bytesSent += strlen($data);
}
fclose($fp);
exit;
