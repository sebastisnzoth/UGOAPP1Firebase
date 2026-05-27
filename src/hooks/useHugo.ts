import { useState, useCallback, useEffect, useRef } from 'react';
import { hugoService, HugoResponse } from '../services/hugoService';

interface Provider {
  id: string;
  nombre: string;
  rating: number;
  tarifa: number;
  // Optional fields that might be used by the UI
  primeiro_nome?: string;
  sobrenome?: string;
  precio?: number;
  tarifa_personalizada?: number;
  foto?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  categoria?: string;
  especialidade?: string;
}

interface HugoState extends HugoResponse {
  datos: {
    servicio?: string;
    monto?: number;
    confirmado?: boolean;
    proveedores?: Provider[];
    proveedor_seleccionado?: string;
    monto_acordado?: number;
    estado_boveda?: string;
    servicio_activo?: {
      status: string;
      eta: string;
      codigo_seguridad: string;
    };
    escrow?: {
      total_a_pagar: number;
      estado: string;
    };
  };
}

export function useHugo() {
  const [state, setState] = useState<HugoState>({
    hugo_mensaje: "Olá! Eu sou Hugo, seu Orbe inteligente. Como posso ajudar hoje?",
    accion: "CONVERSAR",
    ui_action: 'IDLE',
    datos: {}
  });

  const [history, setHistory] = useState<any[]>([]);
  const [orbState, setOrbState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [userLocation, setUserLocation] = useState<[number, number]>([-27.5945, -48.5477]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const requestLocation = useCallback(() => {
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocationLoading(false);
      },
      (err) => {
        console.error("Erro ao obter localização:", err);
        setIsLocationLoading(false);
      }
    );
  }, []);

  const stopTTS = () => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    setOrbState('IDLE');
  };

  const playTTS = async (text: string) => {
    try {
      stopTTS();
      const base64Audio = await hugoService.tts(text);
      if (!base64Audio) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioData = atob(base64Audio);
      const uint8 = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        uint8[i] = audioData.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;
      try {
        // Try decoding as container (WAV/AAC)
        // We slice the buffer because decodeAudioData detaches it
        audioBuffer = await audioContextRef.current.decodeAudioData(uint8.buffer.slice(0));
      } catch (e) {
        // Fallback to raw PCM 16-bit 24kHz
        // Create a new view from the original buffer which should still be valid
        const pcmData = new Int16Array(uint8.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }
        audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      currentSourceRef.current = source;
      setOrbState('SPEAKING');
      source.onended = () => {
        if (currentSourceRef.current === source) {
          setOrbState('IDLE');
          currentSourceRef.current = null;
        }
      };
      source.start();
    } catch (error) {
      console.error("Erro ao reproduzir TTS:", error);
      setOrbState('IDLE');
    }
  };

  const processMessage = useCallback(async (text: string, isExternal: boolean = false) => {
    if (!isExternal) setOrbState('THINKING');
    
    try {
      if (isExternal) {
        setState(prev => ({ ...prev, hugo_mensaje: text }));
        await playTTS(text);
        return;
      }

      const result = await hugoService.chat(text, history, userLocation);
      
      // Update history
      setHistory(prev => [
        ...prev, 
        { role: 'user', parts: [{ text }] }, 
        { role: 'model', parts: [{ text: result.hugo_mensaje }] }
      ].slice(-10)); // Keep last 10 turns for memory
      
      // Grounding fallback for providers if needed
      if (!result.datos) result.datos = {};
      
      if (result.accion === 'BUSCAR_PROVEEDOR' && (!result.datos.proveedores || result.datos.proveedores.length === 0)) {
        result.datos.proveedores = [
          { id: 'p1', nombre: 'Marco Rossi', rating: 4.9, tarifa: 85, foto: 'https://picsum.photos/seed/marco/100/100', categoria: 'Eletricista', latitude: userLocation[0] + 0.005, longitude: userLocation[1] + 0.005 },
          { id: 'p2', nombre: 'Ana Silva', rating: 4.8, tarifa: 70, foto: 'https://picsum.photos/seed/ana/100/100', categoria: 'Limpeza', latitude: userLocation[0] - 0.005, longitude: userLocation[1] + 0.005 },
          { id: 'p3', nombre: 'João Reparos', rating: 4.7, tarifa: 95, foto: 'https://picsum.photos/seed/joao/100/100', categoria: 'Encanador', latitude: userLocation[0] + 0.005, longitude: userLocation[1] - 0.005 }
        ];
      }

      setState(result as HugoState);
      await playTTS(result.hugo_mensaje);

    } catch (error) {
      console.error("Erro no Hugo Brain:", error);
      setOrbState('IDLE');
    }
  }, [userLocation, history]);

  const analyzeMedia = async (file: File, prompt: string) => {
    setOrbState('THINKING');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await hugoService.analyzeMedia(base64, file.type, prompt);
        setState(prev => ({ ...prev, hugo_mensaje: analysis || "Análise concluída." }));
        if (analysis) await playTTS(analysis);
      };
    } catch (error) {
      console.error("Erro na análise de mídia:", error);
      setOrbState('IDLE');
    }
  };

  const sayWelcome = useCallback(() => {
    playTTS(state.hugo_mensaje);
  }, [state.hugo_mensaje]);

  const selectProvider = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      datos: {
        ...prev.datos,
        proveedor_seleccionado: id
      }
    }));
  }, []);

  return {
    state,
    orbState,
    setOrbState,
    processMessage,
    analyzeMedia,
    sayWelcome,
    stopTTS,
    userLocation,
    requestLocation,
    isLocationLoading,
    selectProvider
  };
}
