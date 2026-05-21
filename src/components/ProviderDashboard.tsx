import React from 'react';

export default function ProviderDashboard({ providerId }: { providerId: string }) {
  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-4">Painel do Provedor</h2>
      <div className="glass-panel p-6 rounded-2xl">
        <p>Aqui você pode aceitar novos serviços e gerenciar sua agenda.</p>
        <button className="mt-4 bg-quantum-cyan text-black px-4 py-2 rounded-lg font-bold">
          Verificar Novos Chamados
        </button>
      </div>
    </div>
  );
}
