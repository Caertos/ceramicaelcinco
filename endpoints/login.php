<?php
/* =============================================================
     Endpoint: login.php
     Resumen: Provee estado de autenticación y procesa inicio de sesión con
                        controles de seguridad (rate limiting, reCAPTCHA condicional,
                        delays adaptativos, rotación de CSRF y métricas de último login).
     Diccionario:
         - soft threshold: Cantidad de intentos tras la cual se exige reCAPTCHA.
         - hard threshold: Límite que bloquea temporalmente (HTTP 429) nuevos intentos.
         - fingerprint UA (ua_hash): Hash parcial del User-Agent guardado para correlación.
     Parámetros:
         - GET: (sin parámetros) → estado sesión + csrf + config reCAPTCHA.
         - POST JSON/Form: { username, password, csrf_token, recaptcha_token? }
     Respuestas:
         - GET éxito: { success:true, authenticated:boolean, user?, role?, csrf_token, recaptcha:{ enabled, site_key, required:false } }
         - POST éxito: { success:true, user, role, new_csrf_token, attempts_window, ip, ua_hash }
         - Error credenciales: { success:false, message, recaptcha_may_require? }
         - Error rate limit: { success:false, message:"Demasiados intentos...", retryAfter }
     Notas:
         - Tras login se regenera ID de sesión y token CSRF.
         - Limitación de intentos basada en IP y username.
     ============================================================= */
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json; charset=utf-8');

// --- Configuración dinámica ---
$RECAPTCHA_SECRET = getenv('RECAPTCHA_SECRET') ?: (defined('RECAPTCHA_SECRET') ? RECAPTCHA_SECRET : '');
$RECAPTCHA_SITE_KEY = getenv('RECAPTCHA_SITE_KEY') ?: (defined('RECAPTCHA_SITE_KEY') ? RECAPTCHA_SITE_KEY : '');

$LOGIN_WINDOW_MINUTES   = 15; // Ventana de observación de intentos
$LOGIN_HARD_THRESHOLD   = 5;  // Bloqueo definitivo temporal
$LOGIN_SOFT_THRESHOLD   = 3;  // A partir de aquí exigir reCAPTCHA si está configurado
$RECAPTCHA_MIN_SCORE    = 0.3; // Para reCAPTCHA v3 (si aplicable)

