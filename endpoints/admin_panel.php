<?php
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json');
/* =============================================================
     Endpoint: admin_panel.php
     Resumen: Punto centralizado para operaciones de administración de
                        categorías y productos (CRUD, manejo de PDFs e íconos) a través
                        del parámetro 'action' reduciendo proliferación de endpoints.
     Diccionario:
         - CRUD: Crear, Leer, Actualizar, Eliminar.
         - multipart/form-data: Formato HTTP para carga de archivos binarios.
         - PDF: Documento validado por MIME 'application/pdf' antes de persistir.
     Parámetros (query/body):
         - action (GET): get_categories | get_products | add_category | update_category_name |
                                         delete_category | add_product | replace_product | rename_product |
                                         delete_product | upload_category_icon
         - Cuerpo: JSON para mutaciones sin archivo; multipart para cargas de PDF/imagen.
     Respuestas:
         - Éxito: { success:true, data?, message? }
         - Error: { success:false, message, csrf_required? }
     Seguridad:
         - Requiere sesión autenticada.
         - Acciones mutantes exigen método POST y token CSRF en cabecera.
     Notas:
         - Se registran acciones de archivos mediante log_file_action.
         - safe_name asegura nombres de archivos reproducibles y limpios.
     ============================================================= */

// Verifica que exista una sesión de usuario válida
if (!isset($_SESSION['usuario'])) {
    json_error('No autorizado', 401);
}



// Seguridad CSRF endurecida:
//  - Acciones de solo lectura (GET categories/products) no requieren token.
//  - TODAS las acciones mutantes requieren cabecera X-CSRF-Token válida.
function extract_csrf_header(): string {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($token === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, 'X-CSRF-Token') === 0) { $token = $v; break; }
            }
        }
    }
    return $token;
}
function require_csrf_token(): void {
    $h = extract_csrf_header();
    if ($h === '' || !validate_csrf($h)) {
        json_error('CSRF token requerido o inválido', 403, ['csrf_required' => true]);
    }
}

/*
Nombre de la función: respondError
Parámetros: message (string), code (int)
Proceso y salida: Envía respuesta estandarizada de error vía json_error.
*/
function respondError($message, $code = 400, $errorCode = null) {
    // Detectar tipo de error para categorización
    if (strpos($message, 'SQL') !== false || strpos($message, 'MySQL') !== false) {
        $errorCode = $errorCode ?: 'DATABASE';
    } elseif (strpos($message, 'archivo') !== false || strpos($message, 'file') !== false) {
        $errorCode = $errorCode ?: 'FILE_UPLOAD';
    } elseif (strpos($message, 'inválido') !== false || strpos($message, 'invalid') !== false) {
        $errorCode = $errorCode ?: 'VALIDATION';
    }
    
    json_error_secure($message, $code, $errorCode, ['endpoint' => 'admin_panel']);
}

/*
Nombre de la función: respondSuccess
Parámetros: data (mixed), message (string|null)
Proceso y salida: Envía respuesta exitosa usando json_ok.
*/
function respondSuccess($data, $message = null) {
    json_ok($data, $message);
}

/*
Nombre de la función: safe_name
Parámetros: name (string)
Proceso y salida: Normaliza nombre para usar en archivos: minúsculas, caracteres no permitidos reemplazados por '_', colapsa repeticiones y recorta.
*/
function safe_name($name) {
    $s = preg_replace('/[^a-zA-Z0-9_\-]/', '_', strtolower($name));
    $s = preg_replace('/_+/', '_', $s);
    return trim($s, '_');
}

$conn = db();
ensure_user_schema($conn);
$action = $_GET['action'] ?? '';

// Acciones que mutan estado (requieren CSRF obligatorio)
$mutating = [
    'add_category','delete_category','update_category_name',
    'add_product','replace_product','rename_product','delete_product','upload_category_icon'
];

// Enforzar método POST para mutaciones y requerir CSRF
if (in_array($action, $mutating, true)) {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        json_error('Método no permitido (POST requerido)', 405, ['csrf_required' => true]);
    }
    require_csrf_token();
}
$currentRole = $_SESSION['role'] ?? 'user';

