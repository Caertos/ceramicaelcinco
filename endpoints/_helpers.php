<?php
/* =============================================================
     Módulo: _helpers.php
     Resumen: Agrupa utilidades transversales para endpoints: emisión de
                        respuestas JSON estandarizadas, validación de métodos HTTP,
                        lectura segura de cuerpo JSON, obtención de IP del cliente,
                        creación de tablas auxiliares y registro de acciones sobre archivos.
     Diccionario:
         - nosniff: Cabecera que evita que el navegador "adivine" tipos MIME.
         - JSON: Formato de intercambio de datos estructurados basado en texto.
     Notas:
         - Todas las salidas usan UTF-8 y evitan escape de slashes para legibilidad.
     ============================================================= */

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
}

// Nombre de la función: send_json
// Parámetros:
//   - $payload (array): Datos a serializar como JSON.
//   - $code (int): Código HTTP de la respuesta.
//   - $headers (array): Cabeceras adicionales clave=>valor.
// Proceso y salida: Emite JSON normalizado, cabeceras y finaliza el script.
function send_json(array $payload, int $code = 200, array $headers = []): void {
    foreach ($headers as $k => $v) {
        header($k . ': ' . $v);
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Nombre de la función: json_ok
// Parámetros:
//   - $data (mixed|null): Carga útil opcional.
//   - $message (string|null): Mensaje humano.
//   - $code (int): Código HTTP (default 200).
//   - $extra (array): Campos adicionales.
// Proceso y salida: Construye payload standard con success=true y delega en send_json.
function json_ok($data = null, ?string $message = null, int $code = 200, array $extra = []): void {
    $payload = ['success' => true];
    if ($message !== null) $payload['message'] = $message;
    if ($data !== null) $payload['data'] = $data;
    if ($extra) $payload = array_merge($payload, $extra);
    send_json($payload, $code);
}

// Nombre de la función: json_error
// Parámetros:
//   - $message (string): Descripción del error.
//   - $code (int): Código HTTP representativo.
//   - $extra (array): Metadatos adicionales para el cliente.
// Proceso y salida: Emite respuesta con success=false y mensaje estandarizado.
function json_error(string $message, int $code = 400, array $extra = []): void {
    $payload = ['success' => false, 'message' => $message, 'error' => $message];
    if ($extra) $payload = array_merge($payload, $extra);
    send_json($payload, $code);
}

// Nombre de la función: require_method
// Parámetros:
//   - $methods (string|string[]): Lista de métodos permitidos.
// Proceso y salida: Verifica el método actual y aborta con 405 si no está en la lista.
function require_method($methods): void {
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $list = is_array($methods) ? $methods : [$methods];
    if (!in_array($m, $list, true)) {
        header('Allow: ' . implode(', ', $list));
        json_error('Método no permitido', 405);
    }
}

// Nombre de la función: read_json_body
// Parámetros: (ninguno)
// Proceso y salida: Si Content-Type es JSON intenta decodificar y retorna array (o []).
function read_json_body(): array {
    $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') === false) return [];
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Nombre de la función: client_ip
// Parámetros: (ninguno)
// Proceso y salida: Extrae IP del cliente comprobando cabeceras de proxy/CDN en orden y valida formato.
function client_ip(): string {
    $keys = ['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP','REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $v = trim(explode(',', $_SERVER[$k])[0]);
            if (filter_var($v, FILTER_VALIDATE_IP)) return $v;
        }
    }
    return '0.0.0.0';
}

// Nombre de la función: ensure_uploads_log_table
// Parámetros:
//   - $conn (mysqli): Conexión activa.
// Proceso y salida: Crea tabla uploads_log (si no existe) con índices para auditoría de acciones sobre archivos.
function ensure_uploads_log_table($conn): void {
    static $done = false; if ($done) return; $done = true;
    $sql = "CREATE TABLE IF NOT EXISTS uploads_log (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        user_id INT NULL,\n        username VARCHAR(191) NOT NULL,\n        action VARCHAR(50) NOT NULL,\n        file_name VARCHAR(255) NOT NULL,\n        file_path VARCHAR(500) NOT NULL,\n        ip VARCHAR(45) NOT NULL,\n        extra JSON NULL,\n        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n        INDEX idx_user_time (username, created_at),\n        INDEX idx_action_time (action, created_at)\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    @$conn->query($sql);
}

// Nombre de la función: log_file_action
// Parámetros:
//   - $conn (mysqli): Conexión DB.
//   - $session (array): Datos de sesión (usuario, id).
//   - $action (string): Nombre lógico de la acción (ej: add_product_pdf).
//   - $fileName (string): Identificador o nombre de archivo.
//   - $filePath (string): Ruta relativa/almacenada.
//   - $extra (array): Metadatos adicionales serializados como JSON.
// Proceso y salida: Inserta fila de auditoría ignorando silenciosamente errores.
function log_file_action($conn, array $session, string $action, string $fileName, string $filePath, array $extra = []): void {
    ensure_uploads_log_table($conn);
    $userId = isset($session['user_id']) ? (int)$session['user_id'] : null;
    $username = $session['usuario'] ?? 'desconocido';
    $ip = client_ip();
    $extraJson = $extra ? json_encode($extra, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) : null;
    if ($stmt = @$conn->prepare('INSERT INTO uploads_log (user_id, username, action, file_name, file_path, ip, extra) VALUES (?,?,?,?,?,?,?)')) {
        $stmt->bind_param('issssss', $userId, $username, $action, $fileName, $filePath, $ip, $extraJson);
        @$stmt->execute();
        @$stmt->close();
    }
}

// Nombre de la función: ensure_user_schema
// Parámetros:
//   - $conn (mysqli): Conexión DB.
// Proceso y salida: Añade columnas de roles y métricas de login si faltan y asegura un superusuario inicial.
function ensure_user_schema($conn): void {
    static $ran = false; if ($ran) return; $ran = true;
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'role'")) {
        if ($res->num_rows === 0) {
            @$conn->query("ALTER TABLE usuarios ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'");
        }
        $res->close();
    }
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'created_at'")) {
        if ($res->num_rows === 0) {@$conn->query("ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP");}
        $res->close();
    }
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'updated_at'")) {
        if ($res->num_rows === 0) {@$conn->query("ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");}
        $res->close();
    }
    // Nuevos campos de métricas de login (si faltan)
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'last_login_at'")) {
        if ($res->num_rows === 0) { @$conn->query("ALTER TABLE usuarios ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL"); }
        $res->close();
    }
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'last_login_ip'")) {
        if ($res->num_rows === 0) { @$conn->query("ALTER TABLE usuarios ADD COLUMN last_login_ip VARCHAR(45) NULL"); }
        $res->close();
    }
    if ($res = @$conn->query("SHOW COLUMNS FROM usuarios LIKE 'last_login_ua'")) {
        if ($res->num_rows === 0) { @$conn->query("ALTER TABLE usuarios ADD COLUMN last_login_ua CHAR(32) NULL COMMENT 'Hash (sha256 truncado) del user-agent'"); }
        $res->close();
    }
    // Asegurar que haya al menos un superusuario: si ninguno, promover el primero existente
    $hasSuper = false;
    if ($q = @$conn->query("SELECT COUNT(*) c FROM usuarios WHERE role='super'")) { $row = $q->fetch_assoc(); $hasSuper = (int)($row['c'] ?? 0) > 0; $q->close(); }
    if (!$hasSuper) {
        if ($q = @$conn->query("SELECT id FROM usuarios ORDER BY id ASC LIMIT 1")) {
            if ($row = $q->fetch_assoc()) {
                $id = (int)$row['id'];
                @$conn->query("UPDATE usuarios SET role='super' WHERE id=".$id." LIMIT 1");
            }
            $q->close();
        }
    }
}

