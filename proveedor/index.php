<?php
// proveedor/index.php
// Módulo de Proveedor - Interfaz Cyberpunk Ejecutivo

require_once '../config.php';

// Identificador Mockeado del Proveedor logueado (en un caso real provendría de $_SESSION)
$prestador_actual_id = 'P-001'; 

// Obtener los servicios disponibles en la zona
$stmt = $pdo->prepare("
    SELECT s.id, s.categoria, s.descripcion, s.precio_estimado, s.creado_en, p.nombre as cliente_nombre
    FROM servicios s
    JOIN profiles p ON s.cliente_id = p.id
    WHERE s.estado = 'buscando'
    ORDER BY s.creado_en DESC
");
$stmt->execute();
$servicios_disponibles = $stmt->fetchAll();

// Obtener los servicios en curso del proveedor
$stmtActivos = $pdo->prepare("
    SELECT s.id, s.categoria, s.estado, s.precio_estimado, p.nombre as cliente_nombre
    FROM servicios s
    JOIN profiles p ON s.cliente_id = p.id
    WHERE s.prestador_id = ? AND s.estado IN ('asignado', 'en_camino', 'en_progreso')
");
$stmtActivos->execute([$prestador_actual_id]);
$servicios_activos = $stmtActivos->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>U.G.O. - Terminal del Prestador</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap');
        
        :root {
            --bg-dark: #050508;
            --neon-cyan: #00d4ff;
            --neon-purple: #b026ff;
            --glass-bg: rgba(10, 15, 30, 0.6);
            --glass-border: rgba(0, 212, 255, 0.2);
        }

        body {
            margin: 0;
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            background-color: var(--bg-dark);
            color: #fff;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(0, 212, 255, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(176, 38, 255, 0.05) 0%, transparent 40%);
            min-height: 100vh;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--glass-border);
            margin-bottom: 30px;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--neon-cyan);
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            letter-spacing: 2px;
        }

        .status {
            font-size: 12px;
            color: #0f0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #0f0;
            border-radius: 50%;
            box-shadow: 0 0 10px #0f0;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .glass-card {
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 20px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 212, 255, 0.1);
            border-color: var(--neon-cyan);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .category {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--neon-purple);
            background: rgba(176, 38, 255, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
        }

        .price {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
        }

        .description {
            font-size: 14px;
            color: #aaa;
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .btn {
            display: block;
            width: 100%;
            padding: 12px;
            background: transparent;
            border: 1px solid var(--neon-cyan);
            color: var(--neon-cyan);
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.3s ease;
            text-align: center;
            text-decoration: none;
        }

        .btn:hover {
            background: var(--neon-cyan);
            color: #000;
            box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
        }

        h2 {
            font-size: 16px;
            font-weight: 300;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        h2::before {
            content: '';
            width: 20px;
            height: 2px;
            background: var(--neon-cyan);
        }

        .active-services {
            margin-bottom: 40px;
        }
        
        .active-card {
            border-color: var(--neon-purple);
        }
    </style>
</head>
<body>

    <header class="header">
        <div class="logo">U.G.O. PROVIDER</div>
        <div class="status">SISTEMA CORTICAL CONECTADO</div>
    </header>

    <?php if (count($servicios_activos) > 0): ?>
    <section class="active-services">
        <h2>Servicios en Curso</h2>
        <div class="grid">
            <?php foreach($servicios_activos as $activo): ?>
            <div class="glass-card active-card">
                <div class="card-header">
                    <span class="category"><?= htmlspecialchars($activo['categoria']) ?></span>
                    <span class="price">$<?= number_format($activo['precio_estimado'], 2) ?></span>
                </div>
                <div class="description">
                    <strong>Cliente:</strong> <?= htmlspecialchars($activo['cliente_nombre']) ?><br>
                    <strong>Estado:</strong> <span style="color: var(--neon-cyan); text-transform: uppercase;"><?= htmlspecialchars($activo['estado']) ?></span>
                </div>
                <a href="update_status.php?id=<?= $activo['id'] ?>&status=en_progreso" class="btn" style="border-color: var(--neon-purple); color: var(--neon-purple);">
                    ACTUALIZAR ESTADO
                </a>
            </div>
            <?php endforeach; ?>
        </div>
    </section>
    <?php endif; ?>

    <section>
        <h2>Nuevas Solicitudes en tu Zona</h2>
        <div class="grid">
            <?php if (count($servicios_disponibles) === 0): ?>
                <div style="color: rgba(255,255,255,0.4); font-size: 12px;">>>> SIN SEÑALES EN EL RADAR ACTUAL.</div>
            <?php endif; ?>
            
            <?php foreach($servicios_disponibles as $servicio): ?>
            <div class="glass-card">
                <div class="card-header">
                    <span class="category"><?= htmlspecialchars($servicio['categoria']) ?></span>
                    <span class="price">$<?= number_format($servicio['precio_estimado'], 2) ?></span>
                </div>
                <div class="description">
                    <strong>Cliente:</strong> <?= htmlspecialchars($servicio['cliente_nombre']) ?><br>
                    <p><?= htmlspecialchars($servicio['descripcion']) ?></p>
                </div>
                <form action="accept.php" method="POST">
                    <input type="hidden" name="servicio_id" value="<?= $servicio['id'] ?>">
                    <input type="hidden" name="prestador_id" value="<?= $prestador_actual_id ?>">
                    <button type="submit" class="btn">ACPTAR PROPUESTA</button>
                </form>
            </div>
            <?php endforeach; ?>
        </div>
    </section>

</body>
</html>
