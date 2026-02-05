<?php
/* =============================================================
	Endpoint: upload.php (LEGACY)
	Resumen: Marcado como retirado; instruye usar endpoints modernos.
	Diccionario: legacy = deprecado; no debe usarse en producción.
	Parámetros: Ninguno.
	Respuesta: 410 Gone (texto plano explicativo).
	============================================================= */

http_response_code(410);
header('Content-Type: text/plain; charset=utf-8');
echo "Este endpoint ha sido retirado (410 Gone).\n";
echo "Use los endpoints modernos del panel de administración.";
exit;
?>