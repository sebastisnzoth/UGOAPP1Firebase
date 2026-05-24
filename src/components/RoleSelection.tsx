import { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: () => void;
}

export default function RoleSelection({ userId, onRoleSelected }: RoleSelectionProps) {
  const [role, setRole] = useState<'cliente' | 'prestador' | 'soberano'>('cliente');

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        tipo: role, // Keep 'tipo' consistent with DB
        rol: role // Update 'rol' for internal consistency
      });
      onRoleSelected();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-4">Selecciona tu Rol</h2>
        <div className="flex flex-col gap-4">
          <button className="bg-gray-700 p-4 rounded" onClick={() => setRole('cliente')}>Cliente</button>
          <button className="bg-gray-700 p-4 rounded" onClick={() => setRole('prestador')}>Proveedor</button>
          <button className="bg-gray-700 p-4 rounded" onClick={() => setRole('soberano')}>Administrador</button>
        </div>
        <button className="mt-8 bg-quantum-cyan text-black px-8 py-2 rounded font-bold w-full" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
}
