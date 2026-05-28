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
    if (!isNaN(center.lat) && !isNaN(center.lng)) {
      map.flyTo([center.lat, center.lng], map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center.lat, center.lng, map]);
  return null;
}

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
  onHire?: (providerName: string) => void;
  onSelectProvider?: (providerId: string) => void;
}

export default function QuantumMap({ center, providers, activeProviderId, onHire, onSelectProvider }: QuantumMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'Todos'>('Todos');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50); // KM

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
      const dist = calculateDistance(center.lat, center.lng, lat, lng);
      const matchDistance = dist <= maxDistance;

      return !isNaN(lat) && !isNaN(lng) && matchCategory && matchRating && matchDistance;
    });
  }, [providers, selectedCategory, minRating, maxDistance, center]);

  return (
      <div className="relative w-full h-full">
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
          <div className="bg-quantum-dark/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-xl w-60">
             <div className="text-xs text-white mb-1">Rating Mínimo: {minRating}</div>
             <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full mb-3" />
             <div className="text-xs text-white mb-1">Distância Máxima: {maxDistance} km</div>
             <input type="range" min="1" max="100" step="1" value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full mb-2" />
          </div>
        </div>
        <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
          <MapUpdater center={center} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          {filteredProviders.map(p => {
             const lat = Number(p.latitude ?? p.lat);
             const lng = Number(p.longitude ?? p.lng);
             if (isNaN(lat) || isNaN(lng)) return null;
             return (
               <Marker key={p.id} position={[lat, lng]} eventHandlers={{ click: () => onSelectProvider?.(p.id) }} />
             );
          })}
        </MapContainer>
      </div>
  );
}
