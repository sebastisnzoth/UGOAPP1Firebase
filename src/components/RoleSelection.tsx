import { useState } from 'react';
import { db } from '../firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserRole } from '../lib/auth';

interface RoleSelectionProps {
  userId: string;
  displayName?: string | null;
  onRoleSelected: (role: UserRole) => void;
}

export default function RoleSelection({ userId, displayName, onRoleSelected }: RoleSelectionProps) {
  const [role, setRole] = useState<Exclude<UserRole, 'administrador'>>('cliente');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const userRef = doc(db, 'profiles', userId);
      await setDoc(
        userRef,
        {
          uid: userId,
          nombre: displayName || 'Usuário UGO',
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onRoleSelected(role);
    } catch (saveError) {
      console.error('Error updating role:', saveError);
      setError('No pudimos guardar tu perfil. Revisá la conexión e intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-xl">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-quantum-card p-6 text-white shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">Bienvenido a UGO</p>
        <h2 className="text-2xl font-bold">¿Cómo vas a usar UGO?</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Elegí tu modo inicial. El acceso administrativo se gestiona de forma segura y no se habilita desde esta pantalla.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            className={`rounded-2xl border p-4 text-left transition-all ${role === 'cliente' ? 'border-quantum-cyan bg-quantum-cyan/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            onClick={() => setRole('cliente')}
          >
            <span className="block font-bold">Necesito un servicio</span>
            <span className="mt-1 block text-xs text-white/55">Buscar, contratar y seguir profesionales.</span>
          </button>
          <button
            type="button"
            className={`rounded-2xl border p-4 text-left transition-all ${role === 'proveedor' ? 'border-quantum-cyan bg-quantum-cyan/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            onClick={() => setRole('proveedor')}
          >
            <span className="block font-bold">Quiero trabajar con UGO</span>
            <span className="mt-1 block text-xs text-white/55">Recibir pedidos, gestionar agenda y disponibilidad.</span>
          </button>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <button
          type="button"
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-quantum-cyan px-6 py-3 font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSave}
        >
          {saving ? 'Guardando…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
