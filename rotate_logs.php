#!/usr/bin/env php
<?php
/**
 * Script de rotación automática de logs para Cerámica El Cinco
 * 
 * Uso:
 * - Como cron job: 0 2 * * 0 /path/to/rotate_logs.php
 * - Manual: php rotate_logs.php [--force] [--retention-months=6] [--max-records=1000]
 * 
 * Configuración vía argumentos:
 * --force: Fuerza la ejecución ignorando probabilidad
 * --retention-months=N: Meses de retención (1-24)
 * --max-records=N: Máximo de registros por lote (100-10000)
 * --verbose: Salida detallada
 * --dry-run: Simula la ejecución sin eliminar registros
 */

// Verificar que se ejecute desde CLI
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("Este script solo puede ejecutarse desde línea de comandos.\n");
}

// Cargar configuración
require_once __DIR__ . '/_config_loader.php';
require_once __DIR__ . '/_helpers.php';

// Parsear argumentos de línea de comandos
$options = getopt('', [
    'force', 
    'retention-months:', 
    'max-records:', 
    'verbose', 
    'dry-run',
    'help'
]);

if (isset($options['help'])) {
    echo "Script de Rotación de Logs - Cerámica El Cinco\n\n";
    echo "Uso: php rotate_logs.php [opciones]\n\n";
    echo "Opciones:\n";
    echo "  --force                  Fuerza la ejecución ignorando probabilidad\n";
    echo "  --retention-months=N     Meses de retención (1-24, default: según entorno)\n";
    echo "  --max-records=N          Máximo registros por lote (100-10000, default: según entorno)\n";
    echo "  --verbose                Salida detallada\n";
    echo "  --dry-run                Simula ejecución sin eliminar registros\n";
    echo "  --help                   Muestra esta ayuda\n\n";
    echo "Ejemplos:\n";
    echo "  php rotate_logs.php --force --verbose\n";
    echo "  php rotate_logs.php --retention-months=3 --max-records=500\n";
    echo "  php rotate_logs.php --dry-run --verbose\n";
    exit(0);
}

$verbose = isset($options['verbose']);
$dry_run = isset($options['dry-run']);
$force = isset($options['force']);

if ($verbose) {
    echo "=== Rotación de Logs - Cerámica El Cinco ===\n";
    echo "Fecha: " . date('Y-m-d H:i:s') . "\n";
    echo "Modo: " . ($dry_run ? 'SIMULACIÓN' : 'EJECUCIÓN') . "\n";
    if (defined('APP_ENV')) {
        echo "Entorno: " . APP_ENV . "\n";
    }
    echo "\n";
}

try {
    // Conectar a la base de datos
    $conn = db();
    ensure_uploads_log_table($conn);
    
    if ($verbose) {
        echo "✓ Conexión a base de datos establecida\n";
    }
    
    // Obtener configuración base
    $base_config = get_log_rotation_config();
    
    // Aplicar overrides de línea de comandos
    $config = $base_config;
    
    if (isset($options['retention-months'])) {
        $config['retention_months'] = max(1, min(24, (int)$options['retention-months']));
    }
    
    if (isset($options['max-records'])) {
        $config['max_records_per_cleanup'] = max(100, min(10000, (int)$options['max-records']));
    }
    
    if ($force) {
        $config['cleanup_probability'] = 100;
    }
    
    if ($verbose) {
        echo "Configuración:\n";
        foreach ($config as $key => $value) {
            echo "  $key: $value\n";
        }
        echo "\n";
    }
    
    // Contar registros antes de la limpieza
    $count_stmt = $conn->prepare("SELECT COUNT(*) as total FROM uploads_log WHERE created_at < (NOW() - INTERVAL ? MONTH)");
    $count_stmt->bind_param("i", $config['retention_months']);
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $records_to_delete = (int)($count_result->fetch_assoc()['total'] ?? 0);
    $count_stmt->close();
    
    if ($verbose) {
        echo "Registros elegibles para eliminación: $records_to_delete\n";
    }
    
    if ($records_to_delete === 0) {
        if ($verbose) {
            echo "✓ No hay registros para eliminar\n";
        }
        exit(0);
    }
    
    if ($dry_run) {
        echo "SIMULACIÓN: Se eliminarían $records_to_delete registros\n";
        echo "Configuración que se usaría:\n";
        foreach ($config as $key => $value) {
            echo "  $key: $value\n";
        }
        exit(0);
    }
    
    // Ejecutar rotación
    $start_time = microtime(true);
    $rotation_result = rotate_uploads_log($conn, $config);
    $end_time = microtime(true);
    $execution_time = round($end_time - $start_time, 2);
    
    if ($verbose) {
        echo "Resultado de rotación:\n";
        foreach ($rotation_result as $key => $value) {
            echo "  $key: $value\n";
        }
        echo "Tiempo de ejecución: {$execution_time}s\n";
    }
    
    // Log del resultado para monitoreo
    $log_message = sprintf(
        "Log rotation completed: deleted %d records, retention %d months, execution time %.2fs",
        $rotation_result['deleted_records'],
        $rotation_result['retention_months'],
        $execution_time
    );
    
    error_log($log_message);
    
    if ($verbose) {
        echo "✓ $log_message\n";
    }
    
    // Código de salida basado en el resultado
    if (!$rotation_result['executed']) {
        if ($verbose) {
            echo "ℹ Rotación no ejecutada: {$rotation_result['reason']}\n";
        }
        exit(0); // No es error, simplemente no se ejecutó por probabilidad
    }
    
    if ($rotation_result['deleted_records'] > 0) {
        if ($verbose) {
            echo "✓ Rotación completada exitosamente\n";
        }
        exit(0);
    } else {
        if ($verbose) {
            echo "ℹ Rotación ejecutada pero no se eliminaron registros\n";
        }
        exit(0);
    }
    
} catch (Exception $e) {
    $error_message = "Error en rotación de logs: " . $e->getMessage();
    error_log($error_message);
    
    if ($verbose) {
        echo "✗ $error_message\n";
        echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    } else {
        echo "$error_message\n";
    }
    
    exit(1);
}
?>