// Nombre de la función: ensure_rate_limit_table
// Parámetros:
//   - $conn (mysqli): Conexión activa a base de datos.
// Proceso y salida: Crea tabla rate_limits (si no existe) para tracking de requests por IP/acción.
function ensure_rate_limit_table($conn): void {
    static $done = false; if ($done) return; $done = true;
    $sql = "CREATE TABLE IF NOT EXISTS rate_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        action VARCHAR(50) NOT NULL,
        requests INT NOT NULL DEFAULT 1,
        window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_request TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ip_action (ip, action),
        INDEX idx_window_start (window_start),
        INDEX idx_last_request (last_request)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    @$conn->query($sql);
}

// Nombre de la función: check_global_rate_limit
// Parámetros:
//   - $action (string): Identificador de la acción (ej: 'admin_panel_get', 'users_list').
//   - $limit (int): Número máximo de requests permitidos en la ventana.
//   - $window (int): Ventana de tiempo en segundos (default 300 = 5 min).
//   - $block_time (int): Tiempo de bloqueo en segundos si se excede (default 900 = 15 min).
// Proceso y salida: Verifica y actualiza contadores. Llama json_error() si excede límites.
function check_global_rate_limit(string $action, int $limit = 100, int $window = 300, int $block_time = 900): void {
    try {
        $conn = db();
        ensure_rate_limit_table($conn);
        
        $ip = client_ip();
        $now = time();
        $window_start = $now - $window;
        
        // Limpiar registros antiguos (más de 1 hora)
        @$conn->query("DELETE FROM rate_limits WHERE window_start < FROM_UNIXTIME($now - 3600)");
        
        // Verificar registro existente
        $stmt = $conn->prepare("SELECT requests, UNIX_TIMESTAMP(window_start) as window_start, UNIX_TIMESTAMP(last_request) as last_request FROM rate_limits WHERE ip = ? AND action = ?");
        $stmt->bind_param('ss', $ip, $action);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        if ($row) {
            $requests = (int)$row['requests'];
            $window_start_ts = (int)$row['window_start'];
            $last_request_ts = (int)$row['last_request'];
            
            // Si la ventana ha expirado, resetear
            if ($window_start_ts < ($now - $window)) {
                $stmt = $conn->prepare("UPDATE rate_limits SET requests = 1, window_start = FROM_UNIXTIME(?), last_request = FROM_UNIXTIME(?) WHERE ip = ? AND action = ?");
                $stmt->bind_param('iiss', $now, $now, $ip, $action);
                $stmt->execute();
                $stmt->close();
                return; // Primera request de nueva ventana
            }
            
            // Verificar si está en período de bloqueo
            if ($requests >= $limit && ($last_request_ts + $block_time) > $now) {
                $retry_after = ($last_request_ts + $block_time) - $now;
                json_error("Demasiadas peticiones. Intenta en $retry_after segundos.", 429, [
                    'retryAfter' => $retry_after,
                    'action' => $action,
                    'limit' => $limit
                ]);
            }
            
            // Si ya no está bloqueado pero aún en ventana, resetear si es necesario
            if ($requests >= $limit) {
                $stmt = $conn->prepare("UPDATE rate_limits SET requests = 1, window_start = FROM_UNIXTIME(?), last_request = FROM_UNIXTIME(?) WHERE ip = ? AND action = ?");
                $stmt->bind_param('iiss', $now, $now, $ip, $action);
                $stmt->execute();
                $stmt->close();
                return;
            }
            
            // Incrementar contador
            $new_requests = $requests + 1;
            if ($new_requests > $limit) {
                $retry_after = $block_time;
                json_error("Límite de peticiones excedido. Bloqueado por $retry_after segundos.", 429, [
                    'retryAfter' => $retry_after,
                    'action' => $action,
                    'limit' => $limit
                ]);
            }
            
            $stmt = $conn->prepare("UPDATE rate_limits SET requests = ?, last_request = FROM_UNIXTIME(?) WHERE ip = ? AND action = ?");
            $stmt->bind_param('iiss', $new_requests, $now, $ip, $action);
            $stmt->execute();
            $stmt->close();
            
        } else {
            // Primer request para esta IP/acción
            $stmt = $conn->prepare("INSERT INTO rate_limits (ip, action, requests, window_start, last_request) VALUES (?, ?, 1, FROM_UNIXTIME(?), FROM_UNIXTIME(?))");
            $stmt->bind_param('ssii', $ip, $action, $now, $now);
            $stmt->execute();
            $stmt->close();
        }
        
    } catch (Throwable $e) {
        // En caso de error de BD, permitir request pero loguear
        error_log("Rate limiting error for $action from $ip: " . $e->getMessage());
    }
}

