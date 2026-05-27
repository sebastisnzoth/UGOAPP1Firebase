import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Hugo usa esta función para encontrar al proveedor más cercano
export async function buscarProveedoresCercanos(categoria: string) {
  const q = query(
    collection(db, "profiles_providers"), 
    where("categoria", "==", categoria), 
    where("disponible", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Hugo usa esta función para actualizar el Karma o suspender un proveedor
export async function actualizarEstadoProveedor(providerId: string, karmaDelta: number) {
  const provRef = doc(db, "profiles", providerId);
  const provSnap = await getDoc(provRef);
  
  if (provSnap.exists()) {
    const currentData = provSnap.data();
    const nuevoKarma = (currentData.karma || 0) + karmaDelta;
    await updateDoc(provRef, {
      karma: nuevoKarma,
      estado: nuevoKarma < 40 ? 'suspendido' : 'activo'
    });
  }
}
