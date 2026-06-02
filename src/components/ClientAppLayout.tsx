import React, { useState, useMemo } from 'react';
import QuantumMap from './QuantumMap';
import DashboardNavigation from './DashboardNavigation';
import HugoOrb from './HugoOrb';
import ConfirmationDialog from './ConfirmationDialog';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MapPin, Map, Layers, Plus } from 'lucide-react';
import { useProviders } from '../contexts/ProvidersContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ClientAppLayoutProps {
  user: any;
  state: any;
  orbState: "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";
  isLiveActive: boolean;
  liveTranscript: string | null;
  liveError?: string | null;
  handleOrbClick: () => void;
  onRequestLocation: () => void;
  isLocationLoading: boolean;
  userLocation?: [number, number];
  onHire: (id: string) => void;
  onSelectProvider: (p: any) => void;
}

export default function ClientAppLayout({ 
  user, state, orbState, isLiveActive, liveTranscript, liveError, handleOrbClick, onRequestLocation, isLocationLoading, userLocation, onHire, onSelectProvider 
}: ClientAppLayoutProps) {
  const { providers } = useProviders();
  const [hireConfirm, setHireConfirm] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite'>('dark');
  const [isAddingMock, setIsAddingMock] = useState(false);
  
  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
    });
  }, [providers]);

  const selectedProvider = filteredProviders.find(p => p.id === state.datos?.proveedor_seleccionado);

  const initiateHire = () => {
    setHireConfirm(true);
  };

  const confirmHire = () => {
    if (selectedProvider) {
      onHire(selectedProvider.id);
      setHireConfirm(false);
    }
  };

  let mapCenter = { lat: -34.6037, lng: -58.3816 };
  if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
    const uLat = Number(userLocation[0]);
    const uLng = Number(userLocation[1]);
    if (!isNaN(uLat) && !isNaN(uLng)) {
      mapCenter = { lat: uLat, lng: uLng };
    }
  }
  
  if (selectedProvider) {
    const pLat = Number(selectedProvider.latitude ?? selectedProvider.lat);
    const pLng = Number(selectedProvider.longitude ?? selectedProvider.lng);
    if (!isNaN(pLat) && !isNaN(pLng) && pLat !== 0 && pLng !== 0) {
      mapCenter = { lat: pLat, lng: pLng };
    }
  }

  const handleAddMockProvider = async () => {
    setIsAddingMock(true);
    try {
      const mockId = `mock_${Date.now()}`;
      // slight offset for variation
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      
      const providerData = {
        nombre: `Test Provider ${Math.floor(Math.random() * 1000)}`,
        role: 'proveedor',
        categoria: ['Plomero', 'Electricista', 'Cerrajero'][Math.floor(Math.random() * 3)],
        latitude: mapCenter.lat + offsetLat,
        longitude: mapCenter.lng + offsetLng,
        disponible: true,
        precio: Math.floor(Math.random() * 50) + 20,
        karma: 100,
        bio_memoria: 'Proveedor de prueba generado.'
      };
      
      await setDoc(doc(db, 'profiles', mockId), providerData);
      await setDoc(doc(db, 'profiles_providers', mockId), providerData);
    } catch (e) {
      console.error("Error adding mock provider:", e);
    } finally {
      setIsAddingMock(false);
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
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
        <QuantumMap 
          center={mapCenter}
          providers={filteredProviders}
          activeProviderId={state.datos?.proveedor_seleccionado}
          mapTheme={mapTheme}
          onHire={(name) => initiateHire()}
          onSelectProvider={onSelectProvider}
        />
      </div>

      {/* Map Actions */}
      <div className="absolute bottom-24 left-6 md:bottom-auto md:left-auto md:top-6 md:right-6 z-40 flex flex-row md:flex-col gap-1 p-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
        <button 
          onClick={handleAddMockProvider}
          disabled={isAddingMock}
          className={cn(
            "p-3 rounded-full text-white transition-all duration-300 relative group",
            isAddingMock ? "animate-pulse border border-quantum-cyan bg-quantum-cyan/10" : "hover:bg-white/10"
          )}
        >
          <Plus size={20} className={isAddingMock ? "animate-spin text-quantum-cyan" : "text-white/70 group-hover:text-white"} strokeWidth={1.5} />
        </button>
        <div className="hidden md:block w-full h-px bg-white/10 my-1"/>
        <div className="md:hidden h-full w-px bg-white/10 mx-1 self-stretch"/>
        <button 
          onClick={() => setMapTheme(mapTheme === 'dark' ? 'satellite' : 'dark')}
          className={cn(
            "p-3 rounded-full text-white transition-all duration-300 group",
            mapTheme === 'satellite' ? "bg-quantum-cyan/20 text-quantum-cyan" : "hover:bg-white/10"
          )}
        >
          <Layers size={20} className={mapTheme === 'satellite' ? "text-quantum-cyan" : "text-white/70 group-hover:text-white"} strokeWidth={1.5} />
        </button>
        <div className="hidden md:block w-full h-px bg-white/10 my-1"/>
        <div className="md:hidden h-full w-px bg-white/10 mx-1 self-stretch"/>
        <button 
          onClick={onRequestLocation}
          disabled={isLocationLoading}
          className={cn(
            "p-3 rounded-full text-white transition-all duration-300 group",
            isLocationLoading ? "animate-pulse border border-quantum-cyan bg-quantum-cyan/10" : "hover:bg-white/10"
          )}
        >
          <MapPin size={20} className={isLocationLoading ? "animate-spin text-quantum-cyan" : "text-white/70 group-hover:text-white"} strokeWidth={1.5} />
        </button>
      </div>

      {/* Provider Card Overlay */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-6 left-6 right-6 md:left-28 md:right-auto w-auto md:w-[340px] z-40"
          >
            <div className="overflow-hidden bg-black/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] text-white shadow-[0_0_40px_rgba(0,0,0,0.5)]">
               <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-2">
                     <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{selectedProvider.nombre}</h2>
                        <p className="text-xs md:text-sm text-quantum-cyan uppercase tracking-widest font-semibold mt-1">{selectedProvider.categoria}</p>
                     </div>
                  </div>
                  <p className="text-xs md:text-sm text-white/50 leading-relaxed mb-6 mt-4 line-clamp-3">{selectedProvider.bio_memoria}</p>
                  <button 
                      onClick={initiateHire}
                      className="w-full relative overflow-hidden group py-3 bg-white text-black font-bold uppercase tracking-wider rounded-2xl text-[10px] md:text-xs transition-all hover:scale-[1.02]"
                  >
                      <span className="relative z-10">Contratar • R$ {selectedProvider.precio}/h</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-quantum-cyan/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Interface - Center Bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
        
        {/* Hugo Message Bubble */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={liveError ? 'error' : (isLiveActive ? 'live' : 'msg')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 px-6 py-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl max-w-md text-center shadow-2xl pointer-events-auto"
          >
            {liveError ? (
              <p className="text-[13px] font-mono text-red-400">
                {liveError}
              </p>
            ) : (
              <p className="text-sm font-medium text-white/90 leading-relaxed font-sans">
                {isLiveActive ? liveTranscript : (state.hugo_mensaje || "Olá! Eu sou Hugo, seu Orbe inteligente. Como posso ajudar hoje?")}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-auto relative">
          <HugoOrb 
            state={isLiveActive ? 'LISTENING' : orbState} 
            onClick={handleOrbClick}
            className="w-24 h-24"
          />
        </div>
        
        {/* Voice Trigger (based on image) */}
        {!isLiveActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 px-5 py-2 bg-black/60 backdrop-blur-xl border border-quantum-cyan/30 rounded-full flex items-center gap-2 pointer-events-auto cursor-pointer hover:bg-quantum-cyan/20 transition-colors"
            onClick={handleOrbClick}
          >
              <span className="text-[10px] text-quantum-cyan font-bold uppercase tracking-[0.2em]">Toca para hablar</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
