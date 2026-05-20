<?php
// config.php
// Configuración global y conexión PDO segura a la base de datos MySQL 

$host = '127.0.0.1';
$db   = 'ugo_quantum';
$user = 'root'; // Ajustar según credenciales del servidor
$pass = '';     // Ajustar según credenciales del servidor
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones en errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devolver arrays asociativos
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Evitar inyección SQL forzando emulación desactivada
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Para producción, idealmente loguear en lugar de exponer el error en pantalla
    die('<div style="color:red; font-family:monospace;">> ERROR DE CONEXIÓN DEL NÚCLEO: ' . $e->getMessage() . '</div>');
}
?>
