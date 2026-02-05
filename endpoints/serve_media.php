<?php
// Definir bandera antes de cargar config para evitar headers restrictivos de CORP
define('SERVING_MEDIA_FILES', true);
require_once __DIR__ . '/_config_loader.php';
/* =============================================================
   Endpoint: serve_media.php
   Resumen: Sirve archivos bajo media/ validando rutas (sin traversal),
            generando cabeceras de caché (ETag/Last-Modified) y soportando Range.
   Diccionario:
     - 304 Not Modified: Cliente posee versión válida (sin cuerpo).
   Parámetros (GET): p (ruta relativa con o sin prefijo media/).
   Respuesta: 200/206 binario; 304 caché válida; 404 inexistente; 416 rango inválido.
   ============================================================= */

// Evitar que cabeceras globales (p.ej. de sesión) impongan no-cache/Expires 1981
if (function_exists('header_remove')) {
  @header_remove('Pragma');
  @header_remove('Expires');
}

// CORRECCIÓN DE SEGURIDAD: Restringir raíces según entorno
$BASE_ROOTS = [];

// En producción, usar SOLO la raíz definida en config
if (defined('APP_ENV') && APP_ENV === 'prod') {
  // Solo usar MEDIA_DIR si está definido, sino usar ruta segura por defecto
  if (defined('MEDIA_DIR')) {
    $BASE_ROOTS[] = rtrim(MEDIA_DIR, '/\\');
  } else {
    // Ruta segura por defecto fuera de public_html para Hostinger
    $BASE_ROOTS[] = '/home/' . (get_current_user() ?: 'user') . '/media';
  }
} else {
  // En desarrollo, mantener múltiples raíces para flexibilidad
  if (defined('MEDIA_DIR')) { $BASE_ROOTS[] = rtrim(MEDIA_DIR, '/\\'); }
  $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? rtrim(dirname(__DIR__), '/\\');
  $BASE_ROOTS[] = rtrim($docRoot, '/\\') . '/media';
  $parent1 = dirname($docRoot); // domains/<dominio>
  if ($parent1 && $parent1 !== '/' && $parent1 !== '') {
    $BASE_ROOTS[] = rtrim($parent1, '/\\') . '/media';
  }
  $home3 = dirname($docRoot, 3); // /home/<user>
  if ($home3 && $home3 !== '/' && is_dir($home3)) {
    $BASE_ROOTS[] = rtrim($home3, '/\\') . '/media';
  }
  $u = function_exists('get_current_user') ? @get_current_user() : '';
  if ($u) {
    $BASE_ROOTS[] = '/home/' . $u . '/media';
  }
}

$p = isset($_GET['p']) ? $_GET['p'] : '';
$p = ltrim($p, '/');
if ($p === '') { http_response_code(400); exit('Parámetro inválido'); }

