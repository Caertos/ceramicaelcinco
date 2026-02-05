<?php
session_start();
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';
header('Content-Type: application/json; charset=utf-8');

/* =============================================================
     Endpoint: logs_admin.php
     Resumen: Administración avanzada de logs - solo superusuarios
     Funciones: rotación manual, estadísticas, configuración
     Parámetros (POST): action (stats|rotate|config)
     Respuesta: JSON con resultado de la operación
     ============================================================= */

// Verificar autenticación y permisos
if (!isset($_SESSION['usuario']) || ($_SESSION['role'] ?? 'user') !== 'super') {
    json_error('No autorizado', 403);
}

$conn = db();
ensure_uploads_log_table($conn);

// Verificar método y obtener acción
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
    case 'stats':
        // Estadísticas detalladas de logs
        $stats = [];
        
        // Conteo total de registros
        $total_result = $conn->query("SELECT COUNT(*) as total FROM uploads_log");
        $stats['total_records'] = (int)($total_result->fetch_assoc()['total'] ?? 0);
        
        // Registros por período
        $periods = [
            'last_24h' => '24 HOUR',
            'last_week' => '7 DAY',
            'last_month' => '30 DAY',
            'last_3_months' => '90 DAY',
            'last_6_months' => '180 DAY',
            'older_than_6_months' => null // Caso especial
        ];
        
        foreach ($periods as $period_key => $interval) {
            if ($period_key === 'older_than_6_months') {
                $query = "SELECT COUNT(*) as count FROM uploads_log WHERE created_at < (NOW() - INTERVAL 6 MONTH)";
            } else {
                $query = "SELECT COUNT(*) as count FROM uploads_log WHERE created_at >= (NOW() - INTERVAL $interval)";
            }
            
            $result = $conn->query($query);
            $stats[$period_key] = (int)($result->fetch_assoc()['count'] ?? 0);
        }
        
        // Top acciones
        $actions_result = $conn->query("
            SELECT action, COUNT(*) as count 
            FROM uploads_log 
            WHERE created_at >= (NOW() - INTERVAL 30 DAY)
            GROUP BY action 
            ORDER BY count DESC 
            LIMIT 10
        ");
        $stats['top_actions'] = [];
        while ($row = $actions_result->fetch_assoc()) {
            $stats['top_actions'][] = $row;
        }
        
        // Top usuarios
        $users_result = $conn->query("
            SELECT username, COUNT(*) as count 
            FROM uploads_log 
            WHERE created_at >= (NOW() - INTERVAL 30 DAY)
            GROUP BY username 
            ORDER BY count DESC 
            LIMIT 10
        ");
        $stats['top_users'] = [];
        while ($row = $users_result->fetch_assoc()) {
            $stats['top_users'][] = $row;
        }
        
        // Tamaño estimado de la tabla (aproximado)
        $size_result = $conn->query("
            SELECT 
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'uploads_log'
        ");
        $size_row = $size_result->fetch_assoc();
        $stats['table_size_mb'] = (float)($size_row['size_mb'] ?? 0);
        
        json_ok(['stats' => $stats]);
        break;
        
    case 'rotate':
        // Rotación manual forzada
        $force_config = $input['config'] ?? [];
        $default_config = get_log_rotation_config();
        
        // Permitir override de configuración para rotación manual
        $rotation_config = array_merge($default_config, $force_config, [
            'cleanup_probability' => 100 // Siempre ejecutar en rotación manual
        ]);
        
        // Validar parámetros
        $rotation_config['retention_months'] = max(1, min(24, (int)$rotation_config['retention_months']));
        $rotation_config['max_records_per_cleanup'] = max(100, min(10000, (int)$rotation_config['max_records_per_cleanup']));
        
        $rotation_result = rotate_uploads_log($conn, $rotation_config);
        
        // Log de la acción manual
        log_file_action($conn, $_SESSION, 'manual_log_rotation', 'logs_admin.php', '', [
            'deleted_records' => $rotation_result['deleted_records'],
            'retention_months' => $rotation_result['retention_months'],
            'forced_config' => $force_config
        ]);
        
        json_ok([
            'message' => 'Rotación de logs completada',
            'rotation_result' => $rotation_result
        ]);
        break;
        
    case 'config':
        // Obtener configuración actual
        $current_config = get_log_rotation_config();
        
        // Información del entorno
        $env_info = [
            'app_env' => defined('APP_ENV') ? APP_ENV : 'undefined',
            'php_version' => PHP_VERSION,
            'mysql_version' => $conn->server_info
        ];
        
        json_ok([
            'config' => $current_config,
            'environment' => $env_info,
            'available_actions' => ['stats', 'rotate', 'config']
        ]);
        break;
        
    default:
        json_error('Acción no válida. Acciones disponibles: stats, rotate, config', 400);
}
?>