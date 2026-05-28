import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * Lógica de Asignación Cuántica:
 * Hugo calcula el mejor prestador basándose en cercanía y reputación.
 */
export async function assignTaskToBestProvider(contractId: string, location: { lat: number, lng: number }) {
  console.log(`> Hugo: Buscando prestador óptimo para el contrato ${contractId}...`);

  // 1. Buscar proveedores disponibles (simplificado para MVP)
  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('role', '==', 'proveedor'), where('disponible', '==', true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.error('> Hugo: No hay proveedores disponibles en este momento.');
    return;
  }

  // 2. Lógica simplificada de "mejor opción" (será enriquecida con cálculo de distancia real)
  const bestProvider = snapshot.docs[0]; // Temporal: primer disponible

  // 3. Asignar contrato
  await updateDoc(doc(db, 'contratos', contractId), {
    proveedor_id: bestProvider.id,
    estado: 'en_negociacion',
    asignado_en: new Date()
  });

  console.log(`> Hugo: Asignado contrato ${contractId} a ${bestProvider.id}`);
  return bestProvider.id;
}
