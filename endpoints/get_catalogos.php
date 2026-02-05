<?php
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json; charset=utf-8');


/* =============================================================
     Endpoint: get_catalogos.php
     Resumen: Lista categorías y sus productos con URLs derivadas para mostrar
                        ícono (o placeholder) y acceder/descargar PDFs asociados.
     Diccionario:
         - placeholder: Imagen usada cuando no hay ícono específico.
         - serve_media: Endpoint que sirve rutas relativas en carpeta media.
     Parámetros: (ninguno)
     Respuestas:
         - Éxito: { success:true, data:[ { id, name, imageUrl, catIcon_url, items:[ { id,label,file,viewUrl,downloadUrl } ] } ] }
         - Error: { success:false, message }
     Notas:
         - Construye URLs absolutas basadas en esquema y host detectados.
     ============================================================= */
try { $conn = db(); } catch (Throwable $e) { json_error('Error conexión DB', 500); }

$sql = "SELECT c.id AS categoria_id,
               c.nombre AS categoria_nombre,
               c.catIcon_url AS categoria_icon,
               p.id AS producto_id,
               p.nombre AS producto_nombre,
               p.archivo
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id
        ORDER BY c.id ASC, p.created_at DESC";

$res = $conn->query($sql);
if ($res === false) { json_error('Error en la consulta a la base de datos', 500); }

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$basePublic = $scheme . '://' . $host; 

$placeholder = rtrim($basePublic, '/') . '/LogoCEC.svg';

$data = [];
while ($row = $res->fetch_assoc()) {
    $cid = $row['categoria_id'];

    if (!isset($data[$cid])) {
        $catIconField = isset($row['categoria_icon']) ? trim($row['categoria_icon']) : '';
        $imageUrl = $placeholder;

        if (!empty($catIconField)) {
            if (preg_match('#^https?://#i', $catIconField)) {
                $imageUrl = $catIconField;
            } else {
                if (strpos($catIconField, 'media/') === 0) {
                    $imageUrl = rtrim($basePublic, '/') . '/endpoints/serve_media.php?p=' . rawurlencode($catIconField);
                } else {
                    $maybePublicPath = '/' . ltrim($catIconField, '/');
                    $documentRoot = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') : '';
                    $fsPath = $documentRoot !== '' ? $documentRoot . $maybePublicPath : '';

                    if ($fsPath !== '' && file_exists($fsPath)) {
                        $imageUrl = rtrim($basePublic, '/') . $maybePublicPath;
                    } else {
                        $imageUrl = rtrim($basePublic, '/') . $maybePublicPath;
                    }
                }
            }
        }

        $data[$cid] = [
            'id' => (int)$cid,
            'name' => $row['categoria_nombre'],
            'imageUrl' => $imageUrl,
            'catIcon_url' => isset($row['categoria_icon']) ? $row['categoria_icon'] : null,
            'items' => []
        ];
    }

    if (!empty($row['producto_id'])) {
        $pid = (int)$row['producto_id'];
        $archivo = $row['archivo'];

    $viewUrl = '/endpoints/download.php?id=' . $pid;
    $downloadUrl = '/endpoints/download.php?id=' . $pid . '&dl=1';

        $data[$cid]['items'][] = [
            'id' => $pid,
            'label' => $row['producto_nombre'],
            'file' => $archivo,
            'viewUrl' => $viewUrl,
            'downloadUrl' => $downloadUrl
        ];
    }
}

json_ok(array_values($data), 'OK');