// Nombre de la función: validate_file_upload
// Parámetros:
//   - $file (array): Array de $_FILES con keys: name, tmp_name, size, type, error
//   - $allowedTypes (array): Lista de tipos MIME permitidos
//   - $maxSizeMB (int): Tamaño máximo en MB
//   - $context (string): Contexto para logging (ej: 'gallery', 'admin_pdf')
// Proceso y salida: Valida archivo subido con múltiples checks de seguridad. 
//   Retorna array ['valid' => bool, 'error' => string, 'info' => array] o lanza json_error()
function validate_file_upload(array $file, $allowedTypes, ?int $maxSizeMB = null, string $context = 'upload'): array {
    $clientIP = client_ip();
    
    // Validaciones básicas
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        error_log("SECURITY: Intento de subida de archivo no válido desde IP: $clientIP en contexto: $context");
        json_error('Archivo no válido o no subido correctamente', 400);
    }
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = match($file['error']) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Archivo demasiado grande',
            UPLOAD_ERR_PARTIAL => 'Subida incompleta',
            UPLOAD_ERR_NO_FILE => 'No se seleccionó archivo',
            UPLOAD_ERR_NO_TMP_DIR => 'Error del servidor: directorio temporal no disponible',
            UPLOAD_ERR_CANT_WRITE => 'Error del servidor: no se puede escribir',
            UPLOAD_ERR_EXTENSION => 'Subida detenida por extensión PHP',
            default => 'Error desconocido en la subida'
        };
        json_error($errorMsg, 400);
    }
    
    $fileName = $file['name'] ?? 'sin_nombre';
    $fileSize = $file['size'] ?? 0;
    $tmpPath = $file['tmp_name'];

    // Compatibilidad: aceptar alias cortos para facilitar llamadas desde endpoints
    if (is_string($allowedTypes)) {
        $alias = strtolower($allowedTypes);
        switch ($alias) {
            case 'image':
                $allowedTypes = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'];
                if ($maxSizeMB === null) $maxSizeMB = defined('MAX_IMAGE_MB') ? MAX_IMAGE_MB : 5;
                break;
            case 'pdf':
            case 'application/pdf':
                $allowedTypes = ['application/pdf'];
                if ($maxSizeMB === null) $maxSizeMB = defined('MAX_PDF_MB') ? MAX_PDF_MB : 15;
                break;
            case 'video':
                $allowedTypes = ['video/mp4','video/webm','video/avi','video/quicktime'];
                if ($maxSizeMB === null) $maxSizeMB = defined('MAX_VIDEO_MB') ? MAX_VIDEO_MB : 100;
                break;
            default:
                // Si se pasa un único MIME como string
                $allowedTypes = [$allowedTypes];
                break;
        }
    }

    // Si no se especificó maxSizeMB y se pasó un array de MIME, intentar valores por defecto
    if ($maxSizeMB === null) {
        if (!empty($allowedTypes) && is_array($allowedTypes)) {
            $joined = implode(',', $allowedTypes);
            if (strpos($joined, 'image/') !== false) $maxSizeMB = defined('MAX_IMAGE_MB') ? MAX_IMAGE_MB : 5;
            elseif (strpos($joined, 'application/pdf') !== false) $maxSizeMB = defined('MAX_PDF_MB') ? MAX_PDF_MB : 15;
            elseif (strpos($joined, 'video/') !== false) $maxSizeMB = defined('MAX_VIDEO_MB') ? MAX_VIDEO_MB : 100;
            else $maxSizeMB = 20; // fallback
        } else {
            $maxSizeMB = 20;
        }
    }
    
    // Validación de tamaño
    $maxBytes = $maxSizeMB * 1024 * 1024;
    if ($fileSize > $maxBytes) {
        error_log("SECURITY: Archivo demasiado grande ($fileSize bytes) desde IP: $clientIP - $fileName en $context");
        json_error("Archivo demasiado grande. Máximo: {$maxSizeMB}MB", 400);
    }
    
    // Validación de extensión por nombre de archivo
    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = [];
    
    // Mapear tipos MIME a extensiones
    $mimeToExt = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp'],
        'image/svg+xml' => ['svg'],
        'video/mp4' => ['mp4'],
        'video/webm' => ['webm'],
        'video/avi' => ['avi'],
        'video/quicktime' => ['mov'],
        'application/pdf' => ['pdf']
    ];
    
    foreach ($allowedTypes as $mime) {
        if (isset($mimeToExt[$mime])) {
            $allowedExtensions = array_merge($allowedExtensions, $mimeToExt[$mime]);
        }
    }
    
    if (!in_array($extension, $allowedExtensions, true)) {
        error_log("SECURITY: Extensión no permitida '$extension' desde IP: $clientIP - $fileName en $context");
        json_error("Extensión de archivo no permitida: .$extension", 400);
    }
    
    // Validación CRÍTICA: Magic bytes (firma del archivo)
    if (!file_exists($tmpPath) || !is_readable($tmpPath)) {
        json_error('No se puede acceder al archivo subido', 500);
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $tmpPath);
    finfo_close($finfo);
    
    if (!$detectedMime || !in_array($detectedMime, $allowedTypes, true)) {
        error_log("SECURITY: MIME type no permitido '$detectedMime' (esperado: " . implode(',', $allowedTypes) . ") desde IP: $clientIP - $fileName en $context");
        json_error("Tipo de archivo no permitido. Detectado: $detectedMime", 400);
    }
    
    // Validaciones específicas por tipo
    if (strpos($detectedMime, 'image/') === 0 && $detectedMime !== 'image/svg+xml') {
        // Para imágenes, verificar que se pueden leer con GD
        $imageInfo = @getimagesize($tmpPath);
        if (!$imageInfo) {
            error_log("SECURITY: Imagen corrupta o maliciosa desde IP: $clientIP - $fileName en $context");
            json_error('Imagen corrupta o no válida', 400);
        }
        
        // Verificar dimensiones máximas razonables (anti DoS)
        if ($imageInfo[0] > 10000 || $imageInfo[1] > 10000) {
            error_log("SECURITY: Imagen con dimensiones excesivas ({$imageInfo[0]}x{$imageInfo[1]}) desde IP: $clientIP - $fileName");
            json_error('Dimensiones de imagen demasiado grandes (máx: 10000x10000)', 400);
        }
    }
    
    // Validación de contenido peligroso en archivos
    $dangerousPatterns = [
        '/<\?php/i',
        '/<script/i', 
        '/eval\s*\(/i',
        '/exec\s*\(/i',
        '/system\s*\(/i',
        '/shell_exec\s*\(/i',
        '/passthru\s*\(/i',
        '/file_get_contents\s*\(/i'
    ];
    
    $fileContent = file_get_contents($tmpPath, false, null, 0, min($fileSize, 8192)); // Lee primeros 8KB
    foreach ($dangerousPatterns as $pattern) {
        if (preg_match($pattern, $fileContent)) {
            error_log("SECURITY: CONTENIDO MALICIOSO detectado en archivo desde IP: $clientIP - $fileName en $context - Pattern: $pattern");
            json_error('Archivo contiene código potencialmente malicioso', 400);
        }
    }
    
    // Log de archivo válido
    error_log("File upload validated: $fileName ($detectedMime, {$fileSize} bytes) from IP: $clientIP in context: $context");
    
    return [
        'valid' => true,
        'mime' => $detectedMime,
        'size' => $fileSize,
        'extension' => $extension,
        'safe_name' => preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($fileName, PATHINFO_FILENAME)) . '.' . $extension
    ];
}

