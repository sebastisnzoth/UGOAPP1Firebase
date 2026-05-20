import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { Wallet, Star, Navigation, CheckCircle2 } from 'lucide-react';

export default function ProviderDashboard({ providerId }: { providerId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Profile Form state
  const [tarifa, setTarifa] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Wallet State
  const [balance, setBalance] = useState(0);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  useEffect(() => {
    // Load profile
    const unsubsProfile = onSnapshot(doc(db, 'profiles', providerId), (docSnap) => {
      if(docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setTarifa(data.tarifa_hora?.toString() || '');
        setEspecialidad(data.especialidad || '');
        setDisponible(data.disponible || false);
        setBalance(data.saldo_disponible || 0);
      }
    });

    // Load active contracts
    const qActive = query(
      collection(db, 'contratos'),
      where('prestador_id', '==', providerId),
    );
    const unsubsActive = onSnapshot(qActive, (snap) => {
      setActiveServices(snap.docs.map(d => ({id: d.id, ...d.data()}) as any).filter((s: any) => s.estado === 'en_curso' || s.estado === 'bloqueado' || s.estado === 'en_camino' || s.estado === 'solicitado'));
    });

    // Load payment history
    const qHistory = query(
      collection(db, 'pagos'),
      where('prestador_id', '==', providerId),
      orderBy('fecha', 'desc')
    );
    
    getDocs(qHistory).then(snap => {
      setHistory(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }).catch(e => console.warn("Failed to get pagos:", e));

    return () => {
      unsubsProfile();
      unsubsActive();
    };
  }, [providerId]);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', providerId), {
        tarifa_hora: Number(tarifa),
        especialidad: especialidad,
        disponible: disponible
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const requestWithdrawal = async () => {
    if (balance <= 0) return;
    setRequestingWithdrawal(true);
    try {
      await addDoc(collection(db, 'liquidaciones'), {
        prestador_id: providerId,
        monto: balance,
        estado: 'REVISION_SOBERANO',
        fecha: new Date(),
        tipo: 'RETIRO'
      });
      
      // Optimizacion: Reducir saldo localmente o esperar que Cloud Function lo haga.
      // Para efectos demostrativos en U.G.O, descontamos el saldo
      await updateDoc(doc(db, 'profiles', providerId), {
        saldo_disponible: 0
      });
      setBalance(0);
    } catch (e) {
      console.error(e);
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  return (
    <div className="h-full bg-[rgba(5,5,10,0.95)] backdrop-blur-2xl border-r border-[rgba(0,212,255,0.2)] shadow-2xl p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase border-b border-white/10 pb-4">
        Radar Soberano <span className="text-cyan-400">Prestador</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Management */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${disponible ? 'bg-cyan-500 shadow-[0_0_15px_#00f2ff]' : 'bg-gray-600'}`}></div>
            <h3 className="text-lg font-bold mb-4 text-cyan-400 uppercase tracking-widest">Estado y Operaciones</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-lg">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${disponible ? 'bg-cyan-400 shadow-[0_0_10px_#00f2ff] animate-pulse' : 'bg-gray-600'}`}></div>
                   <span className={`text-sm font-bold uppercase tracking-widest ${disponible ? 'text-cyan-400' : 'text-gray-500'}`}>
                     {disponible ? 'Radar Encendido' : 'Radar Apagado'}
                   </span>
                 </div>
                 <button 
                   onClick={() => {
                     setDisponible(!disponible);
                     updateDoc(doc(db, 'profiles', providerId), { disponible: !disponible });
                   }}
                   className={`px-4 py-2 border rounded font-mono text-xs uppercase tracking-widest transition-all ${disponible ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'}`}
                 >
                   {disponible ? 'Desconectar' : 'Conectar'}
                 </button>
              </div>

              <div>
                 <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Especialidad</label>
                 <input 
                    type="text" 
                    value={especialidad} 
                    onChange={(e) => setEspecialidad(e.target.value)}
                    className="bg-black/50 border border-cyan-500/30 text-white rounded p-3 w-full focus:outline-none focus:border-cyan-400 font-mono text-sm"
                    placeholder="Ej. Electricista, Plomero"
                 />
              </div>

              <div>
                 <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Tarifa por Hora (USD)</label>
                 <input 
                    type="number" 
                    value={tarifa} 
                    onChange={(e) => setTarifa(e.target.value)}
                    className="bg-black/50 border border-cyan-500/30 text-white rounded p-3 w-full focus:outline-none focus:border-cyan-400 font-mono text-sm"
                 />
              </div>
              
              <button 
                onClick={saveProfile} 
                disabled={isSaving}
                className="bg-cyan-900/50 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 font-mono text-xs tracking-widest uppercase w-full py-3 rounded mt-4 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Sincronizando...' : 'Actualizar Datos'}
              </button>
            </div>
          </div>

          {/* Reputation / Bio Memoria */}
          <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Star size={18} className="fill-amber-400" /> Bio Memoria (Hugo)
              </h3>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-5xl font-urbanist font-bold text-amber-400 leading-none">
                  {profile?.rating?.toFixed(1) || '5.0'}
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-400 mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-amber-400" />)}
                  </div>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Nivel Diamante</span>
                </div>
              </div>
              <p className="text-[10px] text-white/70 leading-relaxed border-t border-white/10 pt-3">
                Tu excelente puntuación le indica a Hugo que debe **priorizarte** en el algoritmo de asignación de servicios. Sigue así.
              </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* Mini Wallet / Liquidez */}
           <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-black/80 border-emerald-500/20">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Wallet size={18}/> Bóveda Personal
                </h3>
              </div>
              
              <div className="mb-6">
                <div className="text-xs uppercase tracking-widest text-white/60 mb-1">Saldo Disponible</div>
                <div className="text-4xl font-urbanist text-white font-bold tracking-tight">
                  <span className="text-emerald-500 mr-1">$</span>
                  {balance.toFixed(2)}
                </div>
              </div>

              <button 
                onClick={requestWithdrawal}
                disabled={requestingWithdrawal || balance <= 0}
                className="w-full py-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold tracking-widest uppercase rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono"
              >
                {requestingWithdrawal ? 'Procesando...' : 'Solicitar Liquidación a Soberano'}
              </button>

              {history.length > 0 && (
                 <div className="mt-6 border-t border-white/5 pt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Últimas Liquidaciones</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {history.slice(0,3).map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                           <span className="text-[10px] uppercase text-white/60 font-mono">
                             {p.fecha?.toDate?.().toLocaleDateString() || 'Reciente'}
                           </span>
                           <span className="text-[10px] text-emerald-400 font-mono font-bold">
                             +${p.monto?.toFixed(2)}
                           </span>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
           </div>

           {/* Active Services */}
           <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 text-cyan-400 uppercase tracking-widest flex items-center justify-between">
                Misiones Activas
                <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">{activeServices.length}</span>
              </h3>
              {activeServices.length > 0 ? (
                 <div className="space-y-3">
                    {activeServices.map(s => (
                      <div key={s.id} className="pe-4 pt-4 pb-4 border-l-2 border-cyan-500 pl-4 bg-[rgba(0,212,255,0.05)] rounded-r-lg">
                         <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-white font-mono text-sm uppercase tracking-widest">
                             {s.servicio_ruta || 'Servicio'} <span className="text-white/40">#{s.id.slice(0,4)}</span>
                           </span>
                           <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1">
                             <Navigation size={10} /> {s.estado}
                           </span>
                         </div>
                         <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-cyan-500" /> Fondos en Escrow
                            </span>
                            <span className="text-sm text-white font-mono font-bold">$ {s.monto_total?.toFixed(2) || '0.00'}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-lg bg-white/5">
                    <Navigation size={24} className="mx-auto text-white/20 mb-2" />
                    <p className="text-white/40 text-sm font-mono tracking-widest uppercase mb-1">Radar Limpio</p>
                    <p className="text-[10px] text-white/20 uppercase">A la espera de asignaciones de Hugo</p>
                  </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