switch ($action) {
    case 'get_categories': // Resumen: lista categorías con posible ícono
        $result = $conn->query("SELECT id, nombre, catIcon_url FROM categorias ORDER BY id ASC");
        $categorias = [];
        while ($r = $result->fetch_assoc()) $categorias[] = $r;
        respondSuccess($categorias);
        break;

    case 'get_products': // Resumen: lista productos recientes con archivo
        $result = $conn->query("SELECT id, categoria_id, nombre, archivo, created_at FROM productos ORDER BY created_at DESC");
        $productos = [];
        while ($r = $result->fetch_assoc()) $productos[] = $r;
        respondSuccess($productos);
        break;

    case 'add_category': // Resumen: crea categoría (POST JSON { nombre })
        $data = json_decode(file_get_contents('php://input'), true);
        $nombre = trim($data['nombre'] ?? '');
        
        if (empty($nombre)) {
            respondError('El nombre de la categoría no puede estar vacío');
        }

        $stmt = $conn->prepare("INSERT INTO categorias (nombre) VALUES (?)");
        $stmt->bind_param("s", $nombre);
        
        if (!$stmt->execute()) {
            respondError('Error al crear la categoría: ' . $stmt->error);
        }
        
    $newCatId = $stmt->insert_id;
    log_file_action($conn, $_SESSION, 'add_category', $nombre, 'categorias:id=' . $newCatId, []);
    respondSuccess(['id' => $newCatId], 'Categoría creada exitosamente');
        break;

    case 'delete_category': // Resumen: elimina categoría si no tiene productos
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        
        $chk = $conn->prepare("SELECT COUNT(*) AS cnt FROM productos WHERE categoria_id = ?");
        $chk->bind_param("i", $id);
        $chk->execute();
        $res = $chk->get_result();
        $row = $res->fetch_assoc();
        
        if ($row['cnt'] > 0) {
            respondError('No se puede eliminar la categoría: aún tiene productos');
        }
        
        $del = $conn->prepare("DELETE FROM categorias WHERE id = ?");
        $del->bind_param("i", $id);
        
        if (!$del->execute()) {
            respondError('Error al eliminar la categoría: ' . $del->error);
        }
        
    log_file_action($conn, $_SESSION, 'delete_category', (string)$id, 'categorias:id=' . $id, []);
    respondSuccess(null, 'Categoría eliminada exitosamente');
        break;

    case 'update_category_name': // Resumen: renombra categoría (POST JSON)
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        if ($id <= 0 || $nombre === '') {
            respondError('Parámetros inválidos');
        }
        $upd = $conn->prepare("UPDATE categorias SET nombre = ? WHERE id = ?");
        $upd->bind_param("si", $nombre, $id);
        if (!$upd->execute()) {
            respondError('Error al actualizar la categoría: ' . $upd->error);
        }
    log_file_action($conn, $_SESSION, 'rename_category', (string)$id, 'categorias:id=' . $id, ['nuevo_nombre' => $nombre]);
    respondSuccess(null, 'Nombre de categoría actualizado');
        break;

    case 'add_product': // Resumen: crea producto + guarda PDF (multipart)
        if (!isset($_FILES['archivo']) || empty($_POST['categoria_id']) || empty($_POST['nombre'])) {
            respondError('Faltan datos requeridos');
        }

        $catId = intval($_POST['categoria_id']);
        $nombre = trim($_POST['nombre']);
        $file = $_FILES['archivo'];

        // SEGURIDAD: Validación completa de archivo PDF
        $validationResult = validate_file_upload(
            $file, 
            ['application/pdf'], 
            MAX_PDF_MB, 
            'admin_pdf'
        );

        $stmt = $conn->prepare("INSERT INTO productos (categoria_id, nombre, archivo) VALUES (?, ?, ?)");
        $placeholder = "";
        $stmt->bind_param("iss", $catId, $nombre, $placeholder);
        
        if (!$stmt->execute()) {
            respondError('Error al crear el producto: ' . $stmt->error);
        }

        $prodId = $stmt->insert_id;
        
        // SEGURIDAD: Generar nombre de archivo seguro
        $filename = generate_safe_filename($file['name'], 'prod_' . $prodId);
        // Asegurar que el directorio de uploads exista y sea escribible
        $uploadsDir = rtrim(UPLOAD_DIR, '/\\');
        if (!is_dir($uploadsDir)) { @mkdir($uploadsDir, 0755, true); }
        if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
            // Rollback si no podemos escribir
            $del = $conn->prepare("DELETE FROM productos WHERE id = ?");
            $del->bind_param("i", $prodId);
            $del->execute();
            respondError('Directorio de uploads no disponible o no escribible', 500);
        }
        $dest = $uploadsDir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            // Rollback
            $del = $conn->prepare("DELETE FROM productos WHERE id = ?");
            $del->bind_param("i", $prodId);
            $del->execute();
            respondError('Error al guardar el archivo');
        }

        $upd = $conn->prepare("UPDATE productos SET archivo = ? WHERE id = ?");
        $upd->bind_param("si", $filename, $prodId);
        $upd->execute();

    log_file_action($conn, $_SESSION, 'add_product_pdf', $filename, $dest, ['producto_id' => $prodId]);
    respondSuccess(['id' => $prodId, 'archivo' => $filename], 'Producto creado exitosamente');
        break;

    case 'rename_product': // Resumen: renombra producto y archivo físico
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        if ($id <= 0 || $nombre === '') {
            respondError('Parámetros inválidos');
        }
        $sel = $conn->prepare("SELECT archivo FROM productos WHERE id = ?");
        $sel->bind_param("i", $id);
        $sel->execute();
        $res = $sel->get_result();
        $row = $res->fetch_assoc();
        if (!$row) respondError('Producto no encontrado', 404);
        $oldFile = $row['archivo'];

        $safe = safe_name($nombre);
        $newFile = $safe . "_" . $id . ".pdf";

        $uploadsDir = rtrim(UPLOAD_DIR, '/\\');
        if (!is_dir($uploadsDir)) { @mkdir($uploadsDir, 0755, true); }
        if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
            respondError('Directorio de uploads no disponible o no escribible', 500);
        }
        $oldPath = $uploadsDir . DIRECTORY_SEPARATOR . $oldFile;
        $newPath = $uploadsDir . DIRECTORY_SEPARATOR . $newFile;

        if ($oldFile !== $newFile && is_file($oldPath)) {
            if (is_file($newPath)) {
                $i = 1;
                do {
                    $newFile = $safe . "_" . $id . "_" . $i . ".pdf";
                    $newPath = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . $newFile;
                    $i++;
                } while (file_exists($newPath) && $i < 100);
            }
            if (!@rename($oldPath, $newPath)) {
                respondError('No se pudo renombrar el archivo en el servidor');
            }
        }

        $upd = $conn->prepare("UPDATE productos SET nombre = ?, archivo = ? WHERE id = ?");
        $upd->bind_param("ssi", $nombre, $newFile, $id);
        if (!$upd->execute()) {
            respondError('Error al renombrar el producto: ' . $upd->error);
        }
    log_file_action($conn, $_SESSION, 'rename_product_pdf', $newFile, $newPath ?? '', ['producto_id' => $id]);
    respondSuccess(['archivo' => $newFile], 'Producto renombrado');
        break;

    case 'replace_product': // Resumen: reemplaza PDF manteniendo fila DB
        if (!isset($_FILES['archivo']) || empty($_POST['producto_id'])) {
            respondError('Faltan datos requeridos');
        }

        $prodId = intval($_POST['producto_id']);
        $file = $_FILES['archivo'];

        // Validar archivo con funciones de seguridad centralizadas
        $validation_result = validate_file_upload($file, 'pdf');
        if (!$validation_result['valid']) {
            respondError($validation_result['error']);
        }

        $stmt = $conn->prepare("SELECT archivo FROM productos WHERE id = ?");
        $stmt->bind_param("i", $prodId);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($row = $res->fetch_assoc()) {
            $filename = $row['archivo'];
            $uploadsDir = rtrim(UPLOAD_DIR, '/\\');
            if (!is_dir($uploadsDir)) { @mkdir($uploadsDir, 0755, true); }
            if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
                respondError('Directorio de uploads no disponible o no escribible', 500);
            }
            $dest = $uploadsDir . DIRECTORY_SEPARATOR . $filename;
            
            if (is_file($dest)) @unlink($dest);
            
            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                respondError('Error al guardar el nuevo archivo');
            }
            
            log_file_action($conn, $_SESSION, 'replace_product_pdf', $filename, $dest, ['producto_id' => $prodId]);
            respondSuccess(null, 'Archivo reemplazado exitosamente');
        } else {
            respondError('Producto no encontrado');
        }
        break;

    case 'delete_product': // Resumen: elimina producto y PDF asociado
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);

        $stmt = $conn->prepare("SELECT archivo FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($row = $res->fetch_assoc()) {
            $uploadsDir = rtrim(UPLOAD_DIR, '/\\');
            $filePath = $uploadsDir . DIRECTORY_SEPARATOR . $row['archivo'];
            if (is_file($filePath)) @unlink($filePath);
        }

        $del = $conn->prepare("DELETE FROM productos WHERE id = ?");
        $del->bind_param("i", $id);
        
        if (!$del->execute()) {
            respondError('Error al eliminar el producto: ' . $del->error);
        }
        
    log_file_action($conn, $_SESSION, 'delete_product_pdf', $row['archivo'] ?? '', $filePath ?? '', ['producto_id' => $id]);
    respondSuccess(null, 'Producto eliminado exitosamente');
        break;

    case 'upload_category_icon': // Resumen: sube/actualiza ícono de categoría
        if (empty($_POST['categoria_id']) || !isset($_FILES['archivo'])) {
            respondError('Faltan datos requeridos');
        }
        $catId = intval($_POST['categoria_id']);
        $file = $_FILES['archivo'];
        if ($catId <= 0) respondError('Categoría inválida');
        // Validar imagen con funciones de seguridad centralizadas
        $validation_result = validate_file_upload($file, 'image');
        if (!$validation_result['valid']) {
            respondError($validation_result['error']);
        }

        // Directorio destino mediante constantes de config
        $targetDir = defined('MEDIA_CATEGORY_ICONS_DIR') ? MEDIA_CATEGORY_ICONS_DIR . '/' : (rtrim(dirname(__DIR__), '/\\') . '/media/categoryCardImages/');
        if (!is_dir($targetDir)) { @mkdir($targetDir, 0755, true); }
        if (!is_dir($targetDir) || !is_writable($targetDir)) {
            respondError('Directorio de destino no escribible', 500);
        }

        $finalName = generate_safe_filename($file['name'], 'icon');
        $targetPath = $targetDir . $finalName;
    $relative = 'media/categoryCardImages/' . $finalName; // se sirve vía serve_media.php?p=...

        // Si había un icono previo en esta categoría y está en nuestra carpeta, intentar borrarlo
        $prevQ = $conn->prepare("SELECT catIcon_url FROM categorias WHERE id = ?");
        $prevQ->bind_param("i", $catId);
        $prevQ->execute();
        $prevRes = $prevQ->get_result();
        if ($prev = $prevRes->fetch_assoc()) {
            $prevPath = $prev['catIcon_url'] ?? '';
            if ($prevPath && strpos($prevPath, 'media/categoryCardImages/') === 0) {
                // Construir ruta absoluta usando MEDIA_DIR si está definida
                if (defined('MEDIA_DIR')) {
                    $absPrev = rtrim(MEDIA_DIR, '/\\') . '/' . ltrim(substr($prevPath, 6), '/');
                } else {
                    $absPrev = rtrim(dirname(__DIR__), '/\\') . '/' . $prevPath;
                }
                if (is_file($absPrev)) @unlink($absPrev);
            }
        }

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            respondError('No se pudo guardar el archivo subido', 500);
        }

        $upd = $conn->prepare("UPDATE categorias SET catIcon_url = ? WHERE id = ?");
        $upd->bind_param("si", $relative, $catId);
        if (!$upd->execute()) {
            // revertir archivo si falla DB
            if (is_file($targetPath)) @unlink($targetPath);
            respondError('Error al actualizar la categoría: ' . $upd->error, 500);
        }
    log_file_action($conn, $_SESSION, 'upload_category_icon', $finalName, $targetPath, ['categoria_id' => $catId]);
    respondSuccess(['catIcon_url' => $relative], 'Ícono de categoría actualizado');
        break;

    default:
        respondError('Acción no válida', 404);
}