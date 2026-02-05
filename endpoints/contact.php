<?php
/* =============================================================
     Endpoint: contact.php
     Resumen: Gestiona el envío del formulario público de contacto aplicando
                        controles anti-spam (honeypot, rate limit y reCAPTCHA opcional) y
                        remitiendo el mensaje por correo (o log local de respaldo).
     Diccionario:
         - csrf_token: Token anti falsificación asociado a la sesión.
         - recaptcha_token: Prueba de desafío reCAPTCHA v3/v2 invisible para la acción "contact".
         - honeypot (hp): Campo oculto usado para detectar bots simples (debe llegar vacío).
         - rate limit: Límite de envíos permitidos por IP/email en ventana temporal.
     Parámetros (solicitudes):
         - GET: sin parámetros → retorna token CSRF y metadatos reCAPTCHA.
         - POST JSON/Form: { nombre, apellido, email, mensaje, csrf_token, recaptcha_token?, hp? }
     Respuesta (formatos):
         - Éxito: { success:true, message:string }
         - Error validación: { success:false, message:string, csrf_required?:true, recaptcha_required?:true }
         - Error límite: { success:false, message:"Demasiados intentos. Intenta más tarde.", retryAfter:int }
     Notas:
         - Si el servidor no puede enviar correo se registra fallback en /tmp/contact_messages.log.
         - Tabla contact_submissions actúa como bitácora y fuente para rate limit.
         - Direcciones y límites configurables vía variables de entorno.
     ============================================================= */
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';

if (!defined('CONTACT_EMAIL')) {
    $envMail = getenv('CONTACT_EMAIL');
    define('CONTACT_EMAIL', $envMail ?: 'ventas@ceramicaselcinco.com'); // Correo de producción
}
// Rate limits (cantidad en ventana de 10 minutos)
if (!defined('CONTACT_RATE_IP')) define('CONTACT_RATE_IP', (int)(getenv('CONTACT_RATE_IP') ?: 5));
if (!defined('CONTACT_RATE_EMAIL')) define('CONTACT_RATE_EMAIL', (int)(getenv('CONTACT_RATE_EMAIL') ?: 5));

// Ventana (minutos) para considerar un mensaje duplicado (email + contenido). Si se repite, se acepta silenciosamente sin reenviar.
if (!defined('CONTACT_DUP_WINDOW_MINUTES')) define('CONTACT_DUP_WINDOW_MINUTES', (int)(getenv('CONTACT_DUP_WINDOW_MINUTES') ?: 60));

// reCAPTCHA (se comparte con login si existen variables, pero es opcional)
$RECAPTCHA_SECRET = getenv('RECAPTCHA_SECRET') ?: (defined('RECAPTCHA_SECRET') ? RECAPTCHA_SECRET : '');
$RECAPTCHA_SITE_KEY = getenv('RECAPTCHA_SITE_KEY') ?: (defined('RECAPTCHA_SITE_KEY') ? RECAPTCHA_SITE_KEY : '');
$RECAPTCHA_MIN_SCORE = 0.3; // Ajustable

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Nombre de la función: sanitize_text
// Parámetros:
//   - $v (string|mixed): Valor de entrada a limpiar.
//   - $max (int): Longitud máxima resultante.
// Proceso y salida: Normaliza string (trim), elimina caracteres de control peligrosos
//   y corta a $max. Devuelve string seguro.
function sanitize_text($v, int $max = 5000): string {
    $s = is_string($v) ? trim($v) : '';
    // eliminar caracteres de control peligrosos
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    if (mb_strlen($s) > $max) {
        $s = mb_substr($s, 0, $max);
    }
    return $s;
}

// Nombre de la función: ensure_contact_table
// Parámetros:
//   - $conn (mysqli): Conexión activa a base de datos.
// Proceso y salida: Crea la tabla contact_submissions (si no existe) con índices para rate limit.
function ensure_contact_table($conn) {
    static $done=false; if ($done) return; $done=true;
    $sql = "CREATE TABLE IF NOT EXISTS contact_submissions (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        nombre VARCHAR(120) NOT NULL,\n        apellido VARCHAR(120) NOT NULL,\n        email VARCHAR(190) NOT NULL,\n        ip VARCHAR(45) NOT NULL,\n        ua_hash CHAR(32) NULL,\n        message_excerpt VARCHAR(255) NULL,\n        message_hash CHAR(64) NULL,\n        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n        INDEX idx_ip_time (ip, created_at),\n        INDEX idx_email_time (email, created_at),\n        INDEX idx_msg_hash_time (message_hash, created_at)\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    @ $conn->query($sql);
    // Asegurar columna message_hash si la tabla existía sin ella
    if ($res = @$conn->query("SHOW COLUMNS FROM contact_submissions LIKE 'message_hash'")) {
        if ($res->num_rows === 0) {
            @$conn->query("ALTER TABLE contact_submissions ADD COLUMN message_hash CHAR(64) NULL, ADD INDEX idx_msg_hash_time (message_hash, created_at)");
        }
        $res->close();
    }
}

