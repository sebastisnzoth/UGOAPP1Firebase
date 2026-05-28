<?php
require 'vendor/autoload.php';

use Google\Cloud\Firestore\FirestoreClient;

// Set up error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// La ruta donde debes colocar tu archivo descargado de Firebase
$serviceAccountPath = __DIR__ . '/firebase-credentials.json';
$hasDb = file_exists($serviceAccountPath);

$profiles = [];
$bookings = [];

if ($hasDb) {
    try {
        $firestore = new FirestoreClient([
            'keyFilePath' => $serviceAccountPath
        ]);

        $profilesRef = $firestore->collection('profiles')->documents();
        foreach ($profilesRef as $document) {
            if ($document->exists()) {
                $profiles[] = $document->data();
            }
        }

        $bookingsRef = $firestore->collection('bookings')->documents();
        foreach ($bookingsRef as $document) {
            if ($document->exists()) {
                $bookings[] = $document->data();
            }
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Data processing
$totalUsers = count($profiles);
$clientes = 0;
$proveedores = 0;
$karmas = [];

foreach ($profiles as $p) {
    if (isset($p['role'])) {
        if ($p['role'] === 'cliente') $clientes++;
        if ($p['role'] === 'proveedor') {
            $proveedores++;
            if (isset($p['karma'])) {
                $karmas[] = $p['karma'];
            }
        }
    }
}

$totalReservas = count($bookings);
$avgKarma = count($karmas) > 0 ? array_sum($karmas) / count($karmas) : 0;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>U.G.O. QUANTUM OS - Analytics 📊</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-slate-950 text-slate-200 p-8 font-sans">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-cyan-400 mb-2">U.G.O. QUANTUM OS - Analytics Dashboard 📊</h1>
        <p class="text-slate-400 mb-8 border-b border-slate-800 pb-4">Monitor de Actividad y Volumetría de Servicios usando PHP & Chart.js</p>
        
        <?php if (!$hasDb): ?>
            <div class="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-6 rounded-lg mb-6 leading-relaxed">
                <strong class="text-xl inline-block mb-3">⚠️ Configuración Requerida: Falta el archivo de credenciales</strong>
                <p class="mb-4">Para conectar PHP con tu base de datos Firestore, necesitas el archivo de cuenta de servicio.</p>
                <ol class="list-decimal ml-6 mt-2 space-y-2">
                    <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" class="text-cyan-400 underline">Firebase Console</a>.</li>
                    <li>Entra a <strong>Configuración del Proyecto</strong> &gt; <strong>Cuentas de Servicio</strong>.</li>
                    <li>Haz clic en <strong>Generar una nueva clave privada</strong> (archivo JSON).</li>
                    <li>Guarda el archivo JSON en esta misma carpeta (<code>/analytics</code>) con el nombre exacto de <code>firebase-credentials.json</code>.</li>
                    <li>Asegúrate de ejecutar <code>composer install</code> en tu terminal para instalar la librería de Google Cloud.</li>
                </ol>
            </div>
        <?php else: ?>
            <?php if (isset($error)): ?>
                <div class="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
                    <strong>Error conectando a Firestore:</strong> <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span class="text-slate-400 text-sm uppercase tracking-wider">Usuarios Totales</span>
                    <span class="text-4xl font-mono text-white mt-2"><?php echo $totalUsers; ?></span>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span class="text-slate-400 text-sm uppercase tracking-wider">Clientes Activos</span>
                    <span class="text-4xl font-mono text-emerald-400 mt-2"><?php echo $clientes; ?></span>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span class="text-slate-400 text-sm uppercase tracking-wider">Proveedores</span>
                    <span class="text-4xl font-mono text-cyan-400 mt-2"><?php echo $proveedores; ?></span>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span class="text-slate-400 text-sm uppercase tracking-wider">Servicios Registrados</span>
                    <span class="text-4xl font-mono text-fuchsia-400 mt-2"><?php echo $totalReservas; ?></span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 class="text-lg text-slate-300 mb-4">Distribución de Roles</h3>
                    <div class="w-full max-w-[300px] mx-auto">
                        <canvas id="rolesChart"></canvas>
                    </div>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 class="text-lg text-slate-300 mb-4">Métricas de Karma (Promedio: <?php echo number_format($avgKarma, 1); ?>)</h3>
                    <canvas id="karmaChart"></canvas>
                </div>
            </div>

            <script>
                // Roles Chart
                const ctxRoles = document.getElementById('rolesChart').getContext('2d');
                new Chart(ctxRoles, {
                    type: 'doughnut',
                    data: {
                        labels: ['Clientes', 'Proveedores'],
                        datasets: [{
                            data: [<?php echo $clientes; ?>, <?php echo $proveedores; ?>],
                            backgroundColor: ['#34d399', '#22d3ee'],
                            borderWidth: 0
                        }]
                    },
                    options: { plugins: { legend: { labels: { color: '#cbd5e1' } } } }
                });

                // Karma Chart
                const ctxKarma = document.getElementById('karmaChart').getContext('2d');
                new Chart(ctxKarma, {
                    type: 'bar',
                    data: {
                        labels: ['Karma General de Proveedores'],
                        datasets: [{
                            label: 'Promedio de Puntos',
                            data: [<?php echo $avgKarma; ?>],
                            backgroundColor: '#c084fc',
                            borderRadius: 6
                        }]
                    },
                    options: { 
                        scales: { 
                            y: { beginAtZero: true, max: 100, ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } }, 
                            x: { ticks: { color: '#cbd5e1' }, grid: { display: false } } 
                        }, 
                        plugins: { legend: { labels: { color: '#cbd5e1' } } } 
                    }
                });
            </script>
        <?php endif; ?>
    </div>
</body>
</html>
