import React from 'react';
import { cn } from '../lib/utils';
import { Map, Wallet, Calendar, History, User, Briefcase, Shield } from 'lucide-react';

interface DashboardNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userId: string;
}

export default function DashboardNavigation({ activeView, onViewChange, userId }: DashboardNavigationProps) {
  const navItems = [
    { id: 'map', icon: Map, label: 'Radar' },
    { id: 'wallet', icon: Wallet, label: 'Bóveda' },
    { id: 'calendar', icon: Calendar, label: 'Agenda' },
    { id: 'history', icon: History, label: 'Historial' },
    { id: 'provider', icon: Briefcase, label: 'Proveedor' },
    { id: 'admin', icon: Shield, label: 'Admin' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="absolute right-4 top-6 bottom-6 w-16 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 flex flex-col items-center py-6 gap-4 z-40">
      <div className="text-quantum-cyan font-bold text-xl mb-2">Ω</div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isActive 
                ? "bg-quantum-cyan/10 text-quantum-cyan" 
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}
