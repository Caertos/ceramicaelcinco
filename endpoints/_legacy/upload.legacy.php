<?php
// LEGACY ENDPOINT
// Este script ha sido movido a endpoints/_legacy/ y se mantiene solo por compatibilidad histórica.
// No es utilizado por el frontend actual. Preferir las rutas modernas del panel de administración.

require_once dirname(__DIR__) . "/check_auth.php"; // ajustar a la ruta correcta del actual check_auth
require_once __DIR__ . "/../../config.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';

    if ($nombre !== '' && isset($_FILES['archivo'])) {
        $file = $_FILES['archivo'];

        $fileType = function_exists('mime_content_type') ? @mime_content_type($file["tmp_name"]) : ($file['type'] ?? 'application/pdf');
        if ($fileType !== "application/pdf") {
            die("Solo se permiten archivos PDF.");
        }

        $extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        if ($extension !== "pdf") {
            die("El archivo debe tener extensión .pdf");
        }

        $fileName = time() . "_" . basename($file["name"]);
        $targetDir = rtrim(UPLOAD_DIR, "/\\");
        $targetFile = $targetDir . DIRECTORY_SEPARATOR . $fileName;

        if (!is_dir($targetDir)) { @mkdir($targetDir, 0755, true); }
        if (!is_dir($targetDir) || !is_writable($targetDir)) {
            die("Directorio de uploads no disponible o no escribible.");
        }

        if (move_uploaded_file($file["tmp_name"], $targetFile)) {
            $conn = db();
            // Nota: esta tabla puede no existir en el esquema actual; este endpoint es legacy.
            $stmt = $conn->prepare("INSERT INTO catalogos (nombre, archivo) VALUES (?, ?)");
            if ($stmt) {
                $stmt->bind_param("ss", $nombre, $fileName);
                if ($stmt->execute()) {
                    echo "Archivo PDF subido con éxito.";
                    echo "<br><a href='" . htmlspecialchars('/endpoints/admin_panel.php', ENT_QUOTES, 'UTF-8') . "'>Volver al panel</a>";
                } else {
                    echo "Error al registrar en DB: " . $stmt->error;
                }
                $stmt->close();
            } else {
                echo "Error preparando sentencia en DB.";
            }
        } else {
            echo "Error al subir el archivo.";
        }
    } else {
        echo "Nombre y archivo requeridos.";
    }
} else {
    echo "Método no permitido.";
}
