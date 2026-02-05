<?php
/* =============================================================
 *  Archivo: config.php
 *  Propósito: Configuración base compartida (DB, rutas de media, sesión, helpers básicos).
 *  Notas Fase 2: Añadidos helpers de entorno, endurecimiento de sesión y constantes reutilizables.
 * ============================================================= */

// 0) Helper sencillo para variables de entorno (dot-env o servidor)
if (!function_exists('env')) {
    function env(string $key, $default = null) {
        $v = getenv($key);
        return ($v === false || $v === '') ? $default : $v;
    }
}

// 1) Sesión (para CSRF y auth) con parámetros endurecidos y unificados
if (session_status() === PHP_SESSION_NONE) {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443);
    
    // SEGURIDAD: Configuraciones endurecidas de sesión
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_secure', $isSecure ? '1' : '0');
    
    // Prevenir fijación de sesión
    ini_set('session.use_trans_sid', '0');
    
    // Configurar regeneración de ID más frecuente en producción
    $appEnv = defined('APP_ENV') ? APP_ENV : env('APP_ENV', 'dev');
    if ($appEnv === 'prod') {
        ini_set('session.gc_probability', '1');
        ini_set('session.gc_divisor', '100'); // 1% probabilidad
        ini_set('session.gc_maxlifetime', '1800'); // 30 min máximo
    }
    // SEGURIDAD: Configuración segura según entorno
    $appEnv = defined('APP_ENV') ? APP_ENV : env('APP_ENV', 'dev');
    
    // Usar Lax para compatibilidad en producción (Strict puede causar problemas)
    $defaultSameSite = 'Lax'; // Lax es más compatible que Strict
    $sameSite = strtoupper(env('SESSION_SAMESITE', $defaultSameSite));
    
    if (!in_array($sameSite, ['STRICT','LAX','NONE'], true)) { 
        $sameSite = 'Lax'; // Fallback seguro
    }
    // Si SameSite=None debe ir secure=true para navegadores modernos
    if ($sameSite === 'NONE') { $isSecure = true; }
    // Permitir override de gc_maxlifetime
    $gcMax = (int)env('SESSION_GC_MAXLIFETIME', 0);
    if ($gcMax > 0) { @ini_set('session.gc_maxlifetime', (string)$gcMax); }
    // Permitir path personalizado si se define y existe y es writable
    $customPath = env('SESSION_SAVE_PATH');
    if ($customPath && is_dir($customPath) && is_writable($customPath)) {
        @session_save_path($customPath);
    }
    // SEGURIDAD: Configuración estricta de cookies
    $cookieLifetime = ($appEnv === 'prod') ? 0 : 0; // Siempre session cookies
    $cookieDomain = env('SESSION_COOKIE_DOMAIN', ''); // Permitir override para subdominios
    
    session_set_cookie_params([
        'lifetime' => $cookieLifetime,
        'path' => '/',
        'domain' => $cookieDomain, // Vacío por defecto para máxima seguridad
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => ucfirst(strtolower($sameSite))
    ]);
    session_start();
}

// 2) Carga de override local opcional (no versionado)
//    Puedes crear un archivo config.local.php con tus credenciales y rutas.
$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    require_once $localConfig; // Puede definir DB_*, MEDIA_*, UPLOAD_DIR, etc.
}

// 3) DB (usar variables de entorno si no están definidas en config.local.php)
if (!defined('DB_HOST')) define('DB_HOST', env('DB_HOST', 'localhost'));
if (!defined('DB_USER')) define('DB_USER', env('DB_USER', ''));
if (!defined('DB_PASS')) define('DB_PASS', env('DB_PASS', ''));
if (!defined('DB_NAME')) define('DB_NAME', env('DB_NAME', ''));
if (!defined('DB_PORT')) define('DB_PORT', (int)env('DB_PORT', 3306));
// Opcional: lanzar excepción en lugar de salida JSON al fallar conexión
if (!defined('DB_THROW_EXCEPTIONS')) define('DB_THROW_EXCEPTIONS', false);

function db(): mysqli {
    static $conn;
    if (!$conn) {
        $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
        if ($conn->connect_error) {
            if (DB_THROW_EXCEPTIONS) {
                throw new RuntimeException('DB connection error: ' . $conn->connect_error);
            }
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'DB connection error']);
            exit;
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

// 4) Rutas de media y uploads
//    Prioridad: ENV MEDIA_BASE_DIR -> MEDIA_DIR ya definida (local) -> $docRoot/media
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__), '/\\');
$mediaBase = env('MEDIA_BASE_DIR');
if ($mediaBase) $mediaBase = rtrim($mediaBase, '/\\');
if (!$mediaBase && defined('MEDIA_DIR')) $mediaBase = rtrim(MEDIA_DIR, '/\\');
if (!$mediaBase) $mediaBase = $docRoot . '/media';

if (!defined('MEDIA_DIR')) define('MEDIA_DIR', $mediaBase);
if (!defined('MEDIA_IMAGES_DIR')) define('MEDIA_IMAGES_DIR', MEDIA_DIR . '/imagenes');
if (!defined('MEDIA_VIDEOS_DIR')) define('MEDIA_VIDEOS_DIR', MEDIA_DIR . '/videos');
if (!defined('MEDIA_CATEGORY_ICONS_DIR')) define('MEDIA_CATEGORY_ICONS_DIR', MEDIA_DIR . '/categoryCardImages');
if (!defined('MEDIA_MINISLIDES_DIR')) define('MEDIA_MINISLIDES_DIR', MEDIA_DIR . '/minislides');

