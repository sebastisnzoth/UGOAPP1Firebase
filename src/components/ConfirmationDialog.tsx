import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Zap } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  providerName: string;
  cost: number;
  onConfirm: (scheduledFor: Date | null) => void;
  onCancel: () => void;
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ConfirmationDialog({
  isOpen,
  providerName,
  cost,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [mode, setMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledValue, setScheduledValue] = useState('');

  const minimumDate = useMemo(() => toLocalInputValue(new Date()), [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMode('now');
      setScheduledValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scheduledDate = scheduledValue ? new Date(scheduledValue) : null;
  const validSchedule =
    mode === 'now' ||
    (scheduledDate != null &&
      !Number.isNaN(scheduledDate.getTime()) &&
      scheduledDate.getTime() > Date.now());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-quantum-dark p-6 text-white shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-quantum-cyan">Nuevo pedido</p>
        <h2 className="mt-1 text-xl font-bold">Confirmar contratación</h2>

        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Profesional: <strong className="text-white">{providerName}</strong>
        </p>
        <p className="mt-1 text-sm text-white/65">
          Tarifa estimada: <span className="font-bold text-quantum-cyan">R$ {cost.toFixed(2)}/h</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('now')}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
              mode === 'now'
                ? 'border-quantum-cyan bg-quantum-cyan/15 text-quantum-cyan'
                : 'border-white/10 bg-white/5 text-white/55'
            }`}
          >
            <Zap size={16} /> Ahora
          </button>
          <button
            type="button"
            onClick={() => setMode('scheduled')}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
              mode === 'scheduled'
                ? 'border-quantum-cyan bg-quantum-cyan/15 text-quantum-cyan'
                : 'border-white/10 bg-white/5 text-white/55'
            }`}
          >
            <CalendarClock size={16} /> Agendar
          </button>
        </div>

        {mode === 'scheduled' && (
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
              Fecha y hora
            </span>
            <input
              type="datetime-local"
              min={minimumDate}
              value={scheduledValue}
              onChange={(event) => setScheduledValue(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-quantum-cyan/60"
            />
            {!validSchedule && scheduledValue && (
              <p className="mt-2 text-xs text-amber-300">Elegí una fecha futura.</p>
            )}
          </label>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/12"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!validSchedule}
            onClick={() => onConfirm(mode === 'scheduled' ? scheduledDate : null)}
            className="flex-1 rounded-2xl bg-quantum-cyan px-4 py-3 text-sm font-bold text-black shadow-[0_0_10px_rgba(0,242,255,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-white/30">
          Forma de pago predeterminada: efectivo. El método de pago no bloquea la creación del pedido.
        </p>
      </div>
    </div>
  );
}
