import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, Wrench, Briefcase, UserCircle, Filter, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix leaflet marker icon
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      try {
        const zoom = map.getZoom();
        const safeZoom = (typeof zoom === 'number' && !isNaN(zoom)) ? zoom : 14;
        
        // Calculate coordinate angular distance to adjust duration and deceleration curves
        const currentCenter = map.getCenter();
        const dLat = Math.abs(currentCenter.lat - lat);
        const dLng = Math.abs(currentCenter.lng - lng);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng); // distance in degrees
        
        // Premium dynamic transition duration:
        // Short hops: ~1.2s. Massive pans: capped smoothly at 2.4s.
        const computedDuration = Math.min(2.4, Math.max(1.2, 1.2 + dist * 55));
        
        map.flyTo([lat, lng], safeZoom, {
          animate: true,
          duration: computedDuration,
          easeLinearity: 0.15 // Smaller linearity value means faster start and much wider/smoother deceleration landing (higher easing-out)
        });
      } catch (err) {
        console.warn("Map flyTo failed softly:", err);
      }
    }
  }, [center?.lat, center?.lng, map]);
  return null;
}

// Generate premium custom cyber-icons for map providers matching the U.G.O brand
const createCustomIcon = (provider: Provider, isActive: boolean) => {
  const categoryStr = String(provider.categoria || provider.especialidade || '').toLowerCase();
  const isElectricista = categoryStr.includes('electr');
  const isPlomero = categoryStr.includes('plom') || categoryStr.includes('bombeiro') || categoryStr.includes('hidr');
  const isCerrajero = categoryStr.includes('cerr') || categoryStr.includes('chave');
  
  let color = '#a855f7'; // Purple default
  let label = 'P';
  if (isElectricista) {
    color = '#00f2ff'; // Quantum cyan
    label = '⚡';
  } else if (isPlomero) {
    color = '#06b6d4'; // Cyan-teal
    label = '🔧';
  } else if (isCerrajero) {
    color = '#ff4e00'; // Quantum orange-red
    label = '🔑';
  }

  const activeBorder = isActive 
    ? `border-width: 3px; border-color: #ffffff; box-shadow: 0 0 25px ${color}, inset 0 0 10px rgba(0, 242, 255, 0.5); transform: scale(1.2);` 
    : `border-width: 2px; border-color: ${color}80; box-shadow: 0 4px 12px rgba(0,0,0,0.4);`;

  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300" 
           style="background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(8px); ${activeBorder}">
        <!-- Pulse effect for active selection -->
        ${isActive ? `
          <div class="absolute -inset-1 rounded-full animate-ping opacity-75" style="border: 1px solid ${color};"></div>
        ` : ''}
        <span class="text-sm select-none">${label}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

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
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  bio_memoria?: string;
  categoria?: string;
  especialidade?: string;
  estado_online?: boolean;
  status?: string;
}

interface QuantumMapProps {
  center: { lat: number; lng: number };
  providers: Provider[];
  activeProviderId?: string;
  mapTheme?: 'dark' | 'satellite';
  onHire?: (providerName: string) => void;
  onSelectProvider?: (providerId: string) => void;
}