// --- Utilidades de intentos ---
// Nombre de la función: ensure_attempts_table
// Parámetros: conn (mysqli)
// Proceso y salida: Crea tabla login_attempts si no existe.
function ensure_attempts_table($conn) {
    static $done=false; if ($done) return; $done=true;
    @$conn->query("CREATE TABLE IF NOT EXISTS login_attempts (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(45) NOT NULL, username VARCHAR(191) NOT NULL, attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_ip_time (ip, attempt_time), INDEX idx_user_time (username, attempt_time)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
// Nombre de la función: register_attempt
// Parámetros: conn, ip (string), user (string)
// Proceso y salida: Inserta fila registrando intento fallido.
function register_attempt($conn,$ip,$user){ if($user==='') $user='(empty)'; if($stmt=@$conn->prepare('INSERT INTO login_attempts (ip, username) VALUES (?,?)')){ $stmt->bind_param('ss',$ip,$user); @$stmt->execute(); @$stmt->close(); } }
// Nombre de la función: count_attempts
// Parámetros: conn, ip, user, minutes (int ventana)
// Proceso y salida: Retorna array [int intentosPorIp, int intentosPorUsuario] en ventana.
function count_attempts($conn,$ip,$user,$minutes){ $c1=0;$c2=0; if($q=@$conn->prepare('SELECT COUNT(*) c FROM login_attempts WHERE ip=? AND attempt_time >= (NOW()-INTERVAL ? MINUTE)')){ $q->bind_param('si',$ip,$minutes); $q->execute(); $r=$q->get_result()->fetch_assoc(); $c1=(int)($r['c']??0); $q->close(); } if($user!==''){ if($q=@$conn->prepare('SELECT COUNT(*) c FROM login_attempts WHERE username=? AND attempt_time >= (NOW()-INTERVAL ? MINUTE)')){ $q->bind_param('si',$user,$minutes); $q->execute(); $r=$q->get_result()->fetch_assoc(); $c2=(int)($r['c']??0); $q->close(); }} return [$c1,$c2]; }
// Nombre de la función: earliest_attempt_time
// Parámetros: conn, ip, user, minutes
// Proceso y salida: Devuelve timestamp (int) del primer intento dentro de ventana, o null.
function earliest_attempt_time($conn,$ip,$user,$minutes){ $t=null; if($q=@$conn->prepare('SELECT MIN(attempt_time) m FROM login_attempts WHERE (ip=? OR username=?) AND attempt_time >= (NOW()-INTERVAL ? MINUTE)')){ $q->bind_param('ssi',$ip,$user,$minutes); $q->execute(); $r=$q->get_result()->fetch_assoc(); if(!empty($r['m'])) $t=strtotime($r['m']); $q->close(); } return $t; }
// Nombre de la función: clear_attempts
// Parámetros: conn, ip, user
// Proceso y salida: Elimina intentos para esa combinación tras login exitoso.
function clear_attempts($conn,$ip,$user){ if($user==='') return; if($q=@$conn->prepare('DELETE FROM login_attempts WHERE ip=? AND username=?')){ $q->bind_param('ss',$ip,$user); @$q->execute(); @$q->close(); } }

// --- Verificación reCAPTCHA (v3 o v2 invisible) ---
// Nombre de la función: verify_recaptcha
// Parámetros: secret (string), token (string), remoteIp (string)
// Proceso y salida: Llama API Google, retorna array [bool ok, string msg, float|null score, string|null action, array raw].
function verify_recaptcha($secret, $token, $remoteIp) {
    if (!$secret || !$token) return [false,'Token faltante'];
    $postData = http_build_query(['secret'=>$secret,'response'=>$token,'remoteip'=>$remoteIp]);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n".
                        "Content-Length: ".strlen($postData)."\r\n",
            'content' => $postData,
            'timeout' => 5,
        ]
    ]);
    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    if ($raw === false) return [false,'No se pudo contactar reCAPTCHA'];
    $data = json_decode($raw, true);
    if (!is_array($data)) return [false,'Respuesta inválida'];
    if (isset($data['success']) && $data['success'] == true) {
        $score = $data['score'] ?? null; // solo v3
        $action = $data['action'] ?? null;
        return [true,'OK',$score,$action,$data];
    }
    $errCodes = $data['error-codes'] ?? [];
    return [false,'Fallo reCAPTCHA',null,null,$data];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$clientIp = client_ip();
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$uaHash = $userAgent ? substr(hash('sha256', $userAgent),0,32) : null;

// --- GET: estado sesión + csrf + configuración reCAPTCHA ---
if ($method === 'GET') {
    $auth = isset($_SESSION['usuario']);
    $recaptchaEnabled = (bool)($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY);
    json_ok(null, null, 200, [
        'authenticated' => $auth,
        'user' => $auth ? $_SESSION['usuario'] : null,
        'role' => $auth ? ($_SESSION['role'] ?? 'user') : null,
        'csrf_token' => csrf_token(),
        'recaptcha' => [
            'enabled' => $recaptchaEnabled,
            'site_key' => $recaptchaEnabled ? $RECAPTCHA_SITE_KEY : null,
            'required' => false // El frontend puede pedir token preventivo; se fuerza en POST según intentos
        ]
    ]);
}

if ($method !== 'POST') {
    json_error('Método no permitido', 405);
}

// Obtener cuerpo (JSON preferido)
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($ct, 'application/json') !== false;
$payload = $isJson ? (json_decode(file_get_contents('php://input'), true) ?? []) : $_POST;

if (!validate_csrf($payload['csrf_token'] ?? '')) {
    json_error('Token CSRF inválido', 400);
}

$username = trim($payload['username'] ?? '');
$password = $payload['password'] ?? '';
$recaptchaToken = $payload['recaptcha_token'] ?? '';
if ($username === '' || $password === '') json_error('Debes llenar todos los campos');

$conn = db();
ensure_user_schema($conn);
$hasRole = true; // ensure_user_schema agrega columna si falta
$cols = 'id, username, password, role';

ensure_attempts_table($conn);
[$countIp, $countUser] = count_attempts($conn,$clientIp,$username,$LOGIN_WINDOW_MINUTES);
$totalAttempts = max($countIp,$countUser);
$locked = $totalAttempts >= $LOGIN_HARD_THRESHOLD;
if ($locked) {
    $minTime = earliest_attempt_time($conn,$clientIp,$username,$LOGIN_WINDOW_MINUTES);
    $retryAfter = 60*$LOGIN_WINDOW_MINUTES;
    if ($minTime) { $elapsed=time()-$minTime; $retryAfter=max(1,(60*$LOGIN_WINDOW_MINUTES)-$elapsed); }
    json_error('Demasiados intentos. Intenta más tarde.', 429, ['retryAfter'=>$retryAfter]);
}