/**
 * Rotación automática de logs para controlar el crecimiento de la tabla uploads_log
 * 
 * @param mysqli $conn - Conexión a la base de datos
 * @param array $config - Configuración de rotación con keys:
 *                       - retention_months: meses a retener (default: 6)
 *                       - max_records_per_cleanup: registros máximos a eliminar por ejecución (default: 1000)
 *                       - cleanup_probability: probabilidad de ejecutar (1-100, default: 10)
 * @return array - Resultado con estadísticas de la rotación
 */
function rotate_uploads_log($conn, $config = []) {
    $retention_months = (int)($config['retention_months'] ?? 6);
    $max_records = (int)($config['max_records_per_cleanup'] ?? 1000);
    $cleanup_probability = (int)($config['cleanup_probability'] ?? 10);
    
    // Verificar si se debe ejecutar la limpieza (probabilidad)
    if (rand(1, 100) > $cleanup_probability) {
        return [
            'executed' => false,
            'reason' => 'probability_skip',
            'deleted_records' => 0,
            'retention_months' => $retention_months
        ];
    }
    
    // Contar registros que se eliminarán
    $count_stmt = $conn->prepare("SELECT COUNT(*) as total FROM uploads_log WHERE created_at < (NOW() - INTERVAL ? MONTH)");
    $count_stmt->bind_param("i", $retention_months);
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $total_to_delete = (int)($count_result->fetch_assoc()['total'] ?? 0);
    $count_stmt->close();
    
    if ($total_to_delete === 0) {
        return [
            'executed' => true,
            'reason' => 'no_records_to_delete',
            'deleted_records' => 0,
            'retention_months' => $retention_months,
            'total_eligible' => $total_to_delete
        ];
    }
    
    // Eliminar registros en lotes para evitar bloqueos largos
    $delete_stmt = $conn->prepare("DELETE FROM uploads_log WHERE created_at < (NOW() - INTERVAL ? MONTH) LIMIT ?");
    $delete_stmt->bind_param("ii", $retention_months, $max_records);
    
    $deleted_total = 0;
    $max_iterations = 10; // Evitar bucles infinitos
    $iteration = 0;
    
    while ($deleted_total < $total_to_delete && $iteration < $max_iterations) {
        $delete_stmt->execute();
        $deleted_this_round = $conn->affected_rows;
        
        if ($deleted_this_round === 0) {
            break; // No hay más registros que eliminar
        }
        
        $deleted_total += $deleted_this_round;
        $iteration++;
        
        // Pausa breve para no sobrecargar la base de datos
        if ($deleted_this_round === $max_records && $iteration < $max_iterations) {
            usleep(100000); // 0.1 segundos
        }
    }
    
    $delete_stmt->close();
    
    // Log de la operación
    error_log("Log rotation executed: deleted $deleted_total records older than $retention_months months");
    
    return [
        'executed' => true,
        'reason' => 'cleanup_completed',
        'deleted_records' => $deleted_total,
        'retention_months' => $retention_months,
        'total_eligible' => $total_to_delete,
        'iterations' => $iteration,
        'remaining_to_delete' => max(0, $total_to_delete - $deleted_total)
    ];
}

