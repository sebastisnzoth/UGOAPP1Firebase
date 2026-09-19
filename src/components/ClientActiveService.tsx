import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Navigation, ReceiptText, X } from 'lucide-react';
import type { Booking, ServiceStatus } from '../types';
import {
  CLOSED_SERVICE_STATUSES,
  sendBookingNotification,
  sortBookingsNewestFirst,
  subscribeToClientBookings,
  transitionBooking,
} from '../services/bookingService';

const labels: Record<ServiceStatus, string> = {
  solicitado: 'Esperando al profesional',
  aceptado: 'Profesional confirmado',
  en_camino: 'Profesional en camino',
  en_curso: 'Trabajo en curso',
  pendiente_confirmacion_cliente: 'Confirmá el trabajo',
  pendiente_pago: 'Pendiente de pago',
  pago_informado: 'Pago informado',
  cerrado: 'Servicio cerrado',
  cancelado: 'Cancelado',
};

export default function ClientActiveService({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => subscribeToClientBookings(userId, setBookings), [userId]);

  const booking = useMemo(() => {
    return sortBookingsNewestFirst(bookings).find((item) => !CLOSED_SERVICE_STATUSES.has(item.estado_servicio));
  }, [bookings]);

  useEffect(() => {
    if (
      booking &&
      ['pendiente_confirmacion_cliente', 'pendiente_pago'].includes(booking.estado_servicio)
    ) {
      setCollapsed(false);
    }
  }, [booking?.estado_servicio]);

  if (!booking) return null;

  const doAction = async (
    action: 'client_confirm_work' | 'client_report_paid' | 'cancel',
    notification?: { title: string; message: string; type?: 'service' | 'payment' }
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await transitionBooking(booking.id, action, userId);
      if (notification) {
        await sendBookingNotification(
          booking,
          userId,
          booking.proveedorId,
          notification.title,
          notification.message,
          notification.type || 'service'
        );
      }
    } catch (error) {
      console.error('Error actualizando el servicio:', error);
    } finally {
      setBusy(false);
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="absolute right-4 top-4 z-50 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-xl md:right-6"
      >
        {labels[booking.estado_servicio]}
      </button>
    );
  }

  return (
    <div className="absolute left-4 right-4 top-4 z-50 rounded-[1.5rem] border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-2xl md:left-auto md:right-6 md:w-[360px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-quantum-cyan">Servicio activo</p>
          <h3 className="mt-1 font-bold">{booking.servicio || booking.categoria || 'Servicio UGO'}</h3>
          <p className="mt-1 text-xs text-white/50">{booking.proveedorNombre || 'Profesional UGO'}</p>
        </div>
        <button type="button" aria-label="Minimizar servicio" onClick={() => setCollapsed(true)} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        {booking.estado_servicio === 'en_camino' ? <Navigation className="text-quantum-cyan" size={20} /> : <Clock3 className="text-quantum-cyan" size={20} />}
        <div>
          <p className="text-xs text-white/45">Estado</p>
          <p className="text-sm font-semibold">{labels[booking.estado_servicio]}</p>
        </div>
      </div>

      {booking.estado_servicio === 'pendiente_confirmacion_cliente' && (
        <div className="mt-4">
          <p className="mb-3 text-xs leading-relaxed text-white/55">
            El profesional indicó que terminó. Confirmá el trabajo antes de pasar al pago.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              doAction('client_confirm_work', {
                title: 'Trabajo confirmado',
                message: 'El cliente confirmó que el trabajo está terminado. Ahora corresponde el pago.',
              })
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-quantum-cyan px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
          >
            <CheckCircle2 size={18} /> Confirmar trabajo terminado
          </button>
        </div>
      )}

      {booking.estado_servicio === 'pendiente_pago' && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <ReceiptText className="mt-0.5 shrink-0 text-emerald-300" size={20} />
            <div>
              <p className="font-bold">Pagá al proveedor R$ {(booking.monto || 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-white/55">Forma de pago predeterminada: efectivo.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              doAction('client_report_paid', {
                title: 'El cliente informó el pago',
                message: `El cliente informó que pagó R$ ${(booking.monto || 0).toFixed(2)}. Confirmá la recepción para cerrar el servicio.`,
                type: 'payment',
              })
            }
            className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
          >
            Ya pagué al proveedor
          </button>
        </div>
      )}

      {booking.estado_servicio === 'pago_informado' && (
        <p className="mt-4 rounded-2xl bg-white/5 p-3 text-xs leading-relaxed text-white/55">
          Pago informado. El servicio se cerrará cuando el proveedor confirme que recibió el dinero.
        </p>
      )}

      {['solicitado', 'aceptado', 'en_camino'].includes(booking.estado_servicio) && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            doAction('cancel', {
              title: 'Pedido cancelado',
              message: 'El cliente canceló el pedido antes de iniciar el trabajo.',
            })
          }
          className="mt-4 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-200 disabled:opacity-50"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
