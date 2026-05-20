import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Lock, Radio, Activity, MapPin, Mic, MicOff, CloudUpload, Trophy, AlertTriangle, ShieldAlert, Gavel } from 'lucide-react';
import QuantumMap from './QuantumMap';
import { createManualInDrive } from '../services/googleDrive';

const DEPLOYMENT_MANUAL = `# U.G.O. Quantum OS: Manual de Despliegue y Operación

Este repositorio contiene la arquitectura lógica del sistema U.G.O. diseñado para el Soberano.

## 1. Configuración de Entorno (Firebase)
1. **Proyecto:** Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. **Auth:** Habilita el método de autenticación por *Email/Password*.
3. **Database:** Crea una base de datos en *Cloud Firestore* (modo producción).
4. **Hosting:** Habilita *Firebase Hosting* para desplegar tu panel de control y apps.

## 2. Esquema de Colecciones (Firestore)
* **\`profiles\`**: Datos de clientes y proveedores.
    * Campos: \`nombre\`, \`tipo\` (cliente/proveedor), \`disponible\` (bool), \`bio_memoria\` (mapa).
* **\`contratos\`**: Gestión de servicios en tiempo real.
    * Campos: \`estado\`, \`cliente_id\`, \`prestador_id\`, \`monto_total\`.

## 3. Despliegue del Sistema
Ejecuta los siguientes comandos en tu terminal local:
\`\`\`bash
# Iniciar proyecto
firebase login
firebase init

# Configurar servicios (Hosting, Firestore, Functions)
# Selecciona tu proyecto creado en la consola

# Despliegue final
firebase deploy
\`\`\`

## 4. Protocolo de Voz (Hugo)
El motor \`hugo-voice.js\` requiere acceso al micrófono. Asegúrate de servir el proyecto bajo \`HTTPS\` (Firebase Hosting lo hace automáticamente) para que el navegador permita la \`Web Speech API\`.

## 5. Seguridad Soberana
Las reglas de Firestore están configuradas para que solo el Soberano (\`sebastianzoth@gmail.com\`) tenga permisos de lectura/escritura sobre los logs de auditoría.

\`\`\`javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs_hugo/{document=**} {
      allow read, write: if request.auth.token.email == "sebastianzoth@gmail.com";
    }
  }
}
\`\`\`
`;