/**
 * Configuración inteligente de rotación de logs basada en el entorno
 * 
 * @return array - Configuración optimizada según el entorno
 */
function get_log_rotation_config() {
    $is_production = defined('APP_ENV') && APP_ENV === 'production';
    $is_development = defined('APP_ENV') && APP_ENV === 'development';
    
    if ($is_production) {
        return [
            'retention_months' => 12, // Retener más tiempo en producción
            'max_records_per_cleanup' => 500, // Lotes más pequeños en producción
            'cleanup_probability' => 5 // Menos frecuente en producción (5%)
        ];
    } elseif ($is_development) {
        return [
            'retention_months' => 1, // Limpiar más frecuentemente en desarrollo
            'max_records_per_cleanup' => 100,
            'cleanup_probability' => 50 // Más frecuente para testing (50%)
        ];
    } else {
        // Configuración por defecto (staging/test)
        return [
            'retention_months' => 6,
            'max_records_per_cleanup' => 1000,
            'cleanup_probability' => 10
        ];
    }
}

// Función helper para generar nombres seguros únicos
function generate_safe_filename(string $originalName, string $context = ''): string {
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $basename = pathinfo($originalName, PATHINFO_FILENAME);
    
    // Limpiar nombre base
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $basename);
    $safeName = substr($safeName, 0, 50); // Limitar longitud
    
    // Agregar timestamp y contexto para unicidad
    $timestamp = date('YmdHis');
    $contextPrefix = $context ? $context . '_' : '';
    
    return $contextPrefix . $safeName . '_' . $timestamp . '.' . $extension;
}

