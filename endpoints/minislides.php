<?php
/* =============================================================
     Endpoint: minislides.php
     Resumen: Administra mini slides (texto + imagen opcional) usados en la
                        página principal. Ofrece listado público de activos y CRUD +
                        reordenamiento para usuarios autenticados.
     Diccionario:
         - active: Bandera (1/0) que indica si el slide se publica.
         - position: Orden de visualización (1 = primero).
         - image_url: Ruta relativa almacenada en media/minislides/.
     Acciones:
         - get_public (GET): Lista pública [{ id,text,image_url }].
         - list (GET, auth): Lista administrativa completa con metadatos.
         - create (POST multipart, auth): text (req), image (opt), active (opt).
         - update (POST multipart, auth): id (req) + campos opcionales.
         - delete (POST JSON, auth): { id } elimina registro e imagen asociada.
         - reorder (POST JSON, auth): { order:[ids] } reasigna positions.
     Respuestas:
         - Éxito: { success:true, data?, message? }
         - Error: { success:false, message }
     Notas:
         - El tamaño máximo de imagen es 4MB y formatos permitidos: jpeg, png, webp, gif.
     ============================================================= */
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';

$action = $_GET['action'] ?? 'get_public';



// Nombre de la función: ensure_minislides_table
// Parámetros: $conn (mysqli) conexión activa.
// Proceso y salida: Crea tabla mini_slides si no existe y asegura columna 'active'. No retorna valor.
function ensure_minislides_table($conn) {
    static $done = false; if ($done) return; $done = true;
    $sql = "CREATE TABLE IF NOT EXISTS mini_slides (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        text VARCHAR(500) NOT NULL,\n        image_url VARCHAR(500) NULL,\n        position INT NOT NULL DEFAULT 0,\n        active TINYINT(1) NOT NULL DEFAULT 1,\n        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n        INDEX idx_position (position),\n        INDEX idx_active (active)\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    @$conn->query($sql);
    // Asegurar columna active si tabla anterior carecía de ella
    if ($res = @$conn->query("SHOW COLUMNS FROM mini_slides LIKE 'active'")) {
        if ($res->num_rows === 0) { @$conn->query("ALTER TABLE mini_slides ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1, ADD INDEX idx_active (active)"); }
        $res->close();
    }
}

$conn = db();
ensure_minislides_table($conn);
$action = $_GET['action'] ?? '';

// Nombre de la función: require_auth_local
// Parámetros: ninguno (usa $_SESSION).
// Proceso y salida: Verifica sesión; emite json_error 401 si no autenticado.
function require_auth_local() {
    if (!isset($_SESSION['usuario'])) {
        json_error('No autorizado', 401);
    }
}

// Nombre de la función: allowed_image_mime
// Parámetros: $mime (string) tipo MIME detectado.
// Proceso y salida: Retorna true si pertenece a la lista blanca de imágenes soportadas.
function allowed_image_mime($mime) {
    return in_array($mime, ['image/jpeg','image/png','image/webp','image/gif'], true);
}

