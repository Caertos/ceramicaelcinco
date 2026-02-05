<?php
/* =============================================================
     Endpoint: post_gallery.php
     Resumen: Sube imagen o video; valida tamaño/MIME, convierte a WebP cuando
                        es posible y genera miniatura para video (ffmpeg) si disponible.
     Diccionario:
         - WebP: Formato optimizado de imagen.
         - ffmpeg: Herramienta CLI para procesar frames de video.
         - CSRF: Token antifalsificación (opcional cabecera X-CSRF-Token).
     Parámetros (POST multipart): nombre, tipo ('foto'|'video'), archivo.
     Respuesta: { success:boolean, message:string, data:{ id, nombre, url, tipo, thumb } }
     ============================================================= */
// Evita que warnings/fatals se impriman y rompan el JSON
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ini_set('error_log', __DIR__ . '/php_errors.log');
ob_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_auth_guard.php';
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
// Límites configurables (MB)
$MAX_IMAGE_MB = defined('MAX_IMAGE_MB') ? (int)MAX_IMAGE_MB : 5;
$MAX_VIDEO_MB = defined('MAX_VIDEO_MB') ? (int)MAX_VIDEO_MB : 100;

/*
Nombre de la función: is_function_enabled
Parámetros: fn (string)
Proceso y salida: Devuelve true si la función existe y no está listada en disable_functions.
*/
function is_function_enabled($fn) {
    if (!function_exists($fn)) return false;
    $disabled = @ini_get('disable_functions');
    if ($disabled && stripos($disabled, $fn) !== false) return false;
    return true;
}

/*
Nombre de la función: run_shell
Parámetros: cmd (string)
Proceso y salida: Ejecuta el comando si shell_exec está habilitado; retorna salida o null.
*/
function run_shell($cmd) {
    if (!is_function_enabled('shell_exec')) return null;
    return @shell_exec($cmd);
}

/*
Nombre de la función: json_response
Parámetros: ok (bool), message (string), extra (array), code (int)
Proceso y salida: Envuelve json_ok/json_error limpiando buffers previos y preservando contrato.
*/
function json_response($ok, $message, $extra = [], $code = 200) {
    // Limpiar cualquier salida previa para no corromper el JSON
    if (ob_get_length()) { @ob_clean(); }
    if ($ok) {
        // Mantener contrato actual: { success, message, ...extra }
        json_ok(null, $message, $code, $extra);
    } else {
        json_error($message, $code, $extra);
    }
}
// Autenticación obligatoria sin emisión de JSON previa
$authCtx = require_auth();
// CSRF obligatorio (mutación)
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
    json_response(false, 'Token CSRF requerido o inválido', ['csrf_required'=>true], 403);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Método no permitido', [], 405);
}
$nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
$tipo   = isset($_POST['tipo']) ? trim($_POST['tipo']) : '';

if ($nombre === '' || ($tipo !== 'foto' && $tipo !== 'video')) {
    json_response(false, 'Parámetros inválidos (nombre / tipo)');
}

$file = $_FILES['archivo'];

// Validación de archivo subido
if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    $errMap = [
        UPLOAD_ERR_INI_SIZE => 'Archivo excede upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'Archivo excede MAX_FILE_SIZE del formulario',
        UPLOAD_ERR_PARTIAL => 'Archivo subido parcialmente',
        UPLOAD_ERR_NO_FILE => 'No se envió archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal',
        UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir en disco',
        UPLOAD_ERR_EXTENSION => 'Extensión detenida por una extensión de PHP'
    ];
    $phpErr = $_FILES['archivo']['error'] ?? -1;
    json_response(false, 'Error en subida: ' . ($errMap[$phpErr] ?? 'Desconocido')); 
}

// Validación básica de tipo
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($tipo === 'foto') {
    $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($extension, $allowedExt, true)) {
        json_response(false, 'Tipo de imagen no permitido. Use: ' . implode(', ', $allowedExt));
    }
} else { // video
    $allowedExt = ['mp4', 'webm', 'mov', 'avi', 'ogg'];
    if (!in_array($extension, $allowedExt, true)) {
        json_response(false, 'Tipo de video no permitido. Use: ' . implode(', ', $allowedExt));
    }
}

// Base de media: priorizar MEDIA_DIR externo si está definido
$baseMedia = defined('MEDIA_DIR')
    ? rtrim(MEDIA_DIR, '/\\') . '/'
    : (rtrim(dirname(__DIR__), '/\\') . '/media/');