$recaptchaRequired = ($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY && $totalAttempts >= $LOGIN_SOFT_THRESHOLD);
if ($recaptchaRequired) {
    if (!$recaptchaToken) {
        json_error('reCAPTCHA requerido', 400, ['recaptcha_required'=>true]);
    }
    [$rcOk,$rcMsg,$rcScore,$rcAction,$rcRaw] = verify_recaptcha($RECAPTCHA_SECRET,$recaptchaToken,$clientIp);
    if (!$rcOk) {
        // Registrar un intento también si recaptcha falla para no permitir enumeración
        register_attempt($conn,$clientIp,$username);
        json_error('Fallo reCAPTCHA', 400, ['recaptcha_required'=>true,'details'=>$rcMsg]);
    }
    if ($rcScore !== null && $rcScore < $RECAPTCHA_MIN_SCORE) {
        register_attempt($conn,$clientIp,$username);
        json_error('Score reCAPTCHA bajo', 400, ['recaptcha_required'=>true,'score'=>$rcScore]);
    }
}

$stmt = $conn->prepare("SELECT $cols FROM usuarios WHERE username = ? LIMIT 1");
if (!$stmt) json_error('Error de servidor', 500);
$stmt->bind_param('s', $username);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row || !password_verify($password, $row['password'])) {
    // Delay adaptativo: más intentos => mayor espera (hasta ~400ms)
    $adaptive = min(400, 40 + ($totalAttempts * 60));
    try { usleep(random_int($adaptive*1000, ($adaptive+50)*1000)); } catch(Throwable $e) { /* noop */ }
    register_attempt($conn,$clientIp,$username);
    [$countIp2,$countUser2] = count_attempts($conn,$clientIp,$username,$LOGIN_WINDOW_MINUTES);
    if (max($countIp2,$countUser2) >= $LOGIN_HARD_THRESHOLD) {
        $minTime = earliest_attempt_time($conn,$clientIp,$username,$LOGIN_WINDOW_MINUTES);
        $retryAfter = 60*$LOGIN_WINDOW_MINUTES; if ($minTime){ $elapsed=time()-$minTime; $retryAfter=max(1,(60*$LOGIN_WINDOW_MINUTES)-$elapsed);}        
        json_error('Demasiados intentos. Intenta más tarde.', 429, ['retryAfter'=>$retryAfter]);
    }
    json_error('Usuario o contraseña inválidos', 401, [
        'recaptcha_may_require' => ($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY && (max($countIp2,$countUser2) >= $LOGIN_SOFT_THRESHOLD))
    ]);
}

// Éxito: establecer sesión y métricas
$_SESSION['usuario'] = $row['username'];
$_SESSION['user_id'] = (int)$row['id'];
$_SESSION['role'] = $row['role'] ?? 'user';
$_SESSION['ua_hash'] = $uaHash; // guardar fingerprint parcial
@session_regenerate_id(true);
clear_attempts($conn,$clientIp,$username);
$_SESSION['login_time'] = $_SESSION['last_activity'] = $_SESSION['regen_time'] = time();
// Actualizar métricas de último login (ignorar errores silenciosamente)
try {
    if ($stmt2 = @$conn->prepare('UPDATE usuarios SET last_login_at=NOW(), last_login_ip=?, last_login_ua=? WHERE id=?')) {
        $stmt2->bind_param('ssi', $clientIp, $uaHash, $_SESSION['user_id']);
        @$stmt2->execute();
        @$stmt2->close();
    }
} catch (Throwable $e) { /* noop */ }

// Limpieza probabilística de intentos viejos
try { if (random_int(1,75)===1) { @$conn->query("DELETE FROM login_attempts WHERE attempt_time < (NOW() - INTERVAL 1 DAY)"); } } catch(Throwable $e) { }

// Rotar token CSRF tras autenticación para aislar fase pre-login
try { $_SESSION['csrf_token'] = bin2hex(random_bytes(16)); } catch (Throwable $e) { /* fallback: si falla se mantiene */ }
$newCsrf = $_SESSION['csrf_token'];
// Incluir metadatos de seguridad y nuevo token
json_ok([
    'user' => $row['username'],
    'role' => $_SESSION['role'],
    'ip'   => $clientIp,
    'ua_hash' => $uaHash,
    'attempts_window' => $totalAttempts,
    'new_csrf_token' => $newCsrf
], 'Login exitoso');