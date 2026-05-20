import { motion, AnimatePresence } from 'motion/react';
import { Power, Shield, MapPin, Star, Clock, ExternalLink, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import MediaUpload from './MediaUpload';

interface Provider {
  id: string;
  nombre?: string;
  primeiro_nome?: string;
  sobrenome?: string;
  rating?: number;
  precio?: number;
  tarifa_personalizada?: number;
  foto?: string;
  categoria?: string;
}

interface WelcomeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (category: string) => void;
  onMediaUpload: (file: File) => void;
  onActivateHugo: () => void;
  isHugoActivated: boolean;
  providers: Provider[];
  escrowStatus: { total: number; state: string };
  activeService?: { status: string; eta: string; code: string };
  groundingLinks?: { title: string; uri: string }[];
  userName?: string;
}

export default function WelcomeDrawer({
  isOpen,
  onSearch,
  onMediaUpload,
  onActivateHugo,
  isHugoActivated,
  providers,
  escrowStatus,
  activeService,
  groundingLinks,
  userName
}: WelcomeDrawerProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: isOpen ? 0 : "85%" }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="absolute bottom-0 w-full bg-quantum-card/95 backdrop-blur-md border-t-2 border-quantum-cyan rounded-t-quantum-lg p-6 z-20 shadow-[0_-10px_40px_rgba(0,242,255,0.1)] overflow-y-auto max-h-[90vh]"
    >
      {/* Handle */}
      <div className="w-10 h-1.5 bg-white/10 mx-auto mb-6 rounded-full cursor-pointer" />

      <div className="max-w-2xl mx-auto pb-12">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Olá, {userName || 'Usuário'}!</h2>
            <p className="text-white/50">Onde a U.go pode te ajudar hoje?</p>
          </div>
          <button 
            onClick={onActivateHugo}
            disabled={isHugoActivated}
            className={cn(
              "px-4 py-2 border rounded-full text-xs font-bold transition-all flex items-center gap-2",
              isHugoActivated 
                ? "bg-quantum-cyan text-black border-quantum-cyan shadow-[0_0_15px_rgba(0,242,255,0.5)]" 
                : "bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/50 hover:bg-quantum-cyan hover:text-black"
            )}
          >
            <Power size={14} className={cn(isHugoActivated && "animate-pulse")} />
            {isHugoActivated ? 'Hugo Ativo' : 'Ativar Hugo'}
          </button>
        </div>

        {/* Categories */}
        {!activeService && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {['Eletricista', 'Limpeza', 'Encanador', 'Reparos'].map((cat) => (
              <button
                key={cat}
                onClick={() => onSearch(cat)}
                className="min-w-[120px] p-4 bg-white/5 border border-white/10 rounded-quantum hover:border-quantum-cyan hover:bg-quantum-cyan/5 transition-all group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {cat === 'Eletricista' && '🔌'}
                  {cat === 'Limpeza' && '🧹'}
                  {cat === 'Encanador' && '🚰'}
                  {cat === 'Reparos' && '🛠️'}
                </div>
                <span className="text-sm font-medium">{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Media Analysis Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={14} className="text-quantum-cyan" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Análise Visual Hugo</span>
          </div>
          <MediaUpload onUpload={onMediaUpload} />
        </div>

        {/* Grounding Insights */}
        {groundingLinks && groundingLinks.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink size={14} className="text-quantum-cyan" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fontes e Referências</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {groundingLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/70 hover:bg-quantum-cyan/10 hover:border-quantum-cyan transition-all flex items-center gap-2"
                >
                  {link.title}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Active Service Status */}
        {activeService && (
          <div className="mt-8 p-4 bg-quantum-cyan/10 border border-quantum-cyan rounded-quantum">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-quantum-cyan uppercase tracking-wider">Serviço Ativo</span>
              <span className="text-xs bg-quantum-cyan text-black px-2 py-0.5 rounded-full font-bold">
                {activeService.status}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/80">
                <Clock size={16} className="text-quantum-cyan" />
                <span className="text-sm">Chegada em: <strong>{activeService.eta}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Shield size={16} className="text-quantum-cyan" />
                <span className="text-sm">Código: <strong>{activeService.code}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Providers List */}
        <AnimatePresence>
          {providers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 space-y-4"
            >
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Profissionais Disponíveis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((p) => (
                  <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-quantum flex items-center gap-4">
                    <img src={p.foto || `https://picsum.photos/seed/${p.id}/100/100`} alt={p.nombre || p.primeiro_nome} className="w-12 h-12 rounded-full border border-quantum-cyan/30" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{p.nombre || `${p.primeiro_nome} ${p.sobrenome}`}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/50">
                        <span className="flex items-center gap-1"><Star size={10} className="fill-quantum-cyan text-quantum-cyan" /> {p.rating || 5.0}</span>
                        <span>•</span>
                        <span className="font-bold text-quantum-cyan">R$ {p.precio || p.tarifa_personalizada || 0}/h</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-quantum-cyan text-black text-xs font-bold rounded-full hover:bg-white transition-colors">
                      Reservar
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Escrow Status */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-quantum">
          <div className="flex items-center gap-2 mb-2">
            <Power size={14} className="text-quantum-cyan" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status da Bóveda Escrow</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Estado: <strong className={cn(escrowStatus.state === 'ASEGURADA' ? 'text-quantum-cyan' : 'text-white/50')}>{escrowStatus.state}</strong></span>
            <span className="text-xl font-mono font-bold text-quantum-cyan">R$ {escrowStatus.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
