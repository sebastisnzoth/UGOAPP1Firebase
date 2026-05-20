import React, { useState, useEffect } from 'react';
import { subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';
import { Notification } from '../types';
import { Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, setNotifications);
    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-quantum-cyan transition-all text-white/80 hover:text-quantum-cyan relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-quantum-card border border-white/10 rounded-2xl p-4 shadow-xl z-50">
          <h3 className="text-white font-bold mb-3">Notificaciones</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={cn("p-3 rounded-lg border border-white/5", n.read ? "bg-white/5" : "bg-quantum-cyan/10")}
                onClick={() => markNotificationAsRead(n.id)}
              >
                <h4 className="text-sm font-bold text-white">{n.title}</h4>
                <p className="text-xs text-white/70">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
