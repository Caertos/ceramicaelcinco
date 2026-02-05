<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';


/* =============================================================
     Endpoint: get_gallery.php
     Resumen: Devuelve elementos de la galería filtrados por tipo (foto|video)
                        ordenados por fecha de subida, incluyendo miniatura si la columna
                        thumb_url está disponible.
     Diccionario:
         - tipo: Parámetro de filtro; 'imagen' se normaliza a 'foto'.
         - thumb: Miniatura opcional asociada (solo si existe columna thumb_url).
     Parámetros:
         - GET/POST: tipo = foto | imagen | video
     Respuestas:
         - Éxito: { success:true, message:'OK', data:[ { id, nombre, url, tipo, fecha_subida, thumb } ] }
         - Error: { success:false, message }
     Notas:
         - Usa json_ok/json_error para formato uniforme.
     ============================================================= */

// Ahora usamos json_ok / json_error para mantener consistencia { success, message, data }

try {
    $conn = db();
} catch (Throwable $e) {
    json_error('Error de conexión DB: ' . $e->getMessage(), 500);
}

$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : (isset($_POST['tipo']) ? $_POST['tipo'] : '');
$tipo = trim(strtolower($tipo));

// Aceptar 'imagen' o 'foto' como 'foto'
if ($tipo === 'imagen' || $tipo === 'foto') {
    $tipo_db = 'foto';
} elseif ($tipo === 'video') {
    $tipo_db = 'video';
} else {
    json_error('Tipo no válido. Use foto|imagen|video', 400);
}

// Detectar si existe la columna thumb_url de forma portable
$hasThumb = false;
if ($q = $conn->query("SHOW COLUMNS FROM galeria LIKE 'thumb_url'")) {
    $hasThumb = (bool)$q->num_rows;
    $q->close();
}

$sql = 'SELECT id, nombre, url, tipo, fecha_subida' . ($hasThumb ? ', thumb_url AS thumb' : ', NULL AS thumb') . ' FROM galeria WHERE tipo = ? ORDER BY fecha_subida DESC';
if (!$stmt = $conn->prepare($sql)) { json_error('Error al preparar consulta: ' . $conn->error, 500); }
$stmt->bind_param('s', $tipo_db);
if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    json_error('Error al ejecutar consulta: ' . $err, 500);
}
$result = $stmt->get_result();
$galeria = [];
while ($row = $result->fetch_assoc()) {
    $galeria[] = $row;
}
$stmt->close();

json_ok($galeria, 'OK');
