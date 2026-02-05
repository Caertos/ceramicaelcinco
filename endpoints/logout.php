<?php
/* =============================================================
	 Endpoint: logout.php
	 Resumen: Cierra la sesión actual y redirige a /login dentro de la SPA.
	 Diccionario:
		 - redirección: Respuesta HTTP que instruye al navegador cambiar de URL.
	 Parámetros: Ninguno.
	 Respuesta: 302 (Location: /login) – No retorna JSON.
	 ============================================================= */
session_start();
session_destroy();
$baseUrl = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://";
$baseUrl .= $_SERVER['HTTP_HOST'];
header("Location: " . $baseUrl . "/login");
exit();