/**
 * Sistema centralizado de manejo de errores con protección de información sensible
 * 
 * @param string $message - Mensaje de error (puede contener información sensible)
 * @param array $context - Contexto adicional para logging interno
 * @param int $httpCode - Código HTTP de respuesta
 * @param string $errorCode - Código interno de error para tracking
 * @return array - Respuesta JSON segura
 */
function secure_error_response($message, $context = [], $httpCode = 500, $errorCode = null) {
    $is_production = defined('APP_ENV') && APP_ENV === 'production';
    $is_development = defined('APP_ENV') && APP_ENV === 'development';
    
    // Generar ID único de error para correlación
    $errorId = uniqid('err_', true);
    
    // Log completo interno (siempre guardado para debugging)
    $logContext = array_merge($context, [
        'error_id' => $errorId,
        'original_message' => $message,
        'http_code' => $httpCode,
        'error_code' => $errorCode,
        'timestamp' => date('Y-m-d H:i:s'),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'session_user' => $_SESSION['usuario'] ?? 'anonymous'
    ]);
    
    error_log('SECURITY_ERROR: ' . json_encode($logContext));
    
    // Determinar mensaje público según entorno
    if ($is_production) {
        // En producción: mensajes genéricos por categoría de error
        $publicMessage = get_generic_error_message($httpCode, $errorCode);
    } elseif ($is_development) {
        // En desarrollo: mensaje completo para debugging
        $publicMessage = $message . " [Error ID: $errorId]";
    } else {
        // Staging: mensaje moderadamente detallado
        $publicMessage = get_staging_error_message($message, $errorId);
    }
    
    $response = [
        'success' => false,
        'error' => $publicMessage,
        'error_id' => $errorId
    ];
    
    // Añadir información adicional solo en desarrollo
    if ($is_development && !empty($context)) {
        $response['debug_context'] = $context;
    }
    
    http_response_code($httpCode);
    return $response;
}

