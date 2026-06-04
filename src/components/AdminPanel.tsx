import React, { useEffect, useState, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Lock, Radio, Activity, MapPin, Mic, MicOff, ExternalLink, BarChart3, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import QuantumMap from './QuantumMap';
import { seedFictitiousProviders } from '../services/seedService';

const mockChartData = [
  { day: 'Lun', servicios: 12, boveda: 450 },
  { day: 'Mar', servicios: 19, boveda: 980 },
  { day: 'Mie', servicios: 15, boveda: 720 },
  { day: 'Jue', servicios: 22, boveda: 1100 },
  { day: 'Vie', servicios: 30, boveda: 1850 },
  { day: 'Sab', servicios: 45, boveda: 2900 },
  { day: 'Dom', servicios: 38, boveda: 2400 },
];

export default function AdminPanel() {
  const [metrics, setMetrics] = useState({
    bovedaTotal: 0,
    serviciosActivos: 0,
    prestadoresOnline: 0,
    usuariosRegistrados: 0
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([
    '> INITIALIZING QUANTUM CORE...',
    '> ESTABLISHING SECURE CONNECTION...',
    '> BÓVEDA ESCROW: RECLAMADA',
    '> MONITOREO DE PRESTADORES: 14 ACTIVOS',
    '> LATENCIA: 12ms'
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
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
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(list);
    });

    // 3. Escuchar Proveedores Online y datos para el mapa
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('role', '==', 'proveedor'));
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

  const handleSeed = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    setLogs(prev => [...prev, '> INICIANDO SIEMBRA DE PROVEEDORES FICTICIOS...']);
    const result = await seedFictitiousProviders();
    if (result.success) {
      setLogs(prev => [...prev, `> SIEMBRA COMPLETADA: ${result.count} PROVEEDORES CREADOS`]);
    } else {
      setLogs(prev => [...prev, '> ERROR AL CREAR PROVEEDORES FICTICIOS']);
    }
    setIsSeeding(false);
  };

  const servicesStats = useMemo(() => {
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    appointments.forEach((a) => {
      if (a.status === 'pending') {
        pendingCount++;
      } else if (a.status === 'confirmed') {
        activeCount++;
      } else if (a.status === 'completed') {
        completedCount++;
      } else if (a.status === 'cancelled') {
        cancelledCount++;
      }
    });

    const isMock = appointments.length === 0;
    const finalPending = isMock ? 6 : pendingCount;
    const finalActive = isMock ? 9 : activeCount;
    const finalCompleted = isMock ? 14 : completedCount;
    const finalCancelled = isMock ? 3 : cancelledCount;

    return [
      { name: 'Pendientes', value: finalPending, color: '#eab308' },
      { name: 'Activos', value: finalActive, color: '#06b6d4' },
      { name: 'Completados', value: finalCompleted, color: '#10b981' },
      { name: 'Cancelados', value: finalCancelled, color: '#ef4444' }
    ];
  }, [appointments]);

  return (
    <div className="p-6 h-full text-white bg-[rgba(5,5,10,0.95)] backdrop-blur-2xl border-l border-[rgba(0,212,255,0.2)] shadow-2xl overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          CENTRO DE COMANDO
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className={`flex items-center gap-2 px-3 py-1 bg-purple-950/30 border border-purple-500/30 rounded-full hover:bg-purple-900/50 transition-colors ${isSeeding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Database size={14} className="text-purple-400" />
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Sembrar Proveedores</span>
          </button>
          <a
            href="https://share.streamlit.io/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded-full hover:bg-cyan-900/50 transition-colors"
          >
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Analytics</span>
            <ExternalLink size={12} className="text-cyan-400/70" />
          </a>
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
      
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.12
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Fondos Bóveda', value: `$ ${metrics.bovedaTotal.toFixed(2)}`, icon: Lock, gradient: 'from-blue-600/20 to-cyan-500/20' },
          { label: 'Servicios Activos', value: metrics.serviciosActivos, icon: Activity, gradient: 'from-purple-600/20 to-indigo-500/20' },
          { label: 'Prestadores Online', value: metrics.prestadoresOnline, icon: Radio, gradient: 'from-emerald-600/20 to-teal-500/20' },
          { label: 'Usuarios', value: '---', icon: Users, gradient: 'from-amber-600/20 to-orange-500/20' }
        ].map((m, i) => (
          <motion.div 
            key={i} 
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
            }}
            className={`bg-gradient-to-br ${m.gradient} backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-cyan-500/50 transition-all shadow-lg flex flex-col`}
          >
            <div className="flex items-center gap-2 mb-3 text-white/60 text-[10px] uppercase tracking-widest">
              <m.icon size={14} className="text-cyan-400" />
              {m.label}
            </div>
            <div className="font-mono text-2xl font-light text-white drop-shadow-md mt-auto">
              {m.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <div className="h-96 bg-black/50 border border-cyan-900/50 rounded-2xl p-6 shadow-inner flex flex-col">
          <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={14} className="text-cyan-500" />
            Evolución U.G.O (Servicios vs Bóveda)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorServicios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBoveda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#06b6d4', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="servicios" name="Servicios" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorServicios)" />
                <Area yAxisId="right" type="monotone" dataKey="boveda" name="Bóveda ($)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBoveda)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time distribution board using Recharts */}
        <div className="h-96 bg-black/50 border border-cyan-900/50 rounded-2xl p-6 shadow-inner flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
              <Radio size={14} className="text-cyan-500 animate-pulse" />
              Distribución de Red
            </h3>
            {appointments.length > 0 ? (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider animate-pulse">Sincronizado</span>
            ) : (
              <span className="text-[9px] font-mono text-cyan-400/60 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/10 uppercase tracking-wider">Modo Activo</span>
            )}
          </div>
          
          <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={servicesStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {servicesStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Servicios</span>
              <span className="text-2xl font-light font-sans text-white">
                {appointments.length > 0 ? appointments.length : 32}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {servicesStats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-[10px] text-white/70 font-mono">{stat.name}</span>
                </div>
                <span className="text-xs font-mono text-white font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl relative animate-fadeIn">
          <div className="absolute top-4 right-4 z-[400] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-cyan-400 capitalize tracking-widest pointer-events-none shadow-lg">
             Mapa Radar Activo
          </div>
          <QuantumMap center={{ lat: -34.6037, lng: -58.3816 }} providers={providers.filter(p => !(p.nombre?.toLowerCase().includes('test provider') || p.id?.startsWith('mock_') || p.uid?.startsWith('mock_') || p.id === 'test_provider'))} />
        </div>
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
