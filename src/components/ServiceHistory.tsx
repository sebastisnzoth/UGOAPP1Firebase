import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, X, XCircle } from 'lucide-react';
import type { Booking, ServiceStatus, UserRole } from '../types';
import {
  sortBookingsNewestFirst,
  subscribeToClientBookings,
  subscribeToProviderBookings,
} from '../services/bookingService';

interface ServiceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  role?: UserRole | null;
}

const labels: Record<ServiceStatus, string> = {
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

export default function ServiceHistory({ isOpen, onClose, userId, role }: ServiceHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    if (role === 'proveedor') {
      return subscribeToProviderBookings(userId, setBookings);
    }

    return subscribeToClientBookings(userId, setBookings);
  }, [isOpen, role, userId]);

  const history = useMemo(() => sortBookingsNewestFirst(bookings), [bookings]);

  if (!isOpen) return null;

  return (
    <div className="min-h-full rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">UGO</p>
          <h2 className="mt-1 text-2xl font-bold">Historial de servicios</h2>
          <p className="mt-1 text-sm text-white/45">
            Todos los estados salen del mismo pedido en tiempo real.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar historial"
          onClick={onClose}
          className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <Clock3 className="mx-auto text-white/25" size={28} />
            <p className="mt-3 text-sm text-white/45">Todavía no hay servicios registrados.</p>
          </div>
        ) : (
          history.map((booking) => {
            const closed = booking.estado_servicio === 'cerrado';
            const cancelled = booking.estado_servicio === 'cancelado';

            return (
              <button
                type="button"
                key={booking.id}
                onClick={() => setSelected(booking)}
                className="w-full rounded-2xl border border-white/8 bg-white/5 p-4 text-left transition-colors hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {booking.servicio || booking.categoria || 'Servicio UGO'}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/45">
                      {role === 'proveedor'
                        ? booking.clienteNombre || 'Cliente UGO'
                        : booking.proveedorNombre || 'Profesional UGO'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-quantum-cyan">R$ {(booking.monto || 0).toFixed(2)}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider">
                      {closed ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : cancelled ? (
                        <XCircle size={12} className="text-red-400" />
                      ) : (
                        <Clock3 size={12} className="text-amber-300" />
                      )}
                      <span className={closed ? 'text-emerald-300' : cancelled ? 'text-red-300' : 'text-white/50'}>
                        {labels[booking.estado_servicio]}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/35">Detalle</p>
              <p className="mt-1 font-bold">{selected.servicio || selected.categoria || 'Servicio UGO'}</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar detalle"
              onClick={() => setSelected(null)}
              className="rounded-full p-1.5 text-white/45 hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Estado</p>
              <p className="mt-1 font-semibold">{labels[selected.estado_servicio]}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Pago</p>
              <p className="mt-1 font-semibold">
                {selected.paymentMethod === 'mercado_pago' ? 'Mercado Pago' : 'Efectivo'} · {selected.paymentStatus}
              </p>
            </div>
          </div>

          <p className="mt-3 break-all text-[10px] text-white/25">ID: {selected.id}</p>
        </div>
      )}
    </div>
  );
}