if ($method === 'GET') {
    $token = csrf_token();
    json_ok(null, null, 200, [
        'csrf_token' => $token,
        'recaptcha' => [
            'enabled' => (bool)($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY),
            'site_key' => ($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY) ? $RECAPTCHA_SITE_KEY : null
        ]
    ]);
}

if ($method !== 'POST') {
    json_error('Método no permitido', 405);
}

// Determinar si el cuerpo llega como JSON (según Content-Type) y obtener payload.
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($ct, 'application/json') !== false;
$payload = $isJson ? (json_decode(file_get_contents('php://input'), true) ?: []) : ($_POST ?: []);

$csrf = $payload['csrf_token'] ?? '';
if (!validate_csrf($csrf)) {
    json_error('CSRF token inválido o ausente', 400, ['csrf_required' => true]);
}

$nombre   = sanitize_text($payload['nombre'] ?? '', 120);
$apellido = sanitize_text($payload['apellido'] ?? '', 120);
$email    = strtolower(sanitize_text($payload['email'] ?? '', 190));
$mensaje  = sanitize_text($payload['mensaje'] ?? '', 4000);
$honeypot = trim((string)($payload['hp'] ?? ''));
$recaptchaToken = $payload['recaptcha_token'] ?? '';

if ($honeypot !== '') { // Bot trivial
    json_ok(null, 'Mensaje enviado'); // Silencio (no indicar rechazo)
}
if ($nombre === '' || $apellido === '' || $email === '' || $mensaje === '') {
    json_error('Todos los campos son obligatorios');
}
if (mb_strlen(preg_replace('/\s+/','',$mensaje)) < 10) {
    json_error('El mensaje es demasiado corto');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Email inválido');
}

// Validación reCAPTCHA (solo si claves configuradas). Requiere recaptcha_token en payload.
if ($RECAPTCHA_SECRET && $RECAPTCHA_SITE_KEY) {
    if (!$recaptchaToken) {
        json_error('reCAPTCHA requerido', 400, ['recaptcha_required' => true]);
    }
    // Verificación mínima (similar a login pero simplificada)
    $postData = http_build_query(['secret'=>$RECAPTCHA_SECRET,'response'=>$recaptchaToken,'remoteip'=>client_ip()]);
    $ctx = stream_context_create(['http'=>['method'=>'POST','header'=>"Content-Type: application/x-www-form-urlencoded\r\n","content"=>$postData,'timeout'=>5]]);
    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    $rc = $raw ? json_decode($raw, true) : null;
    $ok = is_array($rc) && !empty($rc['success']);
    $score = $rc['score'] ?? null; $action = $rc['action'] ?? '';
    if (!$ok) {
        json_error('Fallo reCAPTCHA', 400, ['recaptcha_required'=>true]);
    }
    if ($score !== null && $score < $RECAPTCHA_MIN_SCORE) {
        json_error('Score reCAPTCHA bajo', 400, ['recaptcha_required'=>true,'score'=>$score]);
    }
    if ($action && strtolower($action) !== 'contact') {
        // No bloquear duro; sólo advertencia suave (podríamos forzar error si se desea)
    }
}

// Asunto del correo (sanitize: evita saltos de línea para prevenir header injection).
$subject = 'Nuevo mensaje de contacto';
$subjectSuffix = trim($nombre . ' ' . $apellido);
if ($subjectSuffix !== '') {
    $subject .= ' - ' . preg_replace('/[\r\n]+/', ' ', $subjectSuffix);
}

$ip = client_ip();
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$uaHash = $ua ? substr(hash('sha256',$ua),0,32) : null;
$fecha = date('Y-m-d H:i:s');

