import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedFictitiousProviders() {
  const providers = [
    {
      uid: 'mock-1',
      nombre: 'Carlos Rivera',
      email: 'carlos@pseudoprovider.com',
      role: 'proveedor',
      estado_online: true,
      bio: 'Especialista en instalaciones eléctricas y domótica avanzada.',
      categoria: 'Electricidad',
      especialidade: 'Domótica',
      latitude: -34.6010,
      longitude: -58.3840,
      rating: 4.8,
      karma: 95,
      tarifa: 25,
      foto: 'https://i.pravatar.cc/150?u=mock1'
    },
    {
      uid: 'mock-2',
      nombre: 'Sofía Martínez',
      email: 'sofia@pseudoprovider.com',
      role: 'proveedor',
      estado_online: true,
      bio: 'Plomería general e instalaciones sanitarias certificadas.',
      categoria: 'Plomería',
      especialidade: 'Emergencias',
      latitude: -34.6055,
      longitude: -58.3795,
      rating: 4.9,
      karma: 98,
      tarifa: 30,
      foto: 'https://i.pravatar.cc/150?u=mock2'
    },
    {
      uid: 'mock-3',
      nombre: 'Leonardo Silva',
      email: 'leo@pseudoprovider.com',
      role: 'proveedor',
      estado_online: false,
      bio: 'Carpintero con detalles artesanales y muebles a medida.',
      categoria: 'Carpintería',
      especialidade: 'Restauración',
      latitude: -34.5990,
      longitude: -58.3880,
      rating: 4.6,
      karma: 85,
      tarifa: 40,
      foto: 'https://i.pravatar.cc/150?u=mock3'
    },
    {
      uid: 'mock-4',
      nombre: 'Elena Castro',
      email: 'elena@pseudoprovider.com',
      role: 'proveedor',
      estado_online: true,
      bio: 'Reparación de electrodomésticos y línea blanca.',
      categoria: 'Técnico',
      especialidade: 'Línea Blanca',
      latitude: -34.6105,
      longitude: -58.3750,
      rating: 4.7,
      karma: 90,
      tarifa: 35,
      foto: 'https://i.pravatar.cc/150?u=mock4'
    },
    {
      uid: 'mock-5',
      nombre: 'Javier Núñez',
      email: 'javier@pseudoprovider.com',
      role: 'proveedor',
      estado_online: true,
      bio: 'Generador de videos musicales a partir de audio (Productor Visual).',
      categoria: 'Audiovisual',
      especialidade: 'Video Musical',
      latitude: -34.6025,
      longitude: -58.3800,
      rating: 5.0,
      karma: 100,
      tarifa: 55,
      foto: 'https://i.pravatar.cc/150?u=mock5'
    }
  ];

  try {
    const batch = writeBatch(db);
    const profilesRef = collection(db, 'profiles');
    
    providers.forEach((prov) => {
      const newDocRef = doc(profilesRef, prov.uid);
      batch.set(newDocRef, prov, { merge: true });
    });

    await batch.commit();
    return { success: true, count: providers.length };
  } catch (error) {
    console.error("Error seeding providers:", error);
    return { success: false, error };
  }
}
