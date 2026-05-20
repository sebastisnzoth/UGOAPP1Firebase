import { motion, AnimatePresence } from 'motion/react';
import { X, User, Save, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfileData {
  nombre: string;
  contacto_preferido?: string;
  email: string;
}

export default function UserProfile({ isOpen, onClose, userId }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData>({ nombre: '', email: '', contacto_preferido: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'profiles', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfileData);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        nombre: profile.nombre,
        contacto_preferido: profile.contacto_preferido
      });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-quantum-card/95 backdrop-blur-2xl border-l border-white/10 z-50 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="text-quantum-cyan" size={24} />
                Meu Perfil
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 text-white/70 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {loading ? (
                <div className="text-white/50 text-center pt-10">Carregando perfil...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-widest mb-2 block">Nome Completo</label>
                    <input 
                      type="text"
                      disabled={!isEditing}
                      value={profile.nombre}
                      onChange={(e) => setProfile({...profile, nombre: e.target.value})}
                      className={cn("w-full bg-black/20 border rounded-xl p-3 text-white transition-colors", isEditing ? "border-quantum-cyan focus:border-quantum-cyan outline-none" : "border-transparent")}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-widest mb-2 block">Método de Contato Preferido</label>
                    <input 
                      type="text"
                      disabled={!isEditing}
                      placeholder="Ex: WhatsApp ou Email"
                      value={profile.contacto_preferido || ''}
                      onChange={(e) => setProfile({...profile, contacto_preferido: e.target.value})}
                      className={cn("w-full bg-black/20 border rounded-xl p-3 text-white transition-colors", isEditing ? "border-quantum-cyan focus:border-quantum-cyan outline-none" : "border-transparent")}
                    />
                  </div>
                  
                  <div className="pt-6">
                    {isEditing ? (
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-quantum-cyan text-black py-3 rounded-xl font-bold hover:bg-white transition-all"
                      >
                        {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                      >
                        <Edit2 size={18} /> Editar Perfil
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