// CORRECCIÓN DE SEGURIDAD: Whitelist de extensiones permitidas
$ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'avi', 'mov', 'pdf'];
$extension = strtolower(pathinfo($p, PATHINFO_EXTENSION));
if (!in_array($extension, $ALLOWED_EXTENSIONS, true)) {
    error_log("serve_media.php: Extensión no permitida: $extension para archivo: $p desde IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    http_response_code(403);
    exit('Tipo de archivo no permitido');
}

$parts = explode('/', $p);
$cleanParts = [];
foreach ($parts as $part) {
  if ($part === '' || $part === '.' || $part === '..') continue;
  $cleanParts[] = $part;
}
$relPath = implode('/', $cleanParts);

$filepath = null;
$relCandidates = [$relPath];
if (strpos($relPath, 'media/') === 0) {
  $relCandidates[] = substr($relPath, 6); // sin 'media/'
} else {
  $relCandidates[] = 'media/' . $relPath; // con 'media/'
}

//

foreach ($BASE_ROOTS as $root) {
  $baseReal = realpath($root);
  if ($baseReal === false) continue;
  foreach ($relCandidates as $rel) {
    $candidate = $baseReal . DIRECTORY_SEPARATOR . $rel;
    $real = realpath($candidate);
    if ($real && strpos($real, $baseReal) === 0 && is_file($real)) {
      $filepath = $real;
      break 2;
    }
  }
}

if (!$filepath) {
  // CORRECCIÓN DE SEGURIDAD: Logging de accesos denegados
  $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
  $referer = $_SERVER['HTTP_REFERER'] ?? 'direct';
  
  error_log("serve_media.php: ACCESO DENEGADO - Archivo no encontrado: '$p' | IP: $clientIP | UA: $userAgent | Referer: $referer");
  
  // En producción, logging adicional a archivo específico
  if (defined('APP_ENV') && APP_ENV === 'prod') {
    $logLine = date('Y-m-d H:i:s') . " | DENIED | $p | $clientIP | $userAgent\n";
    @file_put_contents('/tmp/media_access_denied.log', $logLine, FILE_APPEND | LOCK_EX);
  }
  
  http_response_code(404);
  exit('Archivo no encontrado');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $filepath);
finfo_close($finfo);
// Metadatos de caché
$size = filesize($filepath);
$mtime = @filemtime($filepath) ?: time();
$lastModified = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';
// CORRECCIÓN DE SEGURIDAD: ETag sin exponer rutas del sistema
$etag = 'W/"' . md5(basename($filepath) . '|' . $mtime . '|' . $size) . '"';

header('Content-Type: ' . $mime);
header('X-Content-Type-Options: nosniff');
header('Content-Disposition: inline; filename="' . basename($filepath) . '"');
header('Last-Modified: ' . $lastModified);
header('ETag: ' . $etag);
// Caché para clientes y CDN. Puedes ajustar s-maxage para CDN si lo deseas.
header('Cache-Control: public, max-age=86400, s-maxage=86400, immutable');
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
header('Accept-Ranges: bytes');

// Condicionales: 304 Not Modified (si no es petición Range)
$ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
$ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
$hasRange = isset($_SERVER['HTTP_RANGE']);
if (!$hasRange && $ifNoneMatch === $etag) {
  http_response_code(304);
  exit;
}
if (!$hasRange && $ifModifiedSince) {
  $imsTime = strtotime($ifModifiedSince);
  if ($imsTime !== false && $imsTime >= $mtime) {
    http_response_code(304);
    exit;
  }
}

// Soporte para Range (206) útil para video/audio
if ($hasRange) {
  $range = $_SERVER['HTTP_RANGE']; // p.ej. "bytes=0-1023"
  if (preg_match('/bytes=([0-9]*)-([0-9]*)/', $range, $m)) {
    $start = $m[1] === '' ? 0 : (int)$m[1];
    $end = $m[2] === '' ? ($size - 1) : (int)$m[2];
    if ($start > $end || $start >= $size) {
      http_response_code(416); // Range Not Satisfiable
      header('Content-Range: bytes */' . $size);
      exit;
    }
    if ($end >= $size) { $end = $size - 1; }
    $length = $end - $start + 1;

    http_response_code(206);
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    header('Content-Length: ' . $length);

    $fp = fopen($filepath, 'rb');
    if ($fp === false) {
      http_response_code(500);
      exit('No se pudo abrir el archivo');
    }
    if ($start > 0) {
      fseek($fp, $start);
    }
    $bufferSize = 8 * 1024 * 1024; // 8MB
    $bytesLeft = $length;
    while ($bytesLeft > 0 && !feof($fp)) {
      $read = ($bytesLeft > $bufferSize) ? $bufferSize : $bytesLeft;
      $data = fread($fp, $read);
      if ($data === false) break;
      echo $data;
      $bytesLeft -= strlen($data);
      @ob_flush();
      flush();
    }
    fclose($fp);
    exit;
  }
}

// Respuesta completa (200)
header('Content-Length: ' . $size);
readfile($filepath);
exit;
