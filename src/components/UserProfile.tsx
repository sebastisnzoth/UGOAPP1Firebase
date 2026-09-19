import { useEffect, useState } from 'react';
import { Save, User, X } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfileData {
  uid?: string;
  nombre: string;
  contacto_preferido?: string;
  email?: string;
  role?: 'cliente' | 'proveedor' | 'administrador';
  categoria?: string;
  especialidade?: string;
  tarifa?: number;
  bio?: string;
  forma_pago?: 'efectivo' | 'mercado_pago';
  disponible?: boolean;
  rating?: number;
  karma?: number;
  foto?: string;
}

export default function UserProfile({ isOpen, onClose, userId }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData>({
    nombre: '',
    contacto_preferido: '',
    forma_pago: 'efectivo',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'profiles', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfileData;
          setProfile({
            ...data,
            forma_pago: data.forma_pago || 'efectivo',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const userRef = doc(db, 'profiles', userId);
      const publicFields = {
        nombre: profile.nombre.trim(),
        contacto_preferido: profile.contacto_preferido?.trim() || '',
        forma_pago: profile.forma_pago || 'efectivo',
        ...(profile.role === 'proveedor'
          ? {
              categoria: profile.categoria?.trim() || '',
              especialidade: profile.especialidade?.trim() || '',
              tarifa: Number(profile.tarifa || 0),
              precio: Number(profile.tarifa || 0),
              bio: profile.bio?.trim() || '',
            }
          : {}),
      };

      await updateDoc(userRef, publicFields);

      if (profile.role === 'proveedor') {
        await setDoc(
          doc(db, 'profiles_providers', userId),
          {
            uid: userId,
            nombre: profile.nombre.trim(),
            role: 'proveedor',
            categoria: profile.categoria?.trim() || '',
            especialidade: profile.especialidade?.trim() || '',
            tarifa: Number(profile.tarifa || 0),
            precio: Number(profile.tarifa || 0),
            bio_memoria: profile.bio?.trim() || '',
            foto: profile.foto || '',
            disponible: Boolean(profile.disponible),
            forma_pago: profile.forma_pago || 'efectivo',
          },
          { merge: true }
        );
      }

      setSaved(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profiles');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-full rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">Perfil UGO</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <User size={22} className="text-quantum-cyan" /> Mi perfil
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/5 p-2 text-white/55 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar perfil"
        >
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-white/45">Cargando perfil…</p>
      ) : (
        <div className="mt-6 space-y-4">
          <Field
            label="Nombre"
            value={profile.nombre}
            onChange={(value) => setProfile((current) => ({ ...current, nombre: value }))}
          />

          <Field
            label="Contacto preferido"
            value={profile.contacto_preferido || ''}
            placeholder="WhatsApp, teléfono o email"
            onChange={(value) => setProfile((current) => ({ ...current, contacto_preferido: value }))}
          />

          {profile.role === 'proveedor' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Categoría"
                  value={profile.categoria || ''}
                  placeholder="Electricidad"
                  onChange={(value) => setProfile((current) => ({ ...current, categoria: value }))}
                />
                <Field
                  label="Especialidad"
                  value={profile.especialidade || ''}
                  placeholder="Instalaciones"
                  onChange={(value) => setProfile((current) => ({ ...current, especialidade: value }))}
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Tarifa por hora
                </span>
                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4">
                  <span className="text-sm font-bold text-quantum-cyan">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profile.tarifa ?? ''}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        tarifa: Number(event.target.value),
                      }))
                    }
                    className="w-full bg-transparent px-3 py-3 text-white outline-none"
                    placeholder="0"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Descripción profesional
                </span>
                <textarea
                  value={profile.bio || ''}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, bio: event.target.value }))
                  }
                  className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none focus:border-quantum-cyan/60"
                  placeholder="Contá brevemente qué trabajos realizás."
                />
              </label>
            </>
          )}

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
              Forma de pago predeterminada
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile((current) => ({ ...current, forma_pago: 'efectivo' }))}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  profile.forma_pago !== 'mercado_pago'
                    ? 'border-quantum-cyan bg-quantum-cyan/15 text-quantum-cyan'
                    : 'border-white/10 bg-white/5 text-white/55'
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setProfile((current) => ({ ...current, forma_pago: 'mercado_pago' }))}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  profile.forma_pago === 'mercado_pago'
                    ? 'border-quantum-cyan bg-quantum-cyan/15 text-quantum-cyan'
                    : 'border-white/10 bg-white/5 text-white/55'
                }`}
              >
                Mercado Pago
              </button>
            </div>
            <p className="mt-2 text-xs text-white/35">
              Efectivo queda seleccionado por defecto y nunca bloquea la solicitud de un servicio.
            </p>
          </div>

          {saved && (
            <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-200">
              Perfil actualizado.
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !profile.nombre.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-quantum-cyan px-4 py-3 font-bold text-black disabled:opacity-40"
          >
            <Save size={17} />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-quantum-cyan/60"
      />
    </label>
  );
}
