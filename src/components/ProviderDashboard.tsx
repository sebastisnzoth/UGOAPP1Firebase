import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';

export default function ProviderDashboard({ providerId }: { providerId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch profile using providerId prop instead of auth.currentUser directly
    const profileRef = doc(db, 'profiles', providerId);
    const unsubProfile = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
    });

    // Fetch bookings using providerId prop
    const bookingsQuery = query(
      collection(db, 'bookings'), 
      where('proveedorId', '==', providerId), 
      where('estado_servicio', '==', 'activo')
    );
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingsList);
    });

    return () => {
      unsubProfile();
      unsubBookings();
    };
  }, [providerId]);

  const toggleAvailability = async () => {
    if (!profile) return;
    const newAvailability = !profile.disponible;
    
    // Update profiles
    const profileRef = doc(db, 'profiles', providerId);
    await updateDoc(profileRef, { disponible: newAvailability });
    
    // Also update profiles_providers radar collection
    const providerRef = doc(db, 'profiles_providers', providerId);
    await updateDoc(providerRef, { disponible: newAvailability });
  };


  if (!profile) return <div className="p-6">Cargando perfil...</div>;

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Panel del Proveedor</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Karma</p>
          <p className="text-3xl font-bold text-gray-900">{profile.karma}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="text-xl font-semibold text-gray-900">{profile.disponible ? 'Disponible' : 'No disponible'}</p>
          </div>
          <button 
            onClick={toggleAvailability}
            className={`w-12 h-6 rounded-full transition-colors duration-200 ${profile.disponible ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 transform ${profile.disponible ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">Servicios Activos</h3>
        {bookings.length > 0 ? (
          <ul className="space-y-2">
            {bookings.map((b: any) => (
              <li key={b.id} className="p-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-700">
                {b.servicio || 'Servicio sin nombre'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No hay servicios actuales.</p>
        )}
      </div>
    </div>
  );
}
