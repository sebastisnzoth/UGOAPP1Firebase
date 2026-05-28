import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type UserRole = 'cliente' | 'proveedor' | 'administrador';

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data().role as UserRole;
    }
  } catch (error) {
    console.error("Error obteniendo rol del usuario:", error);
  }
  return null;
}

// Validación de Soberano para Funciones Críticas
export function checkAdminAccess(userEmail: string | null | undefined): boolean {
    const ADMIN_EMAIL = "sebastianzoth@gmail.com";
    if (userEmail === ADMIN_EMAIL) {
        return true; // Acceso total garantizado
    } else {
        throw new Error("Acceso denegado: Solo el Soberano tiene privilegios totales.");
    }
}

export function routeUser(role: UserRole) {
  switch (role) {
    case 'administrador':
      window.location.href = '#/admin-touchboard';
      break;
    case 'proveedor':
      window.location.href = '#/prestador-dashboard';
      break;
    case 'cliente':
      window.location.href = '#/';
      break;
    default:
      console.warn("Rol no reconocido, redirigiendo a home");
      window.location.href = '#/';
  }
}
