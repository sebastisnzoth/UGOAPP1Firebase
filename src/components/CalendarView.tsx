import React, { useState, useEffect } from 'react';
import { subscribeToAppointments } from '../services/appointmentService';
import { getGoogleCalendarEvents, createGoogleCalendarEvent } from '../services/googleCalendarService';
import { Appointment } from '../types';
import { Calendar, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { cachedAccessToken, signInWithGoogle } from '../firebase';

interface CalendarViewProps {
  userId: string;
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAppointments(userId, setAppointments);
    return () => unsubscribe();
  }, [userId]);

  const loadGoogleEvents = async () => {
    if (!cachedAccessToken) {
      await signInWithGoogle();
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getGoogleCalendarEvents();
      setGoogleEvents(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load Google Calendar events. You might need to sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToGoogle = async (appointment: Appointment) => {
    if (!cachedAccessToken) {
      await signInWithGoogle();
    }

    const confirmed = window.confirm(`Generate a Google Calendar event for ${appointment.service}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const startTime = appointment.date.toDate();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      await createGoogleCalendarEvent(
        `U.G.O: ${appointment.service}`,
        `Serviço agendado via U.G.O Quantum OS. Status: ${appointment.status}`,
        startTime.toISOString(),
        endTime.toISOString()
      );
      await loadGoogleEvents(); // refresh list
    } catch (err: any) {
       console.error(err);
       setError('Failed to sync to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedAccessToken) {
      loadGoogleEvents();
    }
  }, []);

  return (
    <div className="bg-quantum-card p-6 rounded-2xl border border-white/10 space-y-4 max-h-[80vh] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-quantum-cyan" />
          <h2 className="text-xl font-bold text-white">Agendamentos</h2>
        </div>
        <button 
          onClick={loadGoogleEvents} 
          className="text-xs flex items-center gap-2 bg-quantum-cyan/10 hover:bg-quantum-cyan/20 px-3 py-1.5 rounded-full text-quantum-cyan transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Google Calendar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-2 text-red-400 text-sm items-center">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {/* App Appointments */}
        <div>
          <h3 className="text-xs uppercase text-white/50 font-bold mb-2 tracking-wider">Serviços U.G.O</h3>
          {appointments.length === 0 ? (
            <p className="text-white/40 text-sm italic">Nenhum serviço agendado.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map(a => (
                <div key={a.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5 group hover:border-quantum-cyan/30 transition-colors">
                  <div>
                    <p className="text-white font-bold">{a.service}</p>
                    <p className="text-sm text-white/50">{new Date(a.date.toDate()).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {a.status}
                    </span>
                    <button 
                      onClick={() => handleSyncToGoogle(a)}
                      title="Sincronizar com Google Calendar"
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-quantum-cyan/10 text-quantum-cyan rounded-full hover:bg-quantum-cyan hover:text-black transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google Calendar Events */}
        <div>
           <h3 className="text-xs uppercase text-white/50 font-bold mb-2 tracking-wider">Próximos em Google Calendar</h3>
           {googleEvents.length === 0 ? (
            <p className="text-white/40 text-sm italic">Sem eventos no calendário.</p>
          ) : (
            <div className="space-y-2">
              {googleEvents.map(event => (
                <div key={event.id} className="bg-blue-500/5 p-3 rounded-xl flex flex-col gap-1 border border-blue-500/10">
                  <p className="text-blue-100 font-medium text-sm">{event.summary || '(Sem Titulo)'}</p>
                  <p className="text-xs text-blue-200/50">
                    {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
