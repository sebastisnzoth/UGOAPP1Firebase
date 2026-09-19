import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { Briefcase, CalendarClock, CheckCircle2, MapPin, Navigation, Play, ReceiptText } from 'lucide-react';
import { db } from '../firebase';
import type { Booking, ServiceStatus, UserProfile } from '../types';
import {
  CLOSED_SERVICE_STATUSES,
  bookingTimeValue,
  sendBookingNotification,
  sortBookingsNewestFirst,
  subscribeToProviderBookings,
  transitionBooking,
  type BookingAction,
} from '../services/bookingService';

const statusLabels: Record<ServiceStatus, string> = {
  solicitado: 'Nuevo pedido',
  aceptado: 'Aceptado',
  en_camino: 'En camino',
  en_curso: 'En curso',
  pendiente_confirmacion_cliente: 'Esperando confirmación del cliente',
  pendiente_pago: 'Esperando pago',
  pago_informado: 'Cliente informó el pago',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export default function ProviderDashboard({ providerId }: { providerId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const profileRef = doc(db, 'profiles', providerId);
    const unsubProfile = onSnapshot(profileRef, (profileDoc) => {
      if (profileDoc.exists()) setProfile(profileDoc.data() as UserProfile);
    });

    const unsubBookings = subscribeToProviderBookings(providerId, setBookings);

    return () => {
      unsubProfile();
      unsubBookings();
    };
  }, [providerId]);

  const openBookings = useMemo(() => {
    return sortBookingsNewestFirst(bookings).filter(
      (booking) => !CLOSED_SERVICE_STATUSES.has(booking.estado_servicio)
    );
  }, [bookings]);

  useEffect(() => {
    const shouldTrack = Boolean(profile?.disponible) || openBookings.length > 0;

    if (!shouldTrack) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      return;
    }

    if (watchIdRef.current === null && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = Number(position.coords.latitude);
          const lng = Number(position.coords.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return;

          setLocationError(null);
          try {
            await updateDoc(doc(db, 'profiles', providerId), { lat, lng, latitude: lat, longitude: lng });
            await setDoc(
              doc(db, 'profiles_providers', providerId),
              {
                uid: providerId,
                nombre: profile?.nombre || 'Proveedor UGO',
                role: 'proveedor',
                disponible: Boolean(profile?.disponible),
                lat,
                lng,
                latitude: lat,
                longitude: lng,
              },
              { merge: true }
            );
          } catch (error) {
            console.error('Failed to update provider location', error);
            setLocationError('No se pudo sincronizar tu ubicación con el radar.');
          }
        },
        (error) => {
          console.error(error);
          setLocationError('UGO necesita permiso de ubicación para mostrarte en el radar.');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [profile?.disponible, profile?.nombre, openBookings.length, providerId]);

  const toggleAvailability = async () => {
    if (!profile) return;
    const disponible = !profile.disponible;

    await updateDoc(doc(db, 'profiles', providerId), { disponible });
    await setDoc(
      doc(db, 'profiles_providers', providerId),
      {
        uid: providerId,
        nombre: profile.nombre || 'Proveedor UGO',
        role: 'proveedor',
        disponible,
      },
      { merge: true }
    );
  };

  const doAction = async (
    booking: Booking,
    action: BookingAction,
    title: string,
    message: string,
    type: 'service' | 'payment' = 'service'
  ) => {
    if (busyBookingId) return;
    setBusyBookingId(booking.id);

    try {
      await transitionBooking(booking.id, action, providerId);
      await sendBookingNotification(booking, providerId, booking.clienteId, title, message, type);
    } catch (error) {
      console.error('Error actualizando el pedido:', error);
    } finally {
      setBusyBookingId(null);
    }
  };

  if (!profile) {
    return (
      <div className="rounded-3xl border border-white/10 bg-quantum-card p-6 text-white/60">
        Cargando perfil del proveedor…
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">Modo proveedor</p>
          <h2 className="mt-1 text-2xl font-bold">{profile.nombre || 'Panel del proveedor'}</h2>
          <p className="mt-1 text-sm text-white/45">
            Podés aceptar nuevos pedidos aunque ya tengas otro trabajo en curso.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAvailability}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            profile.disponible ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
          }`}
        >
          {profile.disponible ? 'ONLINE' : 'OFFLINE'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <Briefcase className="mb-3 text-quantum-cyan" size={20} />
          <p className="text-xs text-white/45">Pedidos abiertos</p>
          <p className="mt-1 text-3xl font-bold">{openBookings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <MapPin className="mb-3 text-quantum-cyan" size={20} />
          <p className="text-xs text-white/45">Karma</p>
          <p className="mt-1 text-3xl font-bold">{profile.karma ?? 100}</p>
        </div>
      </div>

      {locationError && (
        <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-200">{locationError}</p>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock size={18} className="text-quantum-cyan" />
          <h3 className="font-semibold">Pedidos y servicios</h3>
        </div>

        {openBookings.length > 0 ? (
          <div className="space-y-3">
            {openBookings.map((booking) => {
              const busy = busyBookingId === booking.id;
              return (
                <div key={booking.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {booking.servicio || booking.categoria || 'Servicio UGO'}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {booking.clienteNombre || 'Cliente UGO'} · R$ {(booking.monto || 0).toFixed(2)}
                      </p>
                      {booking.scheduledFor && (
                        <p className="mt-1 text-[11px] font-medium text-amber-200/80">
                          Agendado: {new Intl.DateTimeFormat('es', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(bookingTimeValue(booking.scheduledFor)))}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-quantum-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-quantum-cyan">
                      {statusLabels[booking.estado_servicio]}
                    </span>
                  </div>

                  <div className="mt-4">
                    {booking.estado_servicio === 'solicitado' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          doAction(
                            booking,
                            'accept',
                            'Pedido aceptado',
                            `${profile.nombre || 'Tu profesional'} aceptó tu pedido.`
                          )
                        }
                        className="w-full rounded-xl bg-quantum-cyan px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        Aceptar pedido
                      </button>
                    )}

                    {booking.estado_servicio === 'aceptado' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            doAction(
                              booking,
                              'en_route',
                              'Profesional en camino',
                              `${profile.nombre || 'Tu profesional'} está en camino.`
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold disabled:opacity-50"
                        >
                          <Navigation size={16} /> En camino
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            doAction(
                              booking,
                              'start',
                              'Trabajo iniciado',
                              'El profesional inició el trabajo.'
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-bold text-black disabled:opacity-50"
                        >
                          <Play size={16} /> Iniciar
                        </button>
                      </div>
                    )}

                    {booking.estado_servicio === 'en_camino' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          doAction(
                            booking,
                            'start',
                            'Trabajo iniciado',
                            'El profesional llegó e inició el trabajo.'
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        <Play size={17} /> Iniciar trabajo
                      </button>
                    )}

                    {booking.estado_servicio === 'en_curso' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          doAction(
                            booking,
                            'provider_finish',
                            'Trabajo terminado',
                            'El profesional indicó que terminó. Revisá el trabajo y confirmalo antes de pagar.'
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-quantum-cyan px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        <CheckCircle2 size={17} /> Finalizar trabajo
                      </button>
                    )}

                    {booking.estado_servicio === 'pendiente_confirmacion_cliente' && (
                      <p className="rounded-xl bg-white/5 p-3 text-xs text-white/55">
                        Esperando que el cliente confirme que el trabajo quedó terminado.
                      </p>
                    )}

                    {booking.estado_servicio === 'pendiente_pago' && (
                      <p className="rounded-xl bg-white/5 p-3 text-xs text-white/55">
                        Trabajo confirmado. Esperando que el cliente pague R$ {(booking.monto || 0).toFixed(2)}.
                      </p>
                    )}

                    {booking.estado_servicio === 'pago_informado' && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                        <div className="mb-3 flex items-start gap-2">
                          <ReceiptText className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                          <p className="text-xs leading-relaxed text-white/70">
                            El cliente informó que pagó R$ {(booking.monto || 0).toFixed(2)}.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            doAction(
                              booking,
                              'provider_confirm_payment',
                              'Pago confirmado',
                              'El proveedor confirmó el cobro. El servicio quedó cerrado.',
                              'payment'
                            )
                          }
                          className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                        >
                          Confirmar pago y cerrar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">
            No hay pedidos abiertos. Podés seguir ONLINE para recibir nuevos trabajos.
          </div>
        )}
      </div>
    </div>
  );
}