/**
 * Generar mensajes de error genéricos para producción
 */
function get_generic_error_message($httpCode, $errorCode = null) {
    $genericMessages = [
        400 => 'Solicitud inválida. Verifique los datos enviados.',
        401 => 'Acceso no autorizado. Inicie sesión nuevamente.',
        403 => 'No tiene permisos para realizar esta acción.',
        404 => 'El recurso solicitado no fue encontrado.',
        413 => 'El archivo enviado es demasiado grande.',
        415 => 'Tipo de archivo no soportado.',
        429 => 'Demasiadas solicitudes. Intente más tarde.',
        500 => 'Error interno del servidor. Contacte al administrador.',
        503 => 'Servicio temporalmente no disponible.'
    ];
    
    $baseMessage = $genericMessages[$httpCode] ?? $genericMessages[500];
    
    // Códigos de error específicos para ayuda al usuario (sin revelar internos)
    if ($errorCode) {
        switch ($errorCode) {
            case 'FILE_UPLOAD':
                return 'Error al procesar el archivo. Verifique el formato y tamaño.';
            case 'DATABASE':
                return 'Error de base de datos. Intente nuevamente.';
            case 'VALIDATION':
                return 'Los datos enviados no son válidos.';
            case 'RATE_LIMIT':
                return 'Ha excedido el límite de solicitudes. Espere antes de intentar nuevamente.';
            default:
                return $baseMessage;
        }
    }
    
    return $baseMessage;
}

/**
 * Generar mensajes moderadamente detallados para staging
 */
function get_staging_error_message($originalMessage, $errorId) {
    // En staging: sanitizar pero mantener algo de contexto
    $sanitized = preg_replace('/\/[a-zA-Z0-9\/._-]*\//', '/***/', $originalMessage); // Ocultar rutas
    $sanitized = preg_replace('/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/', '***.***.***', $sanitized); // Ocultar IPs
    $sanitized = preg_replace('/password[\'"]?\s*[:=]\s*[\'"][^\'\"]*[\'"]/', 'password=***', $sanitized); // Ocultar passwords
    
    return $sanitized . " [ID: $errorId]";
}

