import { useMemo, useState } from 'react';
import QuantumMap from './QuantumMap';
import HugoOrb from './HugoOrb';
import ConfirmationDialog from './ConfirmationDialog';
import ClientActiveService from './ClientActiveService';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Layers, MapPin, MessageCircle } from 'lucide-react';
import { useProviders } from '../contexts/ProvidersContext';
import { createBooking } from '../services/bookingService';

interface ClientAppLayoutProps {
  user: any;
  state: any;
  orbState: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  isLiveActive: boolean;
  liveTranscript: string | null;
  liveError?: string | null;
  handleOrbClick: () => void;
  onRequestLocation: () => void;
  isLocationLoading: boolean;
  userLocation?: [number, number];
  onHire: (id: string) => void;
  onSelectProvider: (id: string) => void;
  onChat: (providerId: string) => void;
}

export default function ClientAppLayout({
  user,
  state,
  orbState,
  isLiveActive,
  liveTranscript,
  liveError,
  handleOrbClick,
  onRequestLocation,
  isLocationLoading,
  userLocation,
  onHire,
  onSelectProvider,
  onChat,
}: ClientAppLayoutProps) {
  const { providers } = useProviders();
  const [hireConfirm, setHireConfirm] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite' | 'light'>('light');

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      const isTestProvider =
        p.nombre?.toLowerCase().includes('test provider') ||
        p.id?.startsWith('mock_') ||
        p.uid?.startsWith('mock_') ||
        p.id === 'test_provider';

      const isAvailable =
        p.disponible === true ||
        p.estado_online === true ||
        (p.status != null && p.status !== 'OFFLINE');

      return (
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        (lat !== 0 || lng !== 0) &&
        !isTestProvider &&
        isAvailable
      );
    });
  }, [providers]);

  const selectedProvider = filteredProviders.find((p) => p.id === state.datos?.proveedor_seleccionado);
  const providerAvailable = selectedProvider?.disponible !== false && selectedProvider?.status !== 'OFFLINE';
  const selectedPrice = Number(
    selectedProvider?.precio ?? selectedProvider?.tarifa_personalizada ?? selectedProvider?.tarifa ?? 0
  );

  const confirmHire = async (scheduledFor: Date | null) => {
    if (!selectedProvider || !providerAvailable || isHiring) return;

    setIsHiring(true);
    setHireError(null);

    try {
      await createBooking({
        clienteId: user.uid,
        clienteNombre: user.displayName || user.email || 'Cliente UGO',
        proveedorId: selectedProvider.id,
        proveedorNombre: selectedProvider.nombre || selectedProvider.primeiro_nome || 'Profesional UGO',
        servicio: state.datos?.servicio || selectedProvider.categoria || selectedProvider.especialidade || 'Servicio UGO',
        categoria: selectedProvider.categoria || selectedProvider.especialidade,
        monto: selectedPrice,
        precioHora: selectedPrice,
        scheduledFor,
        location: userLocation
          ? { latitude: Number(userLocation[0]), longitude: Number(userLocation[1]) }
          : null,
      });

      setHireConfirm(false);
      onSelectProvider('');
      onHire(selectedProvider.id);
    } catch (error) {
      console.error('Error creando el pedido:', error);
      setHireError('No pudimos crear el pedido. Revisá la conexión y volvé a intentar.');
    } finally {
      setIsHiring(false);
    }
  };

  let mapCenter = { lat: -27.5945, lng: -48.5477 };
  if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
    const uLat = Number(userLocation[0]);
    const uLng = Number(userLocation[1]);
    if (!Number.isNaN(uLat) && !Number.isNaN(uLng)) mapCenter = { lat: uLat, lng: uLng };
  }

  if (selectedProvider) {
    const pLat = Number(selectedProvider.latitude ?? selectedProvider.lat);
    const pLng = Number(selectedProvider.longitude ?? selectedProvider.lng);
    if (!Number.isNaN(pLat) && !Number.isNaN(pLng) && pLat !== 0 && pLng !== 0) {
      mapCenter = { lat: pLat, lng: pLng };
    }
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-black">
      <ClientActiveService userId={user.uid} />

      <ConfirmationDialog
        isOpen={hireConfirm}
        providerName={selectedProvider?.nombre || 'Proveedor'}
        cost={selectedPrice}
        onConfirm={confirmHire}
        onCancel={() => {
          if (!isHiring) setHireConfirm(false);
        }}
      />

      <div className="absolute inset-0 z-0">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.65)_100%)]" />
        <QuantumMap
          center={mapCenter}
          providers={filteredProviders}
          activeProviderId={state.datos?.proveedor_seleccionado}
          mapTheme={mapTheme}
          onHire={() => providerAvailable && setHireConfirm(true)}
          onSelectProvider={onSelectProvider}
        />
      </div>

      <div className="absolute bottom-28 left-4 z-40 flex flex-row gap-1 rounded-full border border-white/10 bg-black/55 p-1 shadow-2xl backdrop-blur-2xl md:bottom-auto md:left-auto md:right-6 md:top-6 md:flex-col">
        <button
          type="button"
          aria-label="Cambiar estilo del mapa"
          onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : mapTheme === 'dark' ? 'satellite' : 'light')}
          className={cn(
            'rounded-full p-3 text-white transition-all duration-300',
            mapTheme === 'satellite'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : mapTheme === 'light'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
          )}
        >
          <Layers size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Usar mi ubicación"
          onClick={onRequestLocation}
          disabled={isLocationLoading}
          className={cn(
            'rounded-full p-3 text-white transition-all duration-300',
            isLocationLoading ? 'animate-pulse border border-quantum-cyan bg-quantum-cyan/10' : 'hover:bg-white/10'
          )}
        >
          <MapPin
            size={20}
            className={isLocationLoading ? 'animate-spin text-quantum-cyan' : ''}
            strokeWidth={1.5}
          />
        </button>
      </div>

      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute left-4 right-4 top-4 z-40 md:left-28 md:right-auto md:top-6 md:w-[360px]"
          >
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/75 text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
              <div className="p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold tracking-tight md:text-2xl">
                      {selectedProvider.nombre}
                    </h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-quantum-cyan">
                      {selectedProvider.categoria || 'Profesional UGO'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                      providerAvailable
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/10 text-white/50'
                    )}
                  >
                    {providerAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {selectedProvider.bio_memoria && (
                  <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-white/55 md:text-sm">
                    {String(selectedProvider.bio_memoria)}
                  </p>
                )}

                {hireError && (
                  <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-200">{hireError}</p>
                )}

                <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
                  <button
                    type="button"
                    aria-label="Abrir chat"
                    onClick={() => onChat(selectedProvider.id)}
                    className="flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-white transition-colors hover:bg-white/10"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button
                    type="button"
                    disabled={!providerAvailable || isHiring}
                    onClick={() => setHireConfirm(true)}
                    className="min-h-11 rounded-2xl bg-white px-4 text-xs font-bold uppercase tracking-wider text-black transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
                  >
                    {isHiring
                      ? 'Creando pedido…'
                      : providerAvailable
                        ? `Contratar • R$ ${selectedPrice.toFixed(2)}`
                        : 'No disponible ahora'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-28 left-0 right-0 z-30 flex flex-col items-center md:bottom-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={liveError ? 'error' : isLiveActive ? 'live' : 'msg'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="pointer-events-auto mb-5 max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-black/80 px-5 py-3 text-center shadow-2xl backdrop-blur-3xl md:mb-8 md:max-w-md md:px-6 md:py-4"
          >
            {liveError ? (
              <p className="font-mono text-[12px] text-red-400">{liveError}</p>
            ) : (
              <p className="text-sm font-medium leading-relaxed text-white/90">
                {isLiveActive
                  ? liveTranscript
                  : state.hugo_mensaje || 'Olá! Eu sou Hugo. Como posso ajudar hoje?'}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-auto relative">
          <HugoOrb
            state={isLiveActive ? 'LISTENING' : orbState}
            onClick={handleOrbClick}
            className="h-20 w-20 md:h-24 md:w-24"
          />
        </div>

        {!isLiveActive && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto mt-4 rounded-full border border-quantum-cyan/30 bg-black/60 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-quantum-cyan backdrop-blur-xl transition-colors hover:bg-quantum-cyan/20 md:mt-6"
            onClick={handleOrbClick}
          >
            Toca para hablar
          </motion.button>
        )}
      </div>
    </div>
  );
}