switch ($action) {
    case 'get_public': // Resumen: listado público de slides activos ordenados
        $res = $conn->query("SELECT id, text, image_url FROM mini_slides WHERE active=1 ORDER BY position ASC, id ASC");
        $slides = [];
        while ($row = $res->fetch_assoc()) $slides[] = $row;
        json_ok($slides);
        break;

    case 'list': // Resumen: listado administrativo completo (requiere sesión)
        require_auth_local();
        $res = $conn->query("SELECT id, text, image_url, position, active, created_at FROM mini_slides ORDER BY position ASC, id ASC");
        $slides = [];
        while ($row = $res->fetch_assoc()) $slides[] = $row;
        json_ok($slides);
        break;

    case 'create': // Resumen: crea un slide nuevo (text requerido, image opcional)
        require_auth_local();
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_error('Método no permitido', 405);
        $text = trim($_POST['text'] ?? '');
        if ($text === '') json_error('El texto es requerido');
        $active = isset($_POST['active']) ? (int)($_POST['active'] ? 1 : 0) : 1;
        $imageRel = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $f = $_FILES['image'];
            
            // Validar imagen con funciones de seguridad centralizadas
            $validation_result = validate_file_upload($f, 'image');
            if (!$validation_result['valid']) {
                json_error($validation_result['error']);
            }
            
            $baseDir = defined('MEDIA_MINISLIDES_DIR') ? MEDIA_MINISLIDES_DIR : ( (defined('MEDIA_DIR')? MEDIA_DIR : (dirname(__DIR__).'/media')) . '/minislides');
            $dir = rtrim($baseDir,'/\\');
            if (!is_dir($dir)) @mkdir($dir, 0755, true);
            if (!is_dir($dir) || !is_writable($dir)) json_error('Directorio destino no escribible', 500);
            $filename = generate_safe_filename($f['name'], 'slide');
            $dest = $dir . '/' . $filename;
            if (!move_uploaded_file($f['tmp_name'], $dest)) json_error('No se pudo guardar la imagen', 500);
            $imageRel = 'media/minislides/' . $filename; // se sirve estático
        }
        // posición = max+1
        $maxPos = 0; if ($r = $conn->query("SELECT MAX(position) m FROM mini_slides")) { $row=$r->fetch_assoc(); $maxPos = (int)($row['m'] ?? 0); }
        $pos = $maxPos + 1;
    $stmt = $conn->prepare('INSERT INTO mini_slides (text, image_url, position, active) VALUES (?,?,?,?)');
    $stmt->bind_param('ssii', $text, $imageRel, $pos, $active);
        if (!$stmt->execute()) json_error('Error al crear mini slide');
        $id = $stmt->insert_id;
        log_file_action($conn, $_SESSION, 'create_mini_slide', (string)$id, $imageRel ?? '', ['text' => $text]);
    json_ok(['id'=>$id,'text'=>$text,'image_url'=>$imageRel,'position'=>$pos,'active'=>$active],'Creado');
        break;

    case 'update': // Resumen: actualiza campos y opcionalmente reemplaza imagen
        require_auth_local();
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_error('Método no permitido', 405);
        $id = (int)($_POST['id'] ?? 0);
        if ($id<=0) json_error('ID inválido');
        $sel = $conn->prepare('SELECT image_url, text, active FROM mini_slides WHERE id=?');
        $sel->bind_param('i',$id); $sel->execute(); $row = $sel->get_result()->fetch_assoc();
        if (!$row) json_error('No encontrado',404);
        $newText = isset($_POST['text']) ? trim($_POST['text']) : $row['text'];
        $imageRel = $row['image_url'];
        $active = isset($_POST['active']) ? (int)($_POST['active'] ? 1 : 0) : (int)$row['active'];
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $f = $_FILES['image'];
            
            // Validar imagen con funciones de seguridad centralizadas
            $validation_result = validate_file_upload($f, 'image');
            if (!$validation_result['valid']) {
                json_error($validation_result['error']);
            }
            
            $baseDir = defined('MEDIA_MINISLIDES_DIR') ? MEDIA_MINISLIDES_DIR : ( (defined('MEDIA_DIR')? MEDIA_DIR : (dirname(__DIR__).'/media')) . '/minislides');
            $dir = rtrim($baseDir,'/\\');
            if (!is_dir($dir)) @mkdir($dir, 0755, true);
            if (!is_dir($dir) || !is_writable($dir)) json_error('Directorio destino no escribible', 500);
            $filename = generate_safe_filename($f['name'], 'slide');
            $dest = $dir . '/' . $filename;
            if (!move_uploaded_file($f['tmp_name'], $dest)) json_error('No se pudo guardar la imagen', 500);
            // borrar anterior si era de nuestra carpeta
            if ($imageRel && strpos($imageRel,'media/minislides/')===0) {
                $prev = $dir . '/' . basename($imageRel);
                if (is_file($prev)) @unlink($prev);
            }
            $imageRel = 'media/minislides/' . $filename;
        }
    $up = $conn->prepare('UPDATE mini_slides SET text=?, image_url=?, active=? WHERE id=?');
    $up->bind_param('ssii', $newText, $imageRel, $active, $id);
        if (!$up->execute()) json_error('Error al actualizar');
    log_file_action($conn, $_SESSION, 'update_mini_slide', (string)$id, $imageRel ?? '', ['text' => $newText, 'active'=>$active]);
    json_ok(['id'=>$id,'text'=>$newText,'image_url'=>$imageRel,'active'=>$active],'Actualizado');
        break;

    case 'delete': // Resumen: elimina registro y borra imagen asociada si es propia
        require_auth_local();
        $data = read_json_body();
        $id = (int)($data['id'] ?? 0);
        if ($id<=0) json_error('ID inválido');
        $sel = $conn->prepare('SELECT image_url FROM mini_slides WHERE id=?');
        $sel->bind_param('i',$id); $sel->execute(); $row = $sel->get_result()->fetch_assoc();
        if (!$row) json_error('No encontrado',404);
        $imageRel = $row['image_url'];
        $del = $conn->prepare('DELETE FROM mini_slides WHERE id=?');
        $del->bind_param('i',$id); if (!$del->execute()) json_error('Error al eliminar');
        if ($imageRel && strpos($imageRel,'media/minislides/')===0) {
            $baseDir = defined('MEDIA_MINISLIDES_DIR') ? MEDIA_MINISLIDES_DIR : ( (defined('MEDIA_DIR')? MEDIA_DIR : (dirname(__DIR__).'/media')) . '/minislides');
            $dir = rtrim($baseDir,'/\\');
            $prev = $dir . '/' . basename($imageRel); if (is_file($prev)) @unlink($prev);
        }
        log_file_action($conn, $_SESSION, 'delete_mini_slide', (string)$id, $imageRel ?? '', []);
        json_ok(null,'Eliminado');
        break;

    case 'reorder': // Resumen: reasigna posiciones según array recibido
        require_auth_local();
        $data = read_json_body();
        $order = $data['order'] ?? null;
        if (!is_array($order) || empty($order)) json_error('Lista de orden inválida');
        $pos = 1;
        $stmt = $conn->prepare('UPDATE mini_slides SET position=? WHERE id=?');
        foreach ($order as $id) {
            $idI = (int)$id; if ($idI<=0) continue; $stmt->bind_param('ii',$pos,$idI); $stmt->execute(); $pos++;
        }
        log_file_action($conn, $_SESSION, 'reorder_mini_slides', 'reorder', '', ['order'=>$order]);
        json_ok(null,'Reordenado');
        break;

    default:
        json_error('Acción no válida',404);
}