$dir_imagenes = defined('MEDIA_IMAGES_DIR')
    ? rtrim(MEDIA_IMAGES_DIR, '/\\') . '/'
    : ($baseMedia . 'imagenes/');

$dir_videos = defined('MEDIA_VIDEOS_DIR')
    ? rtrim(MEDIA_VIDEOS_DIR, '/\\') . '/'
    : ($baseMedia . 'videos/');

foreach ([$dir_imagenes, $dir_videos] as $d) {
    if (!is_dir($d)) {
        if (!mkdir($d, 0755, true)) {
            json_response(false, 'Error del servidor: No se puede crear el directorio de destino. Contacte al administrador.', [], 500);
        }
    }
    if (!is_writable($d)) {
        json_response(false, 'Error del servidor: No se tienen permisos de escritura. Contacte al administrador.', [], 500);
    }
}

// Directorio y URL base según tipo
if ($tipo === 'foto') {
    $uploadDir = $dir_imagenes;
    $urlBase = 'media/imagenes/';
} else { // video
    $uploadDir = $dir_videos;
    $urlBase = 'media/videos/';
}

// Generar nombre seguro del archivo
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
$nameNoExt = $safeName ? substr($safeName, 0, 50) : 'file'; // Fallback si está vacío

// Detectar tipo MIME del archivo
$mime = function_exists('mime_content_type') ? @mime_content_type($file['tmp_name']) : ($file['type'] ?? '');
$timestamp = time();
$alreadySaved = false;

if ($tipo === 'foto') {
    $isWebp = ($extension === 'webp');
    $canConvert = function_exists('imagewebp') && (!defined('DISABLE_WEBP_CONVERT') || !DISABLE_WEBP_CONVERT);
    if (!$isWebp && $canConvert) {
        // Generar destino final .webp
        $fileName = $timestamp . '_' . $nameNoExt . '.webp';
        $targetFile = $uploadDir . $fileName;

        // Crear recurso según origen
        $imgResource = null;
        if (($mime === 'image/jpeg' || $extension === 'jpg' || $extension === 'jpeg')) {
            if (function_exists('imagecreatefromjpeg')) {
                $imgResource = @imagecreatefromjpeg($file['tmp_name']);
            }
        } elseif ($mime === 'image/png' || $extension === 'png') {
            if (function_exists('imagecreatefrompng')) {
                $imgResource = @imagecreatefrompng($file['tmp_name']);
            }
            if ($imgResource) {
                if (function_exists('imagepalettetotruecolor')) { @imagepalettetotruecolor($imgResource); }
                @imagesavealpha($imgResource, true);
            }
        } elseif ($mime === 'image/gif' || $extension === 'gif') {
            if (function_exists('imagecreatefromgif')) {
                $imgResource = @imagecreatefromgif($file['tmp_name']);
            }
            if ($imgResource && function_exists('imagepalettetotruecolor')) { @imagepalettetotruecolor($imgResource); }
        }

        if ($imgResource) {
            $ok = @imagewebp($imgResource, $targetFile, 85);
            @imagedestroy($imgResource);
            if (!$ok) {
                // Fallback a guardar original si no se pudo convertir
                $alreadySaved = false;
            } else {
                @unlink($file['tmp_name']); // limpiar tmp original
                $url = $urlBase . $fileName;
                $extension = 'webp';
                $mime = 'image/webp';
                $alreadySaved = true;
            }
        } // si no hubo recurso, se mantiene alreadySaved=false y se guarda original
    }
}

if (!$alreadySaved) {
    // Guardar archivo tal cual (webp o video u otros formatos de imagen si no se pudo convertir)
    $fileName = $timestamp . '_' . $nameNoExt . '.' . $extension;
    $targetFile = $uploadDir . $fileName;
    $url = $urlBase . $fileName;
    if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
        json_response(false, 'Error del servidor: No se pudo guardar el archivo. Intente nuevamente o contacte al administrador.', [], 500);
    }
}

// Verificación final: asegurar que el archivo existe y tiene tamaño > 0
if (!is_file($targetFile) || filesize($targetFile) <= 0) {
    error_log('[post_gallery] Archivo no encontrado tras guardar: ' . $targetFile . ' | dir=' . $uploadDir . ' | writable=' . (is_writable($uploadDir) ? '1' : '0'));
    json_response(false, 'Error del servidor: El archivo se subió pero no se pudo verificar. Contacte al administrador.', [
        'path' => basename($targetFile)
    ], 500);
}