export default function QuantumMap({ center, providers, activeProviderId, mapTheme = 'dark', onHire, onSelectProvider }: QuantumMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'Todos'>('Todos');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50); // KM

  const [lastCenter, setLastCenter] = useState(center);
  const [focusPulse, setFocusPulse] = useState(false);
  const [focusedProvider, setFocusedProvider] = useState<Provider | null>(null);

  // Monitor center coordinate updates to trigger lock-on radar
  useEffect(() => {
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    const lastLat = Number(lastCenter?.lat);
    const lastLng = Number(lastCenter?.lng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && (lat !== lastLat || lng !== lastLng)) {
      setLastCenter(center);
      setFocusPulse(true);
      
      const matchingProv = providers.find(p => {
        const plat = Number(p.latitude ?? p.lat);
        const plng = Number(p.longitude ?? p.lng);
        return Math.abs(plat - lat) < 0.0001 && Math.abs(plng - lng) < 0.0001;
      });
      if (matchingProv) {
        setFocusedProvider(matchingProv);
      }
      
      const timer = setTimeout(() => {
        setFocusPulse(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [center, lastCenter, providers]);

  // Monitor explicitly activated provider IDs for focus sweeps
  useEffect(() => {
    if (activeProviderId) {
      const activeP = providers.find(p => p.id === activeProviderId);
      if (activeP) {
        setFocusedProvider(activeP);
        setFocusPulse(true);
        const timer = setTimeout(() => {
          setFocusPulse(false);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeProviderId, providers]);

  const safeCenter = useMemo(() => {
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return { lat: -34.6037, lng: -58.3816 };
    }
    return { lat, lng };
  }, [center]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchCategory = selectedCategory === 'Todos' || (p.categoria || p.especialidade) === selectedCategory;
      const matchRating = (p.rating || 0) >= minRating;
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      if (isNaN(lat) || isNaN(lng)) return false;
      const dist = calculateDistance(safeCenter.lat, safeCenter.lng, lat, lng);
      const matchDistance = dist <= maxDistance;

      return matchCategory && matchRating && matchDistance;
    });
  }, [providers, selectedCategory, minRating, maxDistance, safeCenter]);

  const tileUrl = mapTheme === 'satellite' 
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    
  const attribution = mapTheme === 'satellite'
    ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
      <div className="relative w-full h-full bg-quantum-dark">
        {/* Cyberpunk Easing Sweep HUD & Targeting Reticle Overlay */}
        <AnimatePresence>
          {focusPulse && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[399] pointer-events-none overflow-hidden flex items-center justify-center bg-transparent"
            >
              {/* Glowing vertical swipe scanner bars */}
              <motion.div 
                initial={{ y: '-100%' }}
                animate={{ y: '200%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-quantum-cyan/80 to-transparent shadow-[0_0_15px_#00f2ff,0_0_30px_#00f2ff]"
              />

              {/* Central Lock-on HUD Frame */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Cybernetic brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-quantum-cyan shadow-[-2px_-2px_8px_rgba(0,242,255,0.5)]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-quantum-cyan shadow-[2px_-2px_8px_rgba(0,242,255,0.5)]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-quantum-cyan shadow-[-2px_2px_8px_rgba(0,242,255,0.5)]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-quantum-cyan shadow-[2px_2px_8px_rgba(0,242,255,0.5)]" />

                {/* Innermost pulsing targeting crosshair */}
                <motion.div 
                  animate={{ scale: [0.93, 1.07, 0.93], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-full border border-quantum-cyan/30 flex items-center justify-center relative bg-quantum-dark/30 backdrop-blur-[2px]"
                >
                  <div className="w-2 h-2 bg-quantum-cyan rounded-full animate-pingAbsolute" style={{ animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                  <div className="w-1.5 h-1.5 bg-quantum-cyan rounded-full" />
                </motion.div>

                {/* Human lock status text */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-10 text-center flex flex-col items-center justify-center"
                >
                  <span className="text-[10px] font-mono text-quantum-cyan font-bold uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">Enfocando...</span>
                </motion.div>

                {/* Focused provider card snippet */}
                {focusedProvider && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl flex items-center gap-3 shadow-2xl w-max border-b-quantum-cyan/50"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-quantum-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-quantum-cyan"></span>
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-mono text-quantum-cyan/85 uppercase tracking-wider font-bold">Ubicación Sincronizada</span>
                      <span className="text-xs text-white/95 font-semibold leading-tight">{focusedProvider.nombre || (focusedProvider.primeiro_nome ? `${focusedProvider.primeiro_nome} ${focusedProvider.sobrenome || ''}` : 'Proveedor')}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute left-1/2 -translate-x-1/2 z-[400] flex gap-4 pointer-events-none transition-all duration-500 ${activeProviderId ? 'top-64 md:top-6' : 'top-6'}`}>
          <div className="bg-black/60 backdrop-blur-3xl p-4 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-72 pointer-events-auto flex flex-col gap-4">
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] text-quantum-cyan font-bold uppercase tracking-[0.2em]">Rating Mínimo</span>
                   <span className="text-sm font-mono text-white">{minRating.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full accent-quantum-cyan cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none" />
             </div>
             <div className="w-full h-px bg-white/10" />
             <div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] text-quantum-cyan font-bold uppercase tracking-[0.2em]">Raio Máximo</span>
                   <span className="text-sm font-mono text-white">{maxDistance} km</span>
                </div>
                <input type="range" min="1" max="100" step="1" value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full accent-quantum-cyan cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none" />
             </div>
          </div>
        </div>
        <MapContainer center={[safeCenter.lat, safeCenter.lng]} zoom={14} style={{ width: '100%', height: '100%', WebkitFilter: mapTheme === 'dark' ? 'hue-rotate(190deg) brightness(0.65) saturate(1.2) contrast(1.15)' : 'none' }}>
          <MapUpdater center={safeCenter} />
          <TileLayer url={tileUrl} attribution={attribution} />
          {filteredProviders.map(p => {
             const lat = Number(p.latitude ?? p.lat);
             const lng = Number(p.longitude ?? p.lng);
             if (isNaN(lat) || isNaN(lng)) return null;
             return (
               <Marker 
                 key={p.id} 
                 position={[lat, lng]} 
                 icon={createCustomIcon(p, p.id === activeProviderId)}
                 eventHandlers={{ click: () => onSelectProvider?.(p.id) }} 
               />
             );
          })}
        </MapContainer>
      </div>
  );
}
