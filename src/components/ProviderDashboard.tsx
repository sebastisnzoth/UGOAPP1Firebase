import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Briefcase, CalendarClock, MapPin } from 'lucide-react';
import { db } from '../firebase';
import type { UserProfile } from '../types';

export default function ProviderDashboard({ providerId }: { providerId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const profileRef = doc(db, 'profiles', providerId);
    const unsubProfile = onSnapshot(profileRef, (profileDoc) => {
      if (profileDoc.exists()) setProfile(profileDoc.data() as UserProfile);
    });

    const bookingsQuery = query(collection(db, 'bookings'), where('proveedorId', '==', providerId));
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() })));
    });

    return () => {
      unsubProfile();
      unsubBookings();
    };
  }, [providerId]);

  const openBookings = useMemo(() => {
    const closedStates = new Set(['finalizado', 'completado', 'cancelado', 'cancelled', 'completed']);
    return bookings.filter((booking) => {
      const state = String(booking.estado_servicio || booking.estado || booking.status || '').toLowerCase();
      return !closedStates.has(state);
    });
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

  if (!profile) {
    return <div className="rounded-3xl border border-white/10 bg-quantum-card p-6 text-white/60">Cargando perfil del proveedor…</div>;
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">Modo proveedor</p>
          <h2 className="mt-1 text-2xl font-bold">{profile.nombre || 'Panel del proveedor'}</h2>
          <p className="mt-1 text-sm text-white/45">Tu disponibilidad no se bloquea por tener un trabajo en curso.</p>
        </div>
        <button
          type="button"
          onClick={toggleAvailability}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${profile.disponible ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'}`}
        >
          {profile.disponible ? 'ONLINE' : 'OFFLINE'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <Briefcase className="mb-3 text-quantum-cyan" size={20} />
          <p className="text-xs text-white/45">Trabajos abiertos</p>
          <p className="mt-1 text-3xl font-bold">{openBookings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <MapPin className="mb-3 text-quantum-cyan" size={20} />
          <p className="text-xs text-white/45">Karma</p>
          <p className="mt-1 text-3xl font-bold">{profile.karma ?? 100}</p>
        </div>
      </div>

      {locationError && <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-200">{locationError}</p>}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock size={18} className="text-quantum-cyan" />
          <h3 className="font-semibold">Pedidos y servicios</h3>
        </div>

        {openBookings.length > 0 ? (
          <div className="space-y-2">
            {openBookings.map((booking) => {
              const state = booking.estado_servicio || booking.estado || booking.status || 'pendiente';
              return (
                <div key={booking.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{booking.servicio || booking.detalles || 'Servicio UGO'}</p>
                      <p className="mt-1 text-xs text-white/40">#{booking.id.slice(0, 8)}</p>
                    </div>
                    <span className="rounded-full bg-quantum-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-quantum-cyan">
                      {String(state).replaceAll('_', ' ')}
                    </span>
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