// Si es video, intentar generar thumbnail (webp) con ffmpeg en media/imagenes/thumbs
$thumbUrl = null;
if ($tipo === 'video') {
    $thumbsDir = rtrim($dir_imagenes, '/\\') . '/thumbs/';
    if (!is_dir($thumbsDir)) { @mkdir($thumbsDir, 0755, true); }
    if (is_dir($thumbsDir) && is_writable($thumbsDir)) {
        $baseNoExt = preg_replace('/\.[a-zA-Z0-9]+$/', '', basename($targetFile));
        $thumbName = $baseNoExt . '.webp';
        $thumbPath = $thumbsDir . $thumbName;
        // Comando ffmpeg: tomar frame al segundo 1, escalar ancho 640 manteniendo proporción
        if (is_function_enabled('shell_exec')) {
            $which = run_shell('command -v ffmpeg 2>/dev/null');
            $ffmpeg = $which ? trim((string)$which) : '';
            if ($ffmpeg) {
                $cmd = sprintf('%s -y -ss 1 -i %s -vframes 1 -vf "scale=640:-1" %s 2>&1',
                    escapeshellcmd($ffmpeg), escapeshellarg($targetFile), escapeshellarg($thumbPath)
                );
                $out = run_shell($cmd);
                if (is_file($thumbPath) && filesize($thumbPath) > 0) {
                    $thumbUrl = 'media/imagenes/thumbs/' . $thumbName;
                } else {
                    @error_log('[post_gallery] ffmpeg failed to create thumbnail: ' . $cmd . ' | out=' . $out);
                }
            } else {
                @error_log('[post_gallery] ffmpeg not found; skipping video thumbnail');
            }
        } else {
            @error_log('[post_gallery] shell_exec disabled; skipping video thumbnail');
        }
    } else {
        @error_log('[post_gallery] thumbsDir not writable: ' . $thumbsDir);
    }
}

try {
    $conn = db();
    $stmt = $conn->prepare('INSERT INTO galeria (nombre, url, tipo) VALUES (?, ?, ?)');
    if (!$stmt) {
        json_response(false, 'Error interno del servidor: No se pudo preparar la consulta', [], 500);
    }
    $stmt->bind_param('sss', $nombre, $url, $tipo);
    if (!$stmt->execute()) {
        if (is_file($targetFile)) @unlink($targetFile);
        json_response(false, 'Error interno del servidor: No se pudo guardar en la base de datos', [], 500);
    }
    $stmt->close();
    $newId = $conn->insert_id;

    // Intentar guardar thumb_url si existe columna; primero intentar crearla si no existe
    if ($tipo === 'video' && $thumbUrl) {
        // Crear columna si no existe (compatibilidad amplia)
        $hasThumb = false;
        if ($qc = @$conn->query("SHOW COLUMNS FROM galeria LIKE 'thumb_url'")) {
            $hasThumb = (bool)$qc->num_rows; $qc->close();
        }
        if (!$hasThumb) {
            @mysqli_query($conn, 'ALTER TABLE galeria ADD COLUMN thumb_url VARCHAR(255) NULL');
        }
        if ($q = @mysqli_prepare($conn, 'UPDATE galeria SET thumb_url = ? WHERE id = ?')) {
            @mysqli_stmt_bind_param($q, 'si', $thumbUrl, $newId);
            @mysqli_stmt_execute($q);
            @mysqli_stmt_close($q);
        }
    }
    // Log de éxito con ruta real para diagnóstico
    log_file_action($conn, $_SESSION, 'gallery_upload_' . $tipo, basename($targetFile), $targetFile, ['galeria_id' => $newId, 'thumb' => $thumbUrl]);
    @error_log('[post_gallery] OK saved: ' . $targetFile . ' | url=' . $url . ($thumbUrl ? (' | thumb=' . $thumbUrl) : ''));
    // Respuesta unificada: el objeto de la nueva entrada va directo en "data"
    if (ob_get_length()) { @ob_clean(); }
    json_ok([
        'id' => $newId,
        'nombre' => $nombre,
        'url' => $url,
        'tipo' => $tipo,
        'thumb' => $thumbUrl
    ], 'Archivo subido con éxito');
} catch (Throwable $e) {
    if (isset($targetFile) && is_file($targetFile)) @unlink($targetFile);
    error_log('ERROR en post_gallery.php: ' . $e->getMessage() . ' en línea ' . $e->getLine());
    json_response(false, 'Error interno del servidor: El servicio no puede procesar la solicitud en este momento', [], 500);
}
?>
