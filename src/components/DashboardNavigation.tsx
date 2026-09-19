import { Map, Wallet, Calendar, History, User, Briefcase, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import type { UserRole } from '../lib/auth';

interface DashboardNavigationProps {
  activeView: string;
  userRole: UserRole | null;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'map', icon: Map, label: 'Radar' },
  { id: 'wallet', icon: Wallet, label: 'Bóveda' },
  { id: 'calendar', icon: Calendar, label: 'Agenda' },
  { id: 'history', icon: History, label: 'Historial' },
  { id: 'provider', icon: Briefcase, label: 'Proveedor' },
  { id: 'admin', icon: Shield, label: 'Admin' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

const allowedViews: Record<UserRole, string[]> = {
  cliente: ['map', 'wallet', 'calendar', 'history', 'profile'],
  proveedor: ['provider', 'wallet', 'calendar', 'history', 'profile'],
  administrador: ['admin', 'map', 'provider', 'wallet', 'calendar', 'history', 'profile'],
};

export default function DashboardNavigation({ activeView, userRole, onNavigate }: DashboardNavigationProps) {
  const visibleItems = navItems.filter((item) => {
    if (!userRole) return item.id === 'map' || item.id === 'profile';
    return allowedViews[userRole].includes(item.id);
  });

  return (
    <nav
      aria-label="Navegación principal"
      className="absolute z-[70] bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-row items-center gap-1 overflow-x-auto rounded-3xl border border-white/10 bg-black/75 px-2 py-2 shadow-2xl backdrop-blur-2xl no-scrollbar md:bottom-auto md:left-6 md:top-1/2 md:max-w-none md:-translate-x-0 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-full md:px-2 md:py-4"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'group relative flex min-h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-300 md:rounded-full md:p-3',
              isActive
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)]'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
            <span className="mt-1 max-w-14 truncate text-[9px] font-semibold md:hidden">{item.label}</span>
            <span className="pointer-events-none absolute left-full top-1/2 ml-4 hidden -translate-y-1/2 translate-x-[-8px] whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100 md:block">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
