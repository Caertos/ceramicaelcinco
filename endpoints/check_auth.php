<?php
/* =============================================================
   Endpoint: check_auth.php
   Resumen: Verifica sesión activa, tiempos restantes (inactividad/absoluto),
            renueva actividad con ?refresh=1 y revoca si cambia fingerprint UA.
   Diccionario:
     - idle timeout: Expiración por inactividad.
     - absolute timeout: Límite total de vida de sesión.
     - ua_hash: Hash parcial del User-Agent guardado en login.
   Parámetros: refresh (query o POST opcional) → renueva last_activity.
   Respuesta 200: { success:true, authenticated:true, user, role, idle_remaining, absolute_remaining }
   Respuesta 401: { success:false, authenticated:false, reason:... }
   ============================================================= */
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';

// Headers básicos de seguridad sin interferir con la sesión
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_ok(['ok' => true], null);
}

// Timeouts balanceados para producción
$IDLE_MAX = 3600; // 1 hora de inactividad (razonable para admin)
$ABSOLUTE_MAX = 14400; // 4 horas máximo total (como estaba originalmente)
$REGEN_INTERVAL = 1200; // 20 minutos para regeneración (compromiso entre seguridad y estabilidad)

$now = time();

// SEGURIDAD: Validar configuración de sesión (no bloqueante)
if (!validate_session_security()) {
    error_log('SECURITY WARNING: Session configuration does not meet security standards');
}

// SEGURIDAD: Aplicar validaciones de sesión endurecida (fallback a sesión estándar)
if (!secure_session_start()) {
    // Fallback: intentar sesión estándar si la segura falla
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    error_log('SECURITY WARNING: Falling back to standard session due to security validation failure');
}

if (!isset($_SESSION['usuario'])) {
    json_error('No autenticado', 401, [
        'authenticated' => false,
        'reason' => 'not_logged_in'
    ]);
}

// Validación opcional de integridad básica: si se guardó ua_hash en login y cambia el user-agent hash => forzar logout suave
$currentUa = $_SERVER['HTTP_USER_AGENT'] ?? '';
$currentUaHash = $currentUa ? substr(hash('sha256', $currentUa),0,32) : null;
// Configuración flexible de User-Agent para producción
$enforceUa = getenv('ENFORCE_UA_HASH');
if ($enforceUa === false && defined('ENFORCE_UA_HASH')) { $enforceUa = ENFORCE_UA_HASH ? '1':'0'; }
$enforceUa = $enforceUa === false ? '0' : $enforceUa; // Por defecto desactivado para evitar problemas
if ($enforceUa !== '0') {
    if (!empty($_SESSION['ua_hash']) && $currentUaHash && $_SESSION['ua_hash'] !== $currentUaHash) {
        session_unset();
        session_destroy();
        json_error('Sesión invalidada (cambio de agente)', 401, [
            'authenticated' => false,
            'reason' => 'ua_changed',
            'expected_ua_hash' => $_SESSION['ua_hash'] ?? null,
            'current_ua_hash' => $currentUaHash,
            'enforce_ua' => true
        ]);
    }
}

$_SESSION['login_time']    = $_SESSION['login_time']    ?? $now;
$_SESSION['last_activity'] = $_SESSION['last_activity'] ?? $now;
$_SESSION['regen_time']    = $_SESSION['regen_time']    ?? $now;

if (($now - $_SESSION['last_activity']) > $IDLE_MAX) {
    session_unset();
    session_destroy();
    json_error('Sesión expirada por inactividad', 401, [
        'authenticated' => false,
        'reason' => 'idle_timeout'
    ]);
}

if (($now - $_SESSION['login_time']) > $ABSOLUTE_MAX) {
    session_unset();
    session_destroy();
    json_error('Sesión expirada (tiempo absoluto)', 401, [
        'authenticated' => false,
        'reason' => 'absolute_timeout'
    ]);
}

if (($now - $_SESSION['regen_time']) > $REGEN_INTERVAL) {
    session_regenerate_id(true);
    $_SESSION['regen_time'] = $now;
}

$refresh = isset($_GET['refresh']) || isset($_POST['refresh']);
if ($refresh) {
    $_SESSION['last_activity'] = $now;
}

json_ok([
    'authenticated' => true,
    'user' => $_SESSION['usuario'],
    'role' => $_SESSION['role'] ?? 'user',
    'idle_remaining' => $IDLE_MAX - ($now - $_SESSION['last_activity']),
    'absolute_remaining' => $ABSOLUTE_MAX - ($now - $_SESSION['login_time']),
    'ua_enforced' => ($enforceUa !== '0'),
    'ua_hash' => $_SESSION['ua_hash'] ?? null,
    'current_ua_hash' => $currentUaHash
], 'OK');