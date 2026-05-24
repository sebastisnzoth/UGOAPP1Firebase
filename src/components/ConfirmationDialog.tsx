import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  providerName: string;
  cost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({ isOpen, providerName, cost, onConfirm, onCancel }: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-quantum-dark border border-white/10 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Confirmar contratação</h2>
        <p className="text-sm text-white/70 mb-2">Você tem certeza que deseja contratar <strong>{providerName}</strong>?</p>
        <p className="text-sm text-white/70 mb-6">Custo estimado: <span className="font-bold text-quantum-cyan">R$ {cost}/h</span></p>
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-quantum-cyan hover:bg-quantum-cyan/80 text-black font-bold text-sm transition-all shadow-[0_0_10px_rgba(0,242,255,0.4)]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
