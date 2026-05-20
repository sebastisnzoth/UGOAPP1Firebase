<?php
// proveedor/accept.php
// Controlador para Aceptar un Servicio y Notificar al Núcleo de Hugo

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $servicio_id = $_POST['servicio_id'] ?? null;
    $prestador_id = $_POST['prestador_id'] ?? null;

    if ($servicio_id && $prestador_id) {
        try {
            $pdo->beginTransaction();

            // 1. Actualizar el estado del servicio
            $stmt = $pdo->prepare("
                UPDATE servicios 
                SET estado = 'asignado', prestador_id = ? 
                WHERE id = ? AND estado = 'buscando'
            ");
            $stmt->execute([$prestador_id, $servicio_id]);

            if ($stmt->rowCount() > 0) {
                // 2. Notificación Cuántica para U.G.O (Hugo) - Context Hook
                // Insertamos un log en interacciones para que el Orquestador y el Panel de Control sepan del cambio.
                $hugo_intent = 'STATE_CHANGE_ACCEPTED';
                $mensaje_usuario = "El proveedor $prestador_id ha aceptado el contrato $servicio_id.";
                $contexto = json_encode([
                    "servicio_id" => $servicio_id,
                    "prestador_id" => $prestador_id,
                    "nuevo_estado" => "asignado",
                    "accion_requerida_hugo" => "Informar al cliente y cambiar UI a ACTIVE_SERVICE"
                ]);

                $stmtLog = $pdo->prepare("
                    INSERT INTO interacciones (usuario_id, hugo_intent, mensaje_usuario, contexto_json) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmtLog->execute([$prestador_id, $hugo_intent, $mensaje_usuario, $contexto]);

                $pdo->commit();
                
                // Redigirigir con éxito
                header("Location: index.php?success=1");
                exit;
            } else {
                $pdo->rollBack();
                die('<div style="color:red; font-family:monospace;">> ERROR: Contrato no disponible o ya asignado.</div>');
            }

        } catch (\Exception $e) {
            $pdo->rollBack();
            die('<div style="color:red; font-family:monospace;">> FALLA SISTÉMICA: ' . $e->getMessage() . '</div>');
        }
    }
}

header("Location: index.php");
exit;
?>
