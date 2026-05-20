import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import React, { useEffect, useState, useMemo } from 'react';
import { Zap, Wrench, Briefcase, UserCircle, Filter, MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  center: [number, number];
  providers: Provider[];
  activeProviderId?: string;
  onHire?: (providerName: string) => void;
  onSelectProvider?: (providerId: string) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

function ZoomToActiveProvider({ providers, activeProviderId }: { providers: Provider[], activeProviderId?: string }) {
  const map = useMap();
  useEffect(() => {
    if (activeProviderId) {
      const activeProvider = providers.find(p => p.id === activeProviderId);
      if (activeProvider) {
        const lat = Number(activeProvider.latitude ?? activeProvider.lat);
        const lng = Number(activeProvider.longitude ?? activeProvider.lng);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          map.flyTo([lat, lng], 16, { duration: 1.5 });
        }
      }
    }
  }, [activeProviderId, providers, map]);
  return null;
}

const getStatusDisplay = (provider: Provider) => {
  if (provider.status === 'OCUPADO') return { text: 'Ocupado', color: 'text-yellow-500', dot: 'bg-yellow-500' };
  if (provider.estado_online === false || provider.status === 'OFFLINE') return { text: 'Offline', color: 'text-white/40', dot: 'bg-red-500' };
  return { text: 'Disponível Agora', color: 'text-quantum-cyan', dot: 'bg-green-500' };
};

const getCategoryIconSvg = (category?: string) => {
  const size = 20;
  const color = "white";
  if (category?.includes('Eletric')) return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  if (category?.includes('Encan')) return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 1 0-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 0 7.94-7.94l-3.76 3.76z"/></svg>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
};

const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `,
  className: 'custom-leaflet-icon bg-transparent border-none',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const createCustomIcon = (provider: Provider, isActive: boolean) => {
  const statusInfo = getStatusDisplay(provider);
  const categoryIcon = getCategoryIconSvg(provider.categoria || provider.especialidade);
  
  const html = `
    <div class="relative flex items-center justify-center w-10 h-10 bg-quantum-card border-[2px] ${isActive ? 'border-quantum-cyan shadow-[0_0_20px_rgba(0,242,255,0.8)] scale-125 animate-pulse' : 'border-white/20 shadow-lg'} rounded-full transition-all duration-300">
      ${categoryIcon}
      <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-quantum-card ${statusInfo.dot}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon bg-transparent border-none outline-none',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

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

const ProviderMarker = React.memo(({
  provider,
  isActive,
  onSelectProvider,
  onHire
}: {
  provider: Provider;
  isActive: boolean;
  onSelectProvider?: (id: string) => void;
  onHire?: (name: string) => void;
}) => {
  const lat = Number(provider.latitude ?? provider.lat);
  const lng = Number(provider.longitude ?? provider.lng);
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

  const icon = useMemo(() => createCustomIcon(provider, isActive), [provider, isActive]);

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          if (onSelectProvider) onSelectProvider(provider.id);
        }
      }}
    >
      <Popup className="hugo-popup-compact">
        <div className="flex flex-col items-center p-3 font-sans w-[160px] bg-quantum-dark/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
          {provider.foto && (
            <img 
              src={provider.foto} 
              alt="Provider" 
              className="w-12 h-12 rounded-full mb-2 object-cover border border-quantum-cyan/30" 
            />
          )}
          <p className="font-bold text-sm text-white mb-0">
            {provider.nombre || `${provider.primeiro_nome} ${provider.sobrenome}`}
          </p>
          <p className="text-[10px] text-white/50 mb-1">{provider.categoria || provider.especialidade || 'Profissional'}</p>
          
          {provider.bio_memoria && (
            <p className="text-[10px] text-quantum-cyan/80 italic mb-2 line-clamp-2">"{provider.bio_memoria}"</p>
          )}
          
          <div className="flex items-center gap-2 mb-3 text-[10px] text-white/70">
            <span className="font-medium text-quantum-cyan">R$ {provider.precio || provider.tarifa_personalizada || provider.tarifa || 0}/h</span>
            <span>•</span>
            <span className="font-medium">⭐ {provider.rating || 5.0}</span>
          </div>
          
          {onHire && (
            <button 
              onClick={() => onHire(provider.nombre || provider.primeiro_nome || 'este proveedor')}
              className="w-full bg-quantum-cyan/20 border border-quantum-cyan/30 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg hover:bg-quantum-cyan hover:text-black transition-all duration-300"
            >
              Contratar
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
});
ProviderMarker.displayName = 'ProviderMarker';

export default function QuantumMap({ center, providers, activeProviderId, onHire, onSelectProvider }: QuantumMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'Todos'>('Todos');
  const [showOnlyProximity, setShowOnlyProximity] = useState(false);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(providers.map(p => p.categoria || p.especialidade || 'Outros')))], [providers]);

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchCategory = selectedCategory === 'Todos' || (p.categoria || p.especialidade) === selectedCategory;
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      const isProximityMatch = !showOnlyProximity || (calculateDistance(center[0], center[1], lat, lng) < 5); // 5km radius
      return matchCategory && isProximityMatch;
    });
  }, [providers, selectedCategory, showOnlyProximity, center]);

  return (
    <div className="relative w-full h-full">
      {/* Filter UI */}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        <div className="bg-quantum-dark/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-xl">
           <div className="flex gap-2">
             {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-quantum-cyan text-black' : 'bg-white/10 text-white'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
           <button 
              onClick={() => setShowOnlyProximity(!showOnlyProximity)}
              className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showOnlyProximity ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}
            >
              <MapPin size={14}/> {showOnlyProximity ? 'Exibindo Proximidade (5km)' : 'Filtrar Proximidade (5km)'}
            </button>
        </div>
      </div>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ChangeView center={center} />
        <ZoomToActiveProvider providers={providers} activeProviderId={activeProviderId} />

        {/* User Marker */}
        <Marker position={center} icon={userLocationIcon}>
          <Popup className="hugo-popup">
            <div className="text-center font-sans">
              <p className="font-bold">Você (Orbe Ativo)</p>
              <p className="text-xs opacity-70">Sua localização atual</p>
            </div>
          </Popup>
        </Marker>

        {/* Providers Markers */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={100}
          spiderfyOnMaxZoom={true}
          polygonOptions={{
            fillColor: '#00f2ff',
            color: '#00f2ff',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.2
          }}
        >
          {filteredProviders.map((p) => (
            <ProviderMarker
              key={p.id}
              provider={p}
              isActive={p.id === activeProviderId}
              onSelectProvider={onSelectProvider}
              onHire={onHire}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