/**
 * Wrapper para respuestas de error JSON rápidas
 */
function json_error_secure($message, $httpCode = 400, $errorCode = null, $context = []) {
    $response = secure_error_response($message, $context, $httpCode, $errorCode);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

/**
 * Wrapper para respuestas de éxito JSON con headers seguros
 */
function json_success_secure($data = null, $message = null) {
    // Headers de seguridad básicos
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    
    $response = ['success' => true];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Sanitizar información de debugging para logs
 */
function sanitize_debug_info($data) {
    if (is_string($data)) {
        // Ocultar información sensible en strings
        $data = preg_replace('/password[\'"]?\s*[:=]\s*[\'"][^\'\"]*[\'"]/', 'password=***', $data);
        $data = preg_replace('/api[_-]?key[\'"]?\s*[:=]\s*[\'"][^\'\"]*[\'"]/', 'api_key=***', $data);
        $data = preg_replace('/secret[\'"]?\s*[:=]\s*[\'"][^\'\"]*[\'"]/', 'secret=***', $data);
    } elseif (is_array($data)) {
        foreach ($data as $key => $value) {
            if (preg_match('/password|secret|key|token/i', $key)) {
                $data[$key] = '***';
            } else {
                $data[$key] = sanitize_debug_info($value);
            }
        }
    }
    
    return $data;
}

/**
 * Configurar headers de seguridad HTTP para endpoints
 * 
 * @param string $contentType - Tipo de contenido (default: application/json)
 * @param array $additionalHeaders - Headers adicionales específicos
 */
function set_security_headers($contentType = 'application/json', $additionalHeaders = []) {
    // Headers básicos de contenido
    header("Content-Type: $contentType; charset=utf-8");
    
    // Headers de seguridad esenciales
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Política de permisos restrictiva
    header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    
    // CSP básico para endpoints JSON
    if ($contentType === 'application/json') {
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    }
    
    // Prevenir caché de respuestas sensibles
    header('Cache-Control: no-store, no-cache, must-revalidate, private');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Headers adicionales personalizados
    foreach ($additionalHeaders as $name => $value) {
        header("$name: $value");
    }
}

/**
 * Manejo global de errores PHP para endpoints
 */
function setup_secure_error_handling() {
    // Solo configurar en entornos específicos
    $is_production = defined('APP_ENV') && APP_ENV === 'production';
    
    if ($is_production) {
        // En producción: ocultar todos los errores PHP
        ini_set('display_errors', 0);
        ini_set('display_startup_errors', 0);
        error_reporting(0);
    } else {
        // En desarrollo: mantener errores pero logearlos también
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    }
    
    // Siempre loggear errores
    ini_set('log_errors', 1);
    
    // Handler personalizado para errores no fatales (solo logging, no bloquear)
    set_error_handler(function($severity, $message, $file, $line) use ($is_production) {
        // Solo loggear, no interrumpir el flujo normal
        $errorInfo = [
            'severity' => $severity,
            'message' => $message,
            'file' => $file,
            'line' => $line,
            'endpoint' => basename($_SERVER['SCRIPT_NAME'] ?? 'unknown'),
            'user' => $_SESSION['usuario'] ?? 'anonymous'
        ];
        
        error_log('PHP_ERROR: ' . json_encode($errorInfo));
        
        // No interrumpir el flujo normal - solo loggear
        return false; // Permitir manejo normal del sistema
    });
    
    // Handler para errores fatales
    register_shutdown_function(function() use ($is_production) {
        $error = error_get_last();
        if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            $errorInfo = [
                'type' => 'FATAL',
                'message' => $error['message'],
                'file' => $error['file'],
                'line' => $error['line'],
                'endpoint' => basename($_SERVER['SCRIPT_NAME'] ?? 'unknown')
            ];
            
            error_log('FATAL_ERROR: ' . json_encode($errorInfo));
            
            if ($is_production && !headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Error crítico del servidor',
                    'error_id' => uniqid('fatal_', true)
                ]);
            }
        }
    });
}

?>
