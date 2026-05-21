import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Lock, Radio, Activity, MapPin, Mic, MicOff } from 'lucide-react';
import QuantumMap from './QuantumMap';

export default function AdminPanel() {
  const [metrics, setMetrics] = useState({
    bovedaTotal: 0,
    serviciosActivos: 0,
    prestadoresOnline: 0,
    usuariosRegistrados: 0
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([
    '> INITIALIZING QUANTUM CORE...',
    '> ESTABLISHING SECURE CONNECTION...',
    '> BÓVEDA ESCROW: RECLAMADA',
    '> MONITOREO DE PRESTADORES: 14 ACTIVOS',
    '> LATENCIA: 12ms'
  ]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 1. Escuchar Bóveda (Contratos)
    const contratosRef = collection(db, 'contratos');
    const unsubContratos = onSnapshot(contratosRef, (snap) => {
      let total = 0;
      snap.forEach(doc => { total += (doc.data().monto_total || 0); });
      setMetrics(prev => ({ ...prev, bovedaTotal: total }));
    });

    // 2. Escuchar Servicios Activos
    const agendamentosRef = collection(db, 'agendamentos');
    const unsubServicios = onSnapshot(agendamentosRef, (snap) => {
      setMetrics(prev => ({ ...prev, serviciosActivos: snap.size }));
    });

    // 3. Escuchar Prestadores Online y datos para el mapa
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('tipo', '==', 'prestador'));
    const unsubProfiles = onSnapshot(q, (snap) => {
      const providersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProviders(providersList);

      const onlineCount = providersList.filter(p => p.estado_online).length;
      setMetrics(prev => ({ ...prev, prestadoresOnline: onlineCount }));
    });

    // Voice Recognition Initialization
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };
    }

    return () => {
      unsubContratos();
      unsubServicios();
      unsubProfiles();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleVoiceCommand = (command: string) => {
    setLogs(prev => [...prev, `> COMANDO RECIBIDO: ${command}`]);
    if (command.includes('bono') && command.includes('norte')) {
      setLogs(prev => [...prev, '> EJECUTANDO: BONO DINÁMICO ZONA NORTE ACTIVADO']);
    } else if (command.includes('reporte')) {
      setLogs(prev => [...prev, '> EJECUTANDO: GENERANDO REPORTE EJECUTIVO...']);
      setLogs(prev => [...prev, `> REPORTE: BÓVEDA TOTAL $${metrics.bovedaTotal.toFixed(2)} | SERVICIOS ACTIVOS: ${metrics.serviciosActivos}`]);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  return (
    <div className="p-6 h-full text-white bg-[rgba(5,5,10,0.95)] backdrop-blur-2xl border-l border-[rgba(0,212,255,0.2)] shadow-2xl overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          CENTRO DE COMANDO
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleListening}
            className={`p-2 rounded-full border ${isListening ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400'}`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">SISTEMA ONLINE</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Fondos Bóveda', value: `$ ${metrics.bovedaTotal.toFixed(2)}`, icon: Lock, gradient: 'from-blue-600/20 to-cyan-500/20' },
          { label: 'Servicios Activos', value: metrics.serviciosActivos, icon: Activity, gradient: 'from-purple-600/20 to-indigo-500/20' },
          { label: 'Prestadores Online', value: metrics.prestadoresOnline, icon: Radio, gradient: 'from-emerald-600/20 to-teal-500/20' },
          { label: 'Usuarios', value: '---', icon: Users, gradient: 'from-amber-600/20 to-orange-500/20' }
        ].map((m, i) => (
          <div key={i} className={`bg-gradient-to-br ${m.gradient} backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-cyan-500/50 transition-all shadow-lg`}>
            <div className="flex items-center gap-2 mb-3 text-white/60 text-[10px] uppercase tracking-widest">
              <m.icon size={14} className="text-cyan-400" />
              {m.label}
            </div>
            <div className="font-mono text-2xl font-light text-white drop-shadow-md">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="h-96 w-full mb-8 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
        <QuantumMap center={[-34.6037, -58.3816]} providers={providers} />
      </div>
      
      {/* Terminal Area */}
      <div className="bg-black/80 border border-cyan-900/50 rounded-2xl p-6 shadow-inner">
        <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full" />
          Logs de Hugo / U.G.O Kernel
        </h3>
        <div className="font-mono text-[11px] text-emerald-400/80 space-y-2 h-40 overflow-y-auto pr-2 scrollbar-none">
          {logs.map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
