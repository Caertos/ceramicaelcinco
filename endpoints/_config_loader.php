<?php
/* =============================================================
   Módulo: _config_loader.php
   Resumen: Carga segura de config.php priorizando ubicación externa a public_html; cae a interna solo en desarrollo o si no se exige política estricta.
   Diccionario:
     - SECURE_ONLY_EXTERNAL: (env/const) Obliga a que solo se acepte config externo; de lo contrario falla.
     - __CONFIG_LOADED__: Constante definida con la ruta del config usado.
   Parámetros: (N/A) Determina rutas dinámicamente.
   Respuesta: No retorna datos; si falla emite JSON { success:false, error } y detiene ejecución.
   Notas:
     - Orden de búsqueda: ../../config.php -> ../../../config.php (tres niveles) -> ../config.php (si no estricto).
     - Validación opcional REJECT_CONFIG_INSIDE_DOCROOT evita usar config dentro de DOCUMENT_ROOT.
   Uso: require_once __DIR__ . '/_config_loader.php';
   ============================================================= */

if (!defined('__CONFIG_LOADED__')) {
    $SECURE_ONLY_EXTERNAL = getenv('SECURE_ONLY_EXTERNAL') === '1' || (defined('SECURE_ONLY_EXTERNAL') && SECURE_ONLY_EXTERNAL);

    $externalPrimary = __DIR__ . '/../../config.php';
    $externalAlt     = dirname(__DIR__, 3) . '/config.php';
    $internal        = __DIR__ . '/../config.php';

    $attempts = [];
    $loaded = false;

    // 1. Intentar externo principal
    $attempts[] = $externalPrimary;
    if (is_file($externalPrimary)) {
        require_once $externalPrimary;
        define('__CONFIG_LOADED__', $externalPrimary);
        $loaded = true;
    } else {
        // 2. Intentar externo alternativo
        $attempts[] = $externalAlt;
        if (is_file($externalAlt)) {
            require_once $externalAlt;
            define('__CONFIG_LOADED__', $externalAlt);
            $loaded = true;
        }
    }

    // 3. Si no hay externo y no se fuerza política estricta, intentar interno
    if (!$loaded && !$SECURE_ONLY_EXTERNAL) {
        $attempts[] = $internal;
        if (is_file($internal)) {
            require_once $internal;
            define('__CONFIG_LOADED__', $internal);
            $loaded = true;
        }
    } elseif (!$loaded && $SECURE_ONLY_EXTERNAL) {
        // Forzamos error si solo existe interno (no se cargó porque se exige externo)
        if (is_file($internal)) {
            $attempts[] = $internal . ' (omitido por SECURE_ONLY_EXTERNAL)';
        }
    } else {
        // Si ya cargamos externo pero también existe interno, opcionalmente podríamos registrar advertencia
        if ($loaded && is_file($internal) && defined('__CONFIG_LOADED__') && __CONFIG_LOADED__ !== $internal) {
            // Evitar salida al cliente: solo log silencioso
            @file_put_contents(__DIR__ . '/config_loader.log', date('c') . " Aviso: también existe config interno pero se usó externo: $internal\n", FILE_APPEND);
        }
    }

    if (!$loaded) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'config.php no encontrado (o interno bloqueado por SECURE_ONLY_EXTERNAL)',
            'paths_intentados' => $attempts,
            'secure_only_external' => $SECURE_ONLY_EXTERNAL
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Verificación adicional: si se cargó un config que reside dentro del DOCUMENT_ROOT y la política lo prohíbe
try {
    if (defined('__CONFIG_LOADED__')) {
        $docRootReal = isset($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : null;
        $cfgReal = realpath(__CONFIG_LOADED__);
        $enforceOutside = getenv('REJECT_CONFIG_INSIDE_DOCROOT') === '1' || (defined('REJECT_CONFIG_INSIDE_DOCROOT') && REJECT_CONFIG_INSIDE_DOCROOT);
        if ($enforceOutside && $docRootReal && $cfgReal && strpos($cfgReal, $docRootReal) === 0) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Config dentro de DOCUMENT_ROOT rechazado por política',
                'config' => $cfgReal,
                'document_root' => $docRootReal
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
} catch (Throwable $e) {
    // Falla silenciosa, no impedir funcionamiento normal si hay algún edge case
}

// Endurecer parámetros de cookie de sesión (antes de enviar salida)
if (session_status() === PHP_SESSION_ACTIVE) {
    // Refuerzo de flags, respetando configuración elegida en config.php / env
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443);
    $ss = getenv('SESSION_SAMESITE');
    if (!$ss && defined('SESSION_SAMESITE')) { $ss = SESSION_SAMESITE; }
    $ss = $ss ?: 'Lax';
    $ssUp = strtoupper($ss);
    if (!in_array($ssUp, ['STRICT','LAX','NONE'], true)) { $ssUp = 'LAX'; }
    if ($ssUp === 'NONE') { $secure = true; } // Requisito moderno
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.cookie_samesite', ucfirst(strtolower($ssUp)));
    if ($secure) { @ini_set('session.cookie_secure', '1'); }
}

// Redirección opcional a HTTPS
if ((getenv('FORCE_HTTPS') === '1' || (defined('FORCE_HTTPS') && FORCE_HTTPS)) && (php_sapi_name() !== 'cli')) {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    if (!$https && isset($_SERVER['HTTP_HOST'])) {
        $host = $_SERVER['HTTP_HOST'];
        $uri  = $_SERVER['REQUEST_URI'] ?? '/';
        header('Location: https://' . $host . $uri, true, 301);
        exit;
    }
}

// Cabeceras de seguridad comunes (solo si no se enviaron ya)
if (!headers_sent()) {
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block'); // legacy, algunos navegadores aún lo usan
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    // CSP básica: ajustar si la app necesita más orígenes (webfonts, analytics, etc.)
    if (empty($GLOBALS['__CSP_SET__'])) {
        $csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";
        header('Content-Security-Policy: ' . $csp);
        $GLOBALS['__CSP_SET__'] = true;
    }

    // --- Paso 3: HSTS y cabeceras endurecidas adicionales ---
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443);
    $enableHsts = $isHttps && (
        getenv('ENABLE_HSTS') === '1' || (defined('ENABLE_HSTS') && ENABLE_HSTS)
    );
    if ($enableHsts) {
        $maxAge = 31536000; // 1 año por defecto
        if (($env = getenv('HSTS_MAX_AGE')) && ctype_digit($env)) { $maxAge = (int)$env; }
        elseif (defined('HSTS_MAX_AGE') && is_numeric(HSTS_MAX_AGE)) { $maxAge = (int)HSTS_MAX_AGE; }
        $incSub = (getenv('HSTS_INCLUDE_SUBDOMAINS') === '1' || (defined('HSTS_INCLUDE_SUBDOMAINS') && HSTS_INCLUDE_SUBDOMAINS)) ? '; includeSubDomains' : '';
        $preload = (getenv('HSTS_PRELOAD') === '1' || (defined('HSTS_PRELOAD') && HSTS_PRELOAD)) ? '; preload' : '';
        header('Strict-Transport-Security: max-age=' . $maxAge . $incSub . $preload);
    }

    // COOP & CORP para aislar contexto contra ataques tipo XS-Leaks. (No usar COEP por si se requieren recursos sin CORP aún)
    header('Cross-Origin-Opener-Policy: same-origin');
    
    // EXCEPCIÓN: Para archivos de media, permitir carga cross-origin para evitar problemas de CORP
    if (defined('SERVING_MEDIA_FILES') && SERVING_MEDIA_FILES === true) {
        header('Cross-Origin-Resource-Policy: cross-origin');
    } else {
        header('Cross-Origin-Resource-Policy: same-origin');
    }
    // Deshabilita políticas cross-domain (Flash, PDF antigua etc.)
    header('X-Permitted-Cross-Domain-Policies: none');
    // Evita apertura directa en IE/Edge antiguos al descargar
    header('X-Download-Options: noopen');
}
?>
