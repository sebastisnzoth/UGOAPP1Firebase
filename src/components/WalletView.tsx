import { useEffect, useState } from 'react';
import { createWallet, getWallet, subscribeToTransactions } from '../services/walletService';
import type { Transaction, Wallet } from '../types';
import { History, LockKeyhole, Wallet as WalletIcon } from 'lucide-react';

interface WalletViewProps {
  userId: string;
}

export default function WalletView({ userId }: WalletViewProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        let currentWallet = await getWallet(userId);
        if (!currentWallet) {
          await createWallet(userId);
          currentWallet = { userId, balance: 0 };
        }
        if (active) setWallet(currentWallet);
      } catch (error) {
        console.error('Error loading wallet:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    const unsubscribe = subscribeToTransactions(
      userId,
      setTransactions,
      (error) => console.error('Error in subscribeToTransactions:', error)
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-quantum-card p-5 text-white shadow-2xl md:p-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="text-quantum-cyan" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-quantum-cyan">Bóveda UGO</p>
          <h2 className="text-xl font-bold">Saldo y movimientos</h2>
        </div>
      </div>

      <div className="rounded-2xl border border-quantum-cyan/20 bg-quantum-dark p-5">
        <p className="text-sm text-white/45">Saldo disponible</p>
        <p className="mt-1 text-3xl font-bold text-quantum-cyan">
          {loading ? '…' : `R$ ${(wallet?.balance ?? 0).toFixed(2)}`}
        </p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
        <LockKeyhole className="mt-0.5 shrink-0 text-white/55" size={19} />
        <div>
          <p className="text-sm font-semibold">Saldo protegido</p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            El saldo no puede modificarse desde el navegador. Las cargas y liberaciones deben entrar por el flujo de pago seguro de UGO.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-bold">
          <History size={16} /> Histórico
        </h3>

        <div className="max-h-72 space-y-2 overflow-y-auto no-scrollbar">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm">
                <span className="min-w-0 truncate text-white/80">{transaction.description}</span>
                <span className={transaction.amount > 0 ? 'shrink-0 text-green-400' : 'shrink-0 text-red-400'}>
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">
              Todavía no hay movimientos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