// Carpeta de descargas/archivos temporales
$uploadsBase = env('UPLOAD_DIR');
if ($uploadsBase) $uploadsBase = rtrim($uploadsBase, '/\\');
if (!$uploadsBase && defined('UPLOAD_DIR')) $uploadsBase = rtrim(UPLOAD_DIR, '/\\');
if (!$uploadsBase) $uploadsBase = $docRoot . '/uploads';
if (!defined('UPLOAD_DIR')) define('UPLOAD_DIR', $uploadsBase . '/');

// 4.1) Auto creación opcional de subdirectorios de media (desactivado por defecto en prod)
if (!defined('AUTO_CREATE_MEDIA_DIRS')) define('AUTO_CREATE_MEDIA_DIRS', false);
if (AUTO_CREATE_MEDIA_DIRS) {
    foreach ([MEDIA_DIR, MEDIA_IMAGES_DIR, MEDIA_VIDEOS_DIR, MEDIA_CATEGORY_ICONS_DIR, MEDIA_MINISLIDES_DIR, rtrim(UPLOAD_DIR,'/\\')] as $d) {
        if (!is_dir($d)) @mkdir($d, 0755, true);
    }
}

// 4.2) Constantes de límites (usadas en endpoints de subida) si no están ya definidas en config.local.php
if (!defined('MAX_IMAGE_MB')) define('MAX_IMAGE_MB', (int)env('MAX_IMAGE_MB', 5));
if (!defined('MAX_VIDEO_MB')) define('MAX_VIDEO_MB', (int)env('MAX_VIDEO_MB', 100));
if (!defined('MAX_PDF_MB')) define('MAX_PDF_MB', (int)env('MAX_PDF_MB', 15));

// 4.3) Entorno de aplicación
if (!defined('APP_ENV')) define('APP_ENV', env('APP_ENV', 'prod'));
// Modo estricto: no crear directorios automáticamente en runtime (endpoints lanzarán error si faltan)
if (!defined('STRICT_MEDIA_DIRS')) define('STRICT_MEDIA_DIRS', (bool)env('STRICT_MEDIA_DIRS', false));

// 5) CSRF helper sencillo
function csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf_token'];
}

function validate_csrf($token): bool {
    return isset($_SESSION['csrf_token']) && is_string($token) && hash_equals($_SESSION['csrf_token'], $token);
}

// 6) SEGURIDAD: Funciones de validación de sesión endurecida
function secure_session_start(): bool {
    // Regenerar ID de sesión periódicamente para prevenir fijación
    if (session_status() === PHP_SESSION_ACTIVE) {
        $now = time();
        
        // Regenerar cada 10 minutos en producción, 30 en desarrollo
        $regenInterval = (defined('APP_ENV') && APP_ENV === 'prod') ? 600 : 1800;
        
        if (!isset($_SESSION['last_regeneration']) || 
            ($_SESSION['last_regeneration'] + $regenInterval) < $now) {
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = $now;
        }
        
        // Validar IP para prevenir secuestro de sesión (desactivado por problemas con proxies/CDN)
        // NOTA: En producción con CDN como Cloudflare, la IP puede cambiar frecuentemente
        // por lo que esta validación puede causar desconexiones inesperadas
        $validateIP = env('VALIDATE_SESSION_IP', '0'); // Desactivado por defecto
        if ($validateIP === '1') {
            if (isset($_SESSION['client_ip'])) {
                $currentIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                if ($_SESSION['client_ip'] !== $currentIP) {
                    session_destroy();
                    return false;
                }
            } else {
                $_SESSION['client_ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            }
        }
        
        // Validar User-Agent básico para detectar cambios sospechosos (desactivado por problemas con actualizaciones de navegador)
        // NOTA: Los navegadores pueden actualizar su User-Agent automáticamente causando desconexiones
        $validateUA = env('VALIDATE_SESSION_UA', '0'); // Desactivado por defecto
        if ($validateUA === '1') {
            $currentUA = substr(hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 16);
            if (isset($_SESSION['ua_fingerprint'])) {
                if ($_SESSION['ua_fingerprint'] !== $currentUA) {
                    session_destroy();
                    return false;
                }
            } else {
                $_SESSION['ua_fingerprint'] = $currentUA;
            }
        }
        
        return true;
    }
    return false;
}

function validate_session_security(): bool {
    // Verificar configuración de cookies seguras
    $cookieParams = session_get_cookie_params();
    
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                (($_SERVER['SERVER_PORT'] ?? '') == 443);
    
    // En HTTPS, las cookies deben ser seguras
    if ($isSecure && !$cookieParams['secure']) {
        error_log('SECURITY WARNING: Session cookies not secure over HTTPS');
        return false;
    }
    
    // Verificar HttpOnly
    if (!$cookieParams['httponly']) {
        error_log('SECURITY WARNING: Session cookies not HttpOnly');
        return false;
    }
    
    // En producción, verificar SameSite
    if (defined('APP_ENV') && APP_ENV === 'prod' && 
        strtolower($cookieParams['samesite']) !== 'strict') {
        error_log('SECURITY WARNING: Session SameSite not Strict in production');
    }
    
    return true;
}

// 6) Utilidad: normalizar rutas relativas (usable para logging si se desea)
if (!function_exists('path_join')) {
    function path_join(string ...$parts): string {
        $clean = [];
        foreach ($parts as $p) { if ($p === '' || $p === DIRECTORY_SEPARATOR) continue; $clean[] = trim($p, '/\\'); }
        $joined = implode(DIRECTORY_SEPARATOR, $clean);
        return $joined === '' ? '' : ($parts[0][0] === DIRECTORY_SEPARATOR ? DIRECTORY_SEPARATOR . $joined : $joined);
    }
}

?>
