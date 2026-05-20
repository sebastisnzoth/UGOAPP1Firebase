import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface Provider {
  id: string;
  nombre?: string;
  primeiro_nome?: string;
  sobrenome?: string;
  rating?: number;
  precio?: number;
  tarifa?: number;
  tarifa_personalizada?: number;
  foto?: string;
  categoria?: string;
  especialidade?: string;
  bio_memoria?: string;
  estado_online?: boolean;
  status?: string;
}

interface ProviderDrawerProps {
  isOpen: boolean;
  providers: Provider[];
  activeProviderId?: string;
  onClose: () => void;
  onHire: (providerName: string) => void;
  onChat: (providerId: string) => void;
}

const getStatusDisplay = (provider: Provider) => {
  if (provider.status === 'OCUPADO') return { text: 'Ocupado', color: 'text-yellow-500', dot: 'bg-yellow-500' };
  if (provider.estado_online === false || provider.status === 'OFFLINE') return { text: 'Offline', color: 'text-white/40', dot: 'bg-red-500' };
  return { text: 'Disponível Agora', color: 'text-quantum-cyan', dot: 'bg-green-500' };
};

export default function ProviderDrawer({
  isOpen,
  providers,
  activeProviderId,
  onClose,
  onHire,
  onChat
}: ProviderDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 w-full bg-quantum-card/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div 
              className="w-12 h-1.5 bg-white/20 mx-auto mb-6 rounded-full cursor-pointer hover:bg-white/40 transition-colors" 
              onClick={onClose}
            />

            <div className="max-w-md mx-auto pb-8">
              <h2 className="text-xl font-bold text-white mb-6 text-center">
                Encontrei estes profissionais
              </h2>

              <div className="space-y-4">
                {providers.map((p) => {
                  const name = p.nombre || p.primeiro_nome || 'Profissional';
                  const price = p.precio || p.tarifa_personalizada || p.tarifa || 0;
                  const statusInfo = getStatusDisplay(p);
                  const isActive = p.id === activeProviderId;
                  
                  return (
                    <motion.div 
                      key={p.id} 
                      animate={isActive ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' } : { scale: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "p-4 border rounded-2xl flex items-center gap-4 transition-colors",
                        isActive ? "border-quantum-cyan shadow-[0_0_15px_rgba(0,242,255,0.2)]" : "border-white/10 hover:border-quantum-cyan/50"
                      )}
                    >
                      <div className={cn(
                        "relative w-14 h-14 rounded-full overflow-hidden border-2 shrink-0 transition-colors",
                        isActive ? "border-quantum-cyan" : "border-quantum-cyan/30"
                      )}>
                        {p.foto ? (
                          <img src={p.foto} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-quantum-cyan/20 flex items-center justify-center text-quantum-cyan font-bold text-xl">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-quantum-card", statusInfo.dot)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-white truncate">{name} {p.sobrenome || ''}</p>
                        </div>
                        <p className="text-xs text-white/60 truncate">{p.categoria || p.especialidade || 'Especialista'}</p>
                        
                        {p.bio_memoria && (
                          <p className="text-[10px] text-quantum-cyan/70 italic mt-1 line-clamp-1">"{p.bio_memoria}"</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", statusInfo.color)}>
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-3 text-xs">
                             <span className="flex items-center gap-1 text-white/80">
                               <Star size={12} className="fill-quantum-cyan text-quantum-cyan" /> 
                               {p.rating || 5.0}
                             </span>
                             <span className="text-white/30">•</span>
                             <span className="font-bold text-quantum-cyan">R$ {price}/h</span>
                          </div>
                          <a href={`/reviews/${p.id}`} className="text-[10px] text-white/40 hover:text-white underline">Reseñas</a>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            onHire(name);
                            onClose();
                          }}
                          className="px-4 py-2 bg-quantum-cyan text-black text-xs font-bold rounded-full hover:bg-white transition-colors shrink-0 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                        >
                          Contratar
                        </button>
                        <button 
                          className="px-3 py-2 bg-white/10 text-white text-xs font-bold rounded-full hover:bg-white/20 transition-colors shrink-0"
                          onClick={() => {
                            onChat(p.id);
                            onClose();
                          }}
                        >
                          Chat
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
