import { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: () => void;
}

export default function RoleSelection({ userId, onRoleSelected }: RoleSelectionProps) {
  const [role, setRole] = useState<'cliente' | 'proveedor' | 'administrador'>('cliente');

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        role: role // Use 'role' to match UserProfile type definitions
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
          <button className={`p-4 rounded ${role === 'cliente' ? 'bg-quantum-cyan text-black' : 'bg-gray-700 text-white'}`} onClick={() => setRole('cliente')}>Cliente</button>
          <button className={`p-4 rounded ${role === 'proveedor' ? 'bg-quantum-cyan text-black' : 'bg-gray-700 text-white'}`} onClick={() => setRole('proveedor')}>Proveedor</button>
          <button className={`p-4 rounded ${role === 'administrador' ? 'bg-quantum-cyan text-black' : 'bg-gray-700 text-white'}`} onClick={() => setRole('administrador')}>Administrador</button>
        </div>
        <button className="mt-8 bg-quantum-cyan text-black px-8 py-2 rounded font-bold w-full" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
}
