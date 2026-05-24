import React, { useState, useEffect } from 'react';
import { getWallet, addFunds, subscribeToTransactions, createWallet } from '../services/walletService';
import { Wallet, Transaction } from '../types';
import { Wallet as WalletIcon, PlusCircle, History } from 'lucide-react';

interface WalletViewProps {
  userId: string;
}

export default function WalletView({ userId }: WalletViewProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      let w = await getWallet(userId);
      if (!w) {
        await createWallet(userId);
        w = { userId, balance: 0 };
      }
      setWallet(w);
    };
    fetchData();

    const unsubscribe = subscribeToTransactions(userId, setTransactions, (error) => {
      console.error('Error in subscribeToTransactions:', error);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleAddFunds = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    await addFunds(userId, val);
    setAmount('');
    setWallet(w => w ? {...w, balance: w.balance + val} : null);
  };

  return (
    <div className="bg-quantum-card p-6 rounded-2xl border border-white/10 space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="text-quantum-cyan" />
        <h2 className="text-xl font-bold text-white">Minha Carteira</h2>
      </div>
      
      <div className="bg-quantum-dark p-4 rounded-xl border border-quantum-cyan/20">
        <p className="text-sm text-white/50">Saldo Disponível</p>
        <p className="text-3xl font-bold text-quantum-cyan">R$ {wallet?.balance.toFixed(2) || '0.00'}</p>
      </div>

      <div className="flex gap-2">
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Valor"
          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white"
        />
        <button onClick={handleAddFunds} className="bg-quantum-cyan text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <PlusCircle size={18} /> Adicionar
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-white font-bold"> <History size={16}/> Histórico</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between text-sm bg-white/5 p-2 rounded">
              <span className="text-white">{t.description}</span>
              <span className={t.amount > 0 ? "text-green-400" : "text-red-400"}>
                {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
