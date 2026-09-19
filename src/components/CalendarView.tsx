import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3 } from 'lucide-react';
import type { Booking, UserRole } from '../types';
import {
  bookingTimeValue,
  subscribeToClientBookings,
  subscribeToProviderBookings,
} from '../services/bookingService';

interface CalendarViewProps {
  userId: string;
  role?: UserRole | null;
}

const statusLabel: Record<string, string> = {
  solicitado: 'Solicitado',
  aceptado: 'Aceptado',
  en_camino: 'En camino',
  en_curso: 'En curso',
  pendiente_confirmacion_cliente: 'Esperando confirmación',
  pendiente_pago: 'Pendiente de pago',
  pago_informado: 'Pago informado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export default function CalendarView({ userId, role }: CalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (role === 'proveedor') {
      return subscribeToProviderBookings(userId, setBookings);
    }
    return subscribeToClientBookings(userId, setBookings);
  }, [role, userId]);

  const scheduled = useMemo(() => {
    return bookings
      .filter((booking) => booking.scheduledFor && booking.estado_servicio !== 'cancelado')
      .sort(
        (a, b) =>
          bookingTimeValue(a.scheduledFor) - bookingTimeValue(b.scheduledFor)
      );
  }, [bookings]);

  return (
    <div className="min-h-full rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-center gap-3">
        <Calendar className="text-quantum-cyan" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-quantum-cyan">UGO</p>
          <h2 className="text-xl font-bold">Agenda</h2>
        </div>
      </div>

      <p className="mt-2 text-sm text-white/40">
        Los trabajos agendados usan el mismo pedido que Cliente y Proveedor.
      </p>

      <div className="mt-6 space-y-3">
        {scheduled.length > 0 ? (
          scheduled.map((booking) => {
            const time = bookingTimeValue(booking.scheduledFor);
            const date = time ? new Date(time) : null;

            return (
              <div key={booking.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {booking.servicio || booking.categoria || 'Servicio UGO'}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/45">
                      {role === 'proveedor'
                        ? booking.clienteNombre || 'Cliente UGO'
                        : booking.proveedorNombre || 'Profesional UGO'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-quantum-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-quantum-cyan">
                    {statusLabel[booking.estado_servicio] || booking.estado_servicio}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-black/20 p-3">
                  <Clock3 size={17} className="text-quantum-cyan" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">Agendado para</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {date
                        ? new Intl.DateTimeFormat('es', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(date)
                        : 'Fecha pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <Calendar className="mx-auto text-white/20" size={30} />
            <p className="mt-3 text-sm text-white/45">No hay trabajos agendados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
