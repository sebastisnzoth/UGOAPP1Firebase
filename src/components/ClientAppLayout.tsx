import React, { useState } from 'react';
import QuantumMap from './QuantumMap';
import DashboardNavigation from './DashboardNavigation';
import HugoOrb from './HugoOrb';
import ConfirmationDialog from './ConfirmationDialog';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MapPin } from 'lucide-react';

interface ClientAppLayoutProps {
  user: any;
  state: any;
  orbState: "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";
  isLiveActive: boolean;
  liveTranscript: string | null;
  handleOrbClick: () => void;
  onRequestLocation: () => void;
  isLocationLoading: boolean;
  providers: any[];
  onHire: (id: string) => void;
  onSelectProvider: (p: any) => void;
}

export default function ClientAppLayout({ 
  user, state, orbState, isLiveActive, liveTranscript, handleOrbClick, onRequestLocation, isLocationLoading, providers, onHire, onSelectProvider 
}: ClientAppLayoutProps) {
  const [hireConfirm, setHireConfirm] = useState(false);
  const selectedProvider = providers.find(p => p.id === state.datos?.proveedor_seleccionado);

  const initiateHire = () => {
    setHireConfirm(true);
  };

  const confirmHire = () => {
    if (selectedProvider) {
      onHire(selectedProvider.id);
      setHireConfirm(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-screen bg-black overflow-hidden">
      <ConfirmationDialog 
        isOpen={hireConfirm}
        providerName={selectedProvider?.nombre || 'Provedor'}
        cost={selectedProvider?.precio || 0}
        onConfirm={confirmHire}
        onCancel={() => setHireConfirm(false)}
      />
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <QuantumMap 
          center={{ lat: -34.6037, lng: -58.3816 }} // Default center
          providers={providers}
          activeProviderId={state.datos?.proveedor_seleccionado}
          onHire={(name) => initiateHire()}
          onSelectProvider={onSelectProvider}
        />
      </div>

      {/* Location Request Button */}
      <div className="absolute top-6 right-6 z-40">
        <button 
          onClick={onRequestLocation}
          disabled={isLocationLoading}
          className={cn(
            "p-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full text-white transition-all",
            isLocationLoading ? "animate-pulse border-quantum-cyan" : "hover:bg-quantum-cyan hover:text-black"
          )}
          title="Solicitar ubicación real"
        >
          <MapPin size={20} className={isLocationLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Provider Card Overlay - Left Side (Based on image) */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-6 left-6 w-80 z-40"
          >
            <div className="p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl text-white">
                <h2 className="text-lg font-bold">{selectedProvider.nombre}</h2>
                <p className="text-sm text-white/60 mb-2">{selectedProvider.categoria}</p>
                <p className="text-sm text-white/80 mb-4">{selectedProvider.bio_memoria}</p>
                <button 
                    onClick={initiateHire}
                    className="w-full py-2 bg-quantum-cyan text-black font-bold rounded-xl text-sm"
                >
                    Contratar (R$ {selectedProvider.precio}/h)
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Interface - Center Bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
        <div className="pointer-events-auto">
          <HugoOrb 
            state={isLiveActive ? 'LISTENING' : orbState} 
            onClick={handleOrbClick}
            className="w-20 h-20"
          />
        </div>
        
        {/* Hugo Message Bubble */}
        <div className="mt-4 px-6 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-sm text-center shadow-2xl pointer-events-auto">
          <p className="text-sm font-light text-white/90">
            {isLiveActive ? liveTranscript : (state.hugo_mensaje || "Olá! Eu sou Hugo, seu Orbe inteligente. Como posso ajudar hoje?")}
          </p>
        </div>
        
        {/* Voice Trigger (based on image) */}
        <div className="mt-4 px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 rounded-full flex items-center gap-2">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Toca para hablar</span>
        </div>
      </div>
    </div>
  );
}
