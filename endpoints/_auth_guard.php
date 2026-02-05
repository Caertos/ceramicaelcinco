<?php
/* =============================================================
   Módulo: _auth_guard.php
   Resumen: Valida sesión activa y aplica las mismas reglas de expiración
            (idle / absolute / regen / ua_hash) que `check_auth.php` PERO
            SIN enviar respuesta JSON ni terminar la ejecución.
   Uso: require_once '_auth_guard.php'; $auth = require_auth();
   Retorno: array ['user'=>string,'role'=>string,'ua_hash'=>string|null]
   En caso de fallo llama a json_error(...); (sale del script).
   ============================================================= */

if (session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.gc_maxlifetime', 14400);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'samesite' => 'Lax'
    ]);
    session_start();
}
require_once __DIR__ . '/_helpers.php';

function require_auth(): array {
    $IDLE_MAX = 1800;        // 30 min
    $ABSOLUTE_MAX = 14400;   // 4 h
    $REGEN_INTERVAL = 600;   // 10 min

    $now = time();
    
    // SEGURIDAD: Aplicar validaciones de sesión endurecida
    if (!secure_session_start()) {
        json_error('Sesión invalidada por seguridad', 401, ['authenticated'=>false,'reason'=>'session_security_violation']);
    }
    
    if (!isset($_SESSION['usuario'])) {
        json_error('No autenticado', 401, ['authenticated'=>false,'reason'=>'not_logged_in']);
    }

    $currentUa = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $currentUaHash = $currentUa ? substr(hash('sha256', $currentUa),0,32) : null;
    if (!empty($_SESSION['ua_hash']) && $currentUaHash && $_SESSION['ua_hash'] !== $currentUaHash) {
        session_unset(); session_destroy();
        json_error('Sesión invalidada (cambio de agente)', 401, ['authenticated'=>false,'reason'=>'ua_changed']);
    }

    $_SESSION['login_time']    = $_SESSION['login_time']    ?? $now;
    $_SESSION['last_activity'] = $_SESSION['last_activity'] ?? $now;
    $_SESSION['regen_time']    = $_SESSION['regen_time']    ?? $now;

    if (($now - $_SESSION['last_activity']) > $IDLE_MAX) {
        session_unset(); session_destroy();
        json_error('Sesión expirada por inactividad', 401, ['authenticated'=>false,'reason'=>'idle_timeout']);
    }
    if (($now - $_SESSION['login_time']) > $ABSOLUTE_MAX) {
        session_unset(); session_destroy();
        json_error('Sesión expirada (tiempo absoluto)', 401, ['authenticated'=>false,'reason'=>'absolute_timeout']);
    }
    if (($now - $_SESSION['regen_time']) > $REGEN_INTERVAL) {
        session_regenerate_id(true);
        $_SESSION['regen_time'] = $now;
    }
    // Refrescar actividad de forma perezosa
    $_SESSION['last_activity'] = $now;

    return [
        'user' => $_SESSION['usuario'],
        'role' => $_SESSION['role'] ?? 'user',
        'ua_hash' => $_SESSION['ua_hash'] ?? null
    ];
}
