import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, Wrench, Briefcase, UserCircle, Filter, MapPin } from 'lucide-react';

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
        map.flyTo([lat, lng], safeZoom, { animate: true, duration: 1.5 });
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
