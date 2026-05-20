import React from 'react';
import QuantumMap from './QuantumMap';
import DashboardNavigation from './DashboardNavigation';
import HugoOrb from './HugoOrb';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ClientAppLayoutProps {
  user: any;
  state: any;
  orbState: string;
  isLiveActive: boolean;
  liveTranscript: string | null;
  handleOrbClick: () => void;
  providers: any[];
  onHire: (id: string) => void;
  onSelectProvider: (p: any) => void;
}

export default function ClientAppLayout({ 
  user, state, orbState, isLiveActive, liveTranscript, handleOrbClick, providers, onHire, onSelectProvider 
}: ClientAppLayoutProps) {
  return (
    <div className="relative h-[100dvh] w-screen bg-black overflow-hidden">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <QuantumMap 
          center={[-34.6037, -58.3816]} // Default center
          providers={providers}
          activeProviderId={state.datos?.proveedor_seleccionado}
          onHire={onHire}
          onSelectProvider={onSelectProvider}
        />
      </div>

      {/* Navigation - Right Side (Based on image) */}
      <div className="absolute top-6 right-6 z-40">
        <DashboardNavigation activeView="AI" onViewChange={() => {}} userId="temp" />
      </div>

      {/* Provider Card Overlay - Left Side (Based on image) */}
      <AnimatePresence>
        {state.datos?.proveedor_seleccionado && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-6 left-6 w-80 z-40"
          >
            {/* Implement Provider Profile Card here based on the image description */}
            <div className="p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl text-white">
                {/* Simplified Card Content */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Interface - Center Bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
        <div className="pointer-events-auto">
          <HugoOrb 
            state={isLiveActive ? 'LISTENING' : (orbState as any)} 
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
