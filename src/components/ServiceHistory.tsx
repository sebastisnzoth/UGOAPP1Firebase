import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { format } from 'date-fns';

interface ServiceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Contract {
  id: string;
  proveedorNombre?: string;
  categoria?: string;
  estado: string;
  monto?: number;
  precio?: number;
  createdAt?: any;
  fotoProveedor?: string;
}

export default function ServiceHistory({ isOpen, onClose, userId }: ServiceHistoryProps) {
  const [history, setHistory] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    setLoading(true);
    const contratosRef = collection(db, 'contratos');
    // Using a simpler query to avoid requiring complex composite indexes immediately.
    // If the collection is large, we might need a composite index on clienteId and createdAt.
    const q = query(
      contratosRef, 
      where('clientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contract[];
      
      setHistory(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching history", err);
      handleFirestoreError(err, OperationType.GET, 'contratos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, userId]);

  const getStatusConfig = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'COMPLETADO':
      case 'FINALIZADO':
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'Completado' };
      case 'CANCELADO':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'Cancelado' };
      case 'NEGOCIANDO':
      case 'PENDIENTE':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'Pendiente' };
      case 'ACTIVO':
      case 'EN_CURSO':
      case 'ACEPTADO':
      case 'ASEGURADA': // Escrow state
        return { icon: AlertCircle, color: 'text-quantum-cyan', bg: 'bg-quantum-cyan/10', border: 'border-quantum-cyan/30', text: 'Ativo' };
      default:
        return { icon: Clock, color: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10', text: estado || 'Desconhecido' };
    }
  };

  const handleClose = () => {
    setSelectedContract(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-quantum-card/95 backdrop-blur-2xl border-l border-white/10 z-50 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="text-quantum-cyan" size={24} />
                  Histórico de Serviços
                </h2>
                <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">Resumo de Atividades</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/50 space-y-4">
                  <div className="w-8 h-8 rounded-full border-2 border-quantum-cyan border-t-transparent animate-spin" />
                  <p className="text-sm">Buscando histórico quantico...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Clock size={24} className="text-white/30" />
                  </div>
                  <h3 className="text-white font-bold mb-1">Nenhum serviço</h3>
                  <p className="text-white/40 text-sm font-light">Você ainda não solicitou nenhum serviço através do Hugo.</p>
                </div>
              ) : (
                history.map((contract) => {
                  const status = getStatusConfig(contract.estado);
                  const StatusIcon = status.icon;
                  const date = contract.createdAt?.toDate ? format(contract.createdAt.toDate(), "dd MMM, yyyy • HH:mm") : 'Data não disponível';
                  const amount = contract.monto || contract.precio || 0;

                  return (
                    <motion.div 
                      key={contract.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedContract(contract)}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={cn("px-2.5 py-1 rounded-full flex items-center gap-1.5 border text-[10px] font-bold tracking-wider uppercase", status.bg, status.border, status.color)}>
                          <StatusIcon size={12} />
                          {status.text}
                        </div>
                        <span className="text-xs font-mono text-white/40">{date}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shrink-0 bg-quantum-card flex items-center justify-center">
                          {contract.fotoProveedor ? (
                            <img src={contract.fotoProveedor} alt={contract.proveedorNombre || 'Provider'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white/50 font-bold text-lg">
                              {(contract.proveedorNombre || 'P').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-base truncate">{contract.proveedorNombre || 'Profissional Desconhecido'}</p>
                          <p className="text-white/50 text-xs truncate mb-1">{contract.categoria || 'Serviço Geral'}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-quantum-cyan font-bold">R$ {amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Details Modal (Slide in from bottom or appear in center) */}
          <AnimatePresence>
            {selectedContract && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4"
              >
                {/* Independent Backdrop for Modal inside Sidebar Context */}
                <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
                  onClick={() => setSelectedContract(null)} 
                />
                
                <div className="relative w-full max-w-sm bg-quantum-dark border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white">Detalhes do Serviço</h3>
                    <button 
                      onClick={() => setSelectedContract(null)}
                      className="p-2 bg-black/20 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="overflow-y-auto p-6 flex flex-col items-center">
                    {/* Provider Avatar */}
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 bg-quantum-cyan/20 rounded-full blur-xl"></div>
                      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-quantum-cyan/50 bg-quantum-card flex items-center justify-center shadow-lg">
                        {selectedContract.fotoProveedor ? (
                          <img src={selectedContract.fotoProveedor} alt={selectedContract.proveedorNombre || 'Provider'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-quantum-cyan text-3xl font-bold">
                            {(selectedContract.proveedorNombre || 'P').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white text-center mb-1">
                      {selectedContract.proveedorNombre || 'Profissional Desconhecido'}
                    </h2>
                    <p className="text-sm text-quantum-cyan uppercase tracking-widest font-bold mb-6">
                      {selectedContract.categoria || 'Serviço Geral'}
                    </p>
                    
                    <div className="w-full space-y-4">
                      {/* Status */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                        <span className="text-white/50 text-sm">Status Atual</span>
                        <div className={cn("px-3 py-1.5 rounded-full flex items-center gap-1.5 border text-xs font-bold tracking-wider uppercase shadow-sm", getStatusConfig(selectedContract.estado).bg, getStatusConfig(selectedContract.estado).border, getStatusConfig(selectedContract.estado).color)}>
                           <AlertCircle size={14} />
                           {getStatusConfig(selectedContract.estado).text}
                        </div>
                      </div>
                      
                      {/* Grid Data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                          <span className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Data da Solicitação</span>
                          <span className="text-white text-sm font-medium">
                            {selectedContract.createdAt?.toDate ? format(selectedContract.createdAt.toDate(), "dd/MM/yyyy") : 'N/A'}
                          </span>
                          <span className="text-white/40 text-xs">
                            {selectedContract.createdAt?.toDate ? format(selectedContract.createdAt.toDate(), "HH:mm") : ''}
                          </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                          <span className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Valor Total</span>
                          <span className="text-quantum-cyan text-lg font-bold">
                            R$ {(selectedContract.monto || selectedContract.precio || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* ID reference */}
                      <div className="mt-4 p-3 border border-white/5 rounded-xl bg-black/20 flex flex-col items-center justify-center">
                        <span className="text-white/30 text-[10px] uppercase mb-0.5">ID da Transação</span>
                        <span className="text-white/50 text-xs font-mono">{selectedContract.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
