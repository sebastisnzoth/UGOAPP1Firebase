import React, { useState, useEffect } from 'react';
import { subscribeToAppointments } from '../services/appointmentService';
import { Appointment } from '../types';
import { Calendar } from 'lucide-react';

interface CalendarViewProps {
  userId: string;
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAppointments(userId, setAppointments);
    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="bg-quantum-card p-6 rounded-2xl border border-white/10 space-y-4">
      <div className="flex items-center gap-3">
        <Calendar className="text-quantum-cyan" />
        <h2 className="text-xl font-bold text-white">Meus Agendamentos</h2>
      </div>
      
      <div className="space-y-3">
        {appointments.map(a => (
          <div key={a.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5">
            <div>
              <p className="text-white font-bold">{a.service}</p>
              <p className="text-sm text-white/50">{new Date(a.date.toDate()).toLocaleDateString()}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
