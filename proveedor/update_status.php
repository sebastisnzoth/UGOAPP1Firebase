<?php
// proveedor/update_status.php
// Controlador para Actualizar el progreso del servicio (En Camino, En Progreso, Completado)

require_once '../config.php';

$servicio_id = $_GET['id'] ?? null;
$nuevo_estado = $_GET['status'] ?? null; // 'en_progreso', 'completado', etc.

// Nota: Deberíamos verificar que el prestador en sesión es el asignado a este servicio.
// Aquí usamos P-001 como predeterminado por el mock.
$prestador_actual_id = 'P-001';

if ($servicio_id && $nuevo_estado) {
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            UPDATE servicios 
            SET estado = ? 
            WHERE id = ? AND prestador_id = ?
        ");
        $stmt->execute([$nuevo_estado, $servicio_id, $prestador_actual_id]);

        if ($stmt->rowCount() > 0) {
            // Notificar a Hugo (Context Hook para la AI)
            $hugo_intent = 'STATE_CHANGE_PROGRESS';
            $mensaje = "El servicio $servicio_id cambió su estado a: $nuevo_estado.";
            $contexto = json_encode([
                "servicio_id" => $servicio_id,
                "estado_actual" => $nuevo_estado
            ]);

            $stmtLog = $pdo->prepare("
                INSERT INTO interacciones (usuario_id, hugo_intent, mensaje_usuario, contexto_json) 
                VALUES (?, ?, ?, ?)
            ");
            $stmtLog->execute([$prestador_actual_id, $hugo_intent, $mensaje, $contexto]);

            $pdo->commit();
            header("Location: index.php?updated=1");
            exit;
        } else {
            $pdo->rollBack();
            die('<div style="color:red; font-family:monospace;">> ERROR: Operación no autorizada.</div>');
        }

    } catch (\Exception $e) {
        $pdo->rollBack();
        die('<div style="color:red; font-family:monospace;">> FALLA SISTÉMICA: ' . $e->getMessage() . '</div>');
    }
}

header("Location: index.php");
exit;
?>