// Rate limiting: cuenta envíos recientes por IP y email en ventana fija (10 min).
try {
    $conn = db();
    ensure_contact_table($conn);
    // Conteos últimos 10 minutos
    $limitWindow = 10; // minutos (rate general)
    $cntIp = 0; $cntEmail = 0;
    if ($stmt = @$conn->prepare('SELECT COUNT(*) c FROM contact_submissions WHERE ip=? AND created_at >= (NOW()-INTERVAL ? MINUTE)')) {
        $stmt->bind_param('si',$ip,$limitWindow); $stmt->execute(); $r=$stmt->get_result()->fetch_assoc(); $cntIp = (int)($r['c']??0); $stmt->close();
    }
    if ($stmt = @$conn->prepare('SELECT COUNT(*) c FROM contact_submissions WHERE email=? AND created_at >= (NOW()-INTERVAL ? MINUTE)')) {
        $stmt->bind_param('si',$email,$limitWindow); $stmt->execute(); $r=$stmt->get_result()->fetch_assoc(); $cntEmail = (int)($r['c']??0); $stmt->close();
    }
    if ($cntIp >= CONTACT_RATE_IP || $cntEmail >= CONTACT_RATE_EMAIL) {
        json_error('Demasiados intentos. Intenta más tarde.', 429, ['retryAfter'=>600]);
    }

    // Dedupe silencioso: hash canónico de email + mensaje normalizado
    $normMsg = preg_replace('/\s+/u',' ', strtolower($mensaje));
    $messageHash = hash('sha256', $email . "\n" . $normMsg);
    $dupWindow = (int)CONTACT_DUP_WINDOW_MINUTES;
    $isDuplicate = false;
    if ($stmt = @$conn->prepare('SELECT id FROM contact_submissions WHERE message_hash=? AND created_at >= (NOW()-INTERVAL ? MINUTE) LIMIT 1')) {
        $stmt->bind_param('si',$messageHash,$dupWindow); $stmt->execute(); $stmt->store_result();
        $isDuplicate = $stmt->num_rows > 0; $stmt->close();
    }
    if ($isDuplicate) {
        // Registrar intento duplicado (opcional) sin reenviar correo
        try {
            if ($stmt = @$conn->prepare('INSERT INTO contact_submissions (nombre, apellido, email, ip, ua_hash, message_excerpt, message_hash) VALUES (?,?,?,?,?,?,?)')) {
                $excerpt = mb_substr($mensaje,0,250);
                $stmt->bind_param('sssssss',$nombre,$apellido,$email,$ip,$uaHash,$excerpt,$messageHash);
                @$stmt->execute(); @$stmt->close();
            }
        } catch (Throwable $e) { /* noop */ }
        json_ok(null, 'Mensaje enviado'); // Respuesta uniforme (silenciosa)
    }
} catch (Throwable $e) { /* ignorar para no romper envío */ }

$bodyLines = [
    'Se ha recibido un nuevo mensaje desde el formulario de contacto:',
    '------------------------------------------------------------',
    'Nombre: ' . $nombre,
    'Apellido: ' . $apellido,
    'Email: ' . $email,
    'IP: ' . $ip,
    'User-Agent: ' . $ua,
    'Fecha: ' . $fecha,
    '------------------------------------------------------------',
    'Mensaje:',
    $mensaje,
    '------------------------------------------------------------',
];
$body = implode("\n", $bodyLines);

// Construcción de cabeceras básicas de correo.
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
// Mejora: usar el dominio real del servidor
$serverDomain = $_SERVER['SERVER_NAME'] ?? 'localhost';
$fromEmail = 'noreply@' . $serverDomain;
$headers[] = 'From: ' . $fromEmail;
$headers[] = 'Reply-To: ' . $email;
// Agregar headers adicionales para mejor deliverability
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'Return-Path: ' . $fromEmail;
$headersStr = implode("\r\n", $headers);

// Registro persistente (auditoría + apoyo a rate limit).
try {
    if (isset($conn)) {
        $excerpt = mb_substr($mensaje,0,250);
        if (!isset($messageHash)) { // en camino normal no duplicado
            $normMsg = preg_replace('/\s+/u',' ', strtolower($mensaje));
            $messageHash = hash('sha256', $email . "\n" . $normMsg);
        }
        if ($stmt = @$conn->prepare('INSERT INTO contact_submissions (nombre, apellido, email, ip, ua_hash, message_excerpt, message_hash) VALUES (?,?,?,?,?,?,?)')) {
            $stmt->bind_param('sssssss',$nombre,$apellido,$email,$ip,$uaHash,$excerpt,$messageHash);
            @$stmt->execute(); @$stmt->close();
        }
    }
} catch (Throwable $e) { /* noop */ }

$sent = false;
$mailError = '';
try { 
    $sent = @mail(CONTACT_EMAIL, $subject, $body, $headersStr); 
    if (!$sent) {
        $mailError = error_get_last()['message'] ?? 'Unknown mail error';
    }
} catch(Throwable $e) { 
    $sent = false; 
    $mailError = $e->getMessage();
}

if (!$sent) {
    $logLine = '[' . $fecha . '] FALLBACK -> ' . $subject . "\n" . $body . "\n";
    if ($mailError) {
        $logLine .= "Error: " . $mailError . "\n";
    }
    $logLine .= "Headers: " . $headersStr . "\n\n";
    @file_put_contents(sys_get_temp_dir() . '/contact_messages.log', $logLine, FILE_APPEND);
    
    // Log adicional para debugging en producción
    error_log("Contact form mail failed: " . $mailError);
}

json_ok(null, 'Mensaje enviado');

?>