export default function AdminPanel() {
  const [metrics, setMetrics] = useState({
    bovedaTotal: 0,
    serviciosActivos: 0,
    prestadoresOnline: 0,
    usuariosRegistrados: 0
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [underPerformers, setUnderPerformers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([
    '> INITIALIZING QUANTUM CORE...',
    '> ESTABLISHING SECURE CONNECTION...',
    '> BÓVEDA ESCROW: RECLAMADA',
    '> MONITOREO DE PRESTADORES: 14 ACTIVOS',
    '> LATENCIA: 12ms'
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

      const onlineCount = providersList.filter(p => p.estado_online || p.disponible).length;
      setMetrics(prev => ({ ...prev, prestadoresOnline: onlineCount }));
      
      const sortedByScore = [...providersList].sort((a, b) => {
         const scoreA = a.bio_memoria?.score_total ?? a.rating ?? 0;
         const scoreB = b.bio_memoria?.score_total ?? b.rating ?? 0;
         return scoreB - scoreA;
      });
      
      setTopPerformers(sortedByScore.filter(p => (p.bio_memoria?.score_total ?? p.rating ?? 0) >= 4.8).slice(0, 5));
      setUnderPerformers(sortedByScore.filter(p => (p.bio_memoria?.score_total ?? p.rating ?? 0) < 3.5 && (p.bio_memoria?.score_total ?? p.rating ?? 0) > 0).slice(0, 5));
    });

    // Mock Disputes for preview
    setDisputes([
      {
        id: 'DSP-009A',
        cliente: 'Ansel (C-01)',
        prestador: 'Marco Rossi (P-88)',
        motivo: 'Llegó 45 mins tarde y no terminó',
        estado: 'PENDIENTE SOBERANO',
        rating_dejado: 1.5,
        prestador_score_previo: 4.8
      }
    ]);

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
    } else if (command.includes('manual') || command.includes('exportar')) {
       exportManualToDrive();
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

  const exportManualToDrive = async () => {
    setIsExporting(true);
    setLogs(prev => [...prev, '> EJECUTANDO: EXPORTANDO MANUAL A GOOGLE DRIVE...']);
    try {
      await createManualInDrive(DEPLOYMENT_MANUAL);
      setLogs(prev => [...prev, '> ÉXITO: MANUAL ENVIADO AL DRIVE SOBERANO.']);
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, '> ERROR: FALLO AL EXPORTAR MANUAL. VERIFIQUE PERMISOS.']);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDisputeAction = (id: string, action: 'descarta' | 'sancion') => {
    setLogs(prev => [...prev, `> RESOLUCIÓN SOBERANA: ${action.toUpperCase()} a ${id}`]);
    setDisputes(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="p-6 h-full text-white bg-[rgba(5,5,10,0.95)] backdrop-blur-2xl border-l border-[rgba(0,212,255,0.2)] shadow-2xl overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          CENTRO DE COMANDO
        </h2>
        <div className="flex items-center gap-4">
          <button 
             onClick={exportManualToDrive}
             disabled={isExporting}
             className="px-4 py-2 border border-cyan-500/50 bg-cyan-900/40 text-cyan-400 text-[10px] uppercase font-mono tracking-widest rounded-lg flex items-center gap-2 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
          >
             <CloudUpload size={14} />
             {isExporting ? 'EXPORTANDO...' : 'ENVIAR MANUAL A DRIVE'}
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
           <h3 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-amber-500/20 pb-2">
             <Trophy size={14} className="text-amber-400" />
             Top Performers (Élite)
           </h3>
           <div className="space-y-3">
             {topPerformers.length > 0 ? topPerformers.map(p => (
               <div key={p.id} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
                     {p.bio_memoria?.score_total?.toFixed(1) || p.rating?.toFixed(1) || '5.0'}
                   </div>
                   <div>
                     <div className="text-xs text-white uppercase tracking-widest">{p.nombre || 'Prestador Elite'}</div>
                     <div className="text-[10px] text-white/50">{p.bio_memoria?.servicios_exitosos || 0} Servicios</div>
                   </div>
                 </div>
                 <div className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded">HALO ACTIVO</div>
               </div>
             )) : (
               <div className="text-[10px] text-white/40 uppercase tracking-widest p-2">Sin prestadores Élite</div>
             )}
           </div>
        </div>

        <div className="bg-black/60 border border-red-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
           <h3 className="text-xs font-mono text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-red-500/20 pb-2">
             <AlertTriangle size={14} className="text-red-400" />
             Atención Requerida (&lt; 3.5)
           </h3>
           <div className="space-y-3">
             {underPerformers.length > 0 ? underPerformers.map(p => (
               <div key={p.id} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold font-mono">
                     {p.bio_memoria?.score_total?.toFixed(1) || p.rating?.toFixed(1) || '0.0'}
                   </div>
                   <div>
                     <div className="text-xs text-white uppercase tracking-widest">{p.nombre || 'Prestador Alerta'}</div>
                     <div className="text-[10px] text-white/50">{p.bio_memoria?.servicios_exitosos || 0} Servicios</div>
                   </div>
                 </div>
                 <button className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/40 transition-all">REVISAR</button>
               </div>
             )) : (
               <div className="text-[10px] text-white/40 uppercase tracking-widest p-2">Red operando en parámetros óptimos</div>
             )}
           </div>
        </div>

      </div>

      {/* DISPUTES / INCIDENTS */}
      <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-8">
        <div className="flex justify-between items-center mb-4 border-b border-purple-500/20 pb-2">
           <h3 className="text-xs font-mono text-purple-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldAlert size={14} className="text-purple-400" />
             Sistema de Disputas (Autoridad Soberana)
           </h3>
           <div className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
             {disputes.length} INCIDENCIAS PENDIENTES
           </div>
        </div>
        
        <div className="space-y-4">
          {disputes.length > 0 ? disputes.map(d => (
            <div key={d.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-widest bg-red-500/20 px-2 py-1 rounded text-red-500 flex items-center gap-1">
                    <Gavel size={12}/> {d.id}
                  </span>
                  <span className="text-[10px] text-white/50">{d.cliente} <strong className="text-purple-400 font-mono">VS</strong> {d.prestador}</span>
                </div>
                <div className="text-xs text-white/80 leading-relaxed mb-1">
                  <strong>Motivo:</strong> "{d.motivo}"
                </div>
                <div className="flex gap-4 text-[10px] font-mono text-white/40">
                  <span>RATING DEJADO: <strong className="text-red-400">{d.rating_dejado} ★</strong></span>
                  <span>PREVIO PRESTADOR: <strong className="text-amber-400">{d.prestador_score_previo} ★</strong></span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                 <button onClick={() => handleDisputeAction(d.id, 'sancion')} className="flex-1 uppercase tracking-widest text-[10px] bg-red-600/30 hover:bg-red-600 border border-red-500 p-2 rounded text-white transition-all text-center">
                   Aplicar Sanción
                 </button>
                 <button onClick={() => handleDisputeAction(d.id, 'descarta')} className="flex-1 uppercase tracking-widest text-[10px] bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500 p-2 rounded text-white transition-all text-center">
                   Descartar Queja
                 </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 border border-dashed border-white/5 rounded bg-white/5">
              <ShieldAlert size={24} className="mx-auto text-white/20 mb-2"/>
              <p className="text-[10px] uppercase text-white/40 tracking-widest">No hay disputas en la red</p>
            </div>
          )}
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
