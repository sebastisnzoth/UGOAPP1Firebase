import React from 'react';
import { cn } from '../lib/utils';
import { Map, Wallet, Calendar, History, User, Briefcase, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardNavigationProps {
  activeView: string;
  userId: string;
}

export default function DashboardNavigation({ activeView, userId }: DashboardNavigationProps) {
  const navigate = useNavigate();
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
    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-50 bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-6 rounded-full shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(`/${item.id}`)}
            className={cn(
              "group relative p-3 rounded-full transition-all duration-500 ease-out",
              isActive 
                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110" 
                : "text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            
            {/* Tooltip */}
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl translate-x-[-10px] group-hover:translate-x-0">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
