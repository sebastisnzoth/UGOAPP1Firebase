import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Activity,
  BarChart3,
  MapPin,
  Mic,
  MicOff,
  Radio,
  ReceiptText,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import QuantumMap from './QuantumMap';
import type { Booking } from '../types';
import { bookingTimeValue } from '../services/bookingService';

const FLORIANOPOLIS = { lat: -27.5945, lng: -48.5477 };

export default function AdminPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [logs, setLogs] = useState<string[]>(['> UGO ADMIN ONLINE', '> FIRESTORE REALTIME: CONECTANDO...']);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        setBookings(snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() })) as Booking[]);
      },
      (error) => setLogs((current) => [...current, `> ERROR BOOKINGS: ${error.message}`])
    );

    const unsubProviders = onSnapshot(
      collection(db, 'profiles_providers'),
      (snapshot) => {
        setProviders(snapshot.docs.map((providerDoc) => ({ id: providerDoc.id, ...providerDoc.data() })));
      },
      (error) => setLogs((current) => [...current, `> ERROR RADAR: ${error.message}`])
    );

    const unsubProfiles = onSnapshot(
      collection(db, 'profiles'),
      (snapshot) => setUserCount(snapshot.size),
      (error) => setLogs((current) => [...current, `> ERROR USERS: ${error.message}`])
    );

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        setLogs((current) => [...current, `> COMANDO: ${command}`]);
      };
    }

    return () => {
      unsubBookings();
      unsubProviders();
      unsubProfiles();
      recognitionRef.current?.stop();
    };
  }, []);

  const metrics = useMemo(() => {
    const activeStatuses = new Set([
      'solicitado',
      'aceptado',
      'en_camino',
      'en_curso',
      'pendiente_confirmacion_cliente',
      'pendiente_pago',
      'pago_informado',
    ]);

    return {
      volumenCerrado: bookings
        .filter((booking) => booking.estado_servicio === 'cerrado')
        .reduce((total, booking) => total + Number(booking.monto || 0), 0),
      serviciosActivos: bookings.filter((booking) => activeStatuses.has(booking.estado_servicio)).length,
      prestadoresOnline: providers.filter((provider) => provider.disponible === true).length,
      usuariosRegistrados: userCount,
    };
  }, [bookings, providers, userCount]);

  const servicesStats = useMemo(() => {
    const pending = bookings.filter((booking) =>
      ['solicitado', 'aceptado', 'en_camino'].includes(booking.estado_servicio)
    ).length;
    const active = bookings.filter((booking) =>
      ['en_curso', 'pendiente_confirmacion_cliente', 'pendiente_pago', 'pago_informado'].includes(
        booking.estado_servicio
      )
    ).length;
    const completed = bookings.filter((booking) => booking.estado_servicio === 'cerrado').length;
    const cancelled = bookings.filter((booking) => booking.estado_servicio === 'cancelado').length;

    return [
      { name: 'Pendientes', value: pending, color: '#eab308' },
      { name: 'Activos', value: active, color: '#06b6d4' },
      { name: 'Cerrados', value: completed, color: '#10b981' },
      { name: 'Cancelados', value: cancelled, color: '#ef4444' },
    ];
  }, [bookings]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date),
        servicios: 0,
        volumen: 0,
      };
    });

    const byDay = new Map(days.map((day) => [day.key, day]));

    bookings.forEach((booking) => {
      const timestamp = bookingTimeValue(booking.createdAt);
      if (!timestamp) return;
      const key = new Date(timestamp).toISOString().slice(0, 10);
      const day = byDay.get(key);
      if (!day) return;
      day.servicios += 1;
      if (booking.estado_servicio === 'cerrado') day.volumen += Number(booking.monto || 0);
    });

    return days;
  }, [bookings]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setLogs((current) => [...current, '> VOZ NO DISPONIBLE EN ESTE NAVEGADOR']);
      return;
    }

    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();

    setIsListening((current) => !current);
  };

  return (
    <div className="h-full overflow-y-auto rounded-[2rem] border border-white/10 bg-[rgba(5,5,10,0.96)] p-5 text-white shadow-2xl backdrop-blur-2xl md:p-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quantum-cyan">UGO Admin</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Centro de comando</h2>
          <p className="mt-1 text-sm text-white/40">Datos reales de Firebase, sin proveedores ni métricas ficticias.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Desactivar voz' : 'Activar voz'}
            className={`rounded-full border p-2.5 ${
              isListening
                ? 'border-red-500/40 bg-red-500/15 text-red-300'
                : 'border-white/10 bg-white/5 text-white/60'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Realtime</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Volumen cerrado"
          value={`R$ ${metrics.volumenCerrado.toFixed(2)}`}
          icon={ReceiptText}
        />
        <MetricCard label="Servicios activos" value={metrics.serviciosActivos} icon={Activity} />
        <MetricCard label="Prestadores online" value={metrics.prestadoresOnline} icon={Radio} />
        <MetricCard label="Usuarios" value={metrics.usuariosRegistrados} icon={Users} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-80 rounded-2xl border border-white/8 bg-black/35 p-4 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
            <BarChart3 size={16} className="text-quantum-cyan" />
            Últimos 7 días
          </div>
          <div className="h-[calc(100%-2rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="servicios" name="Pedidos" stroke="#8b5cf6" fill="#8b5cf633" />
                <Area yAxisId="right" type="monotone" dataKey="volumen" name="Volumen cerrado" stroke="#06b6d4" fill="#06b6d433" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="h-80 rounded-2xl border border-white/8 bg-black/35 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Distribución</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={servicesStats} dataKey="value" innerRadius={55} outerRadius={76} paddingAngle={4}>
                  {servicesStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {servicesStats.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-[10px]">
                <span className="flex items-center gap-2 text-white/55">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.color }} />
                  {stat.name}
                </span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 h-96 overflow-hidden rounded-2xl border border-white/10">
        <div className="pointer-events-none absolute z-[400] m-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-quantum-cyan backdrop-blur-xl">
          <MapPin size={13} /> Radar Florianópolis
        </div>
        <QuantumMap
          center={FLORIANOPOLIS}
          providers={providers.filter((provider) => {
            const lat = Number(provider.latitude ?? provider.lat);
            const lng = Number(provider.longitude ?? provider.lng);
            return !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
          })}
        />
      </div>

      <div className="rounded-2xl border border-white/8 bg-black/45 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-quantum-cyan">Sistema</p>
        <div className="h-32 space-y-1.5 overflow-y-auto font-mono text-[11px] text-emerald-300/70 no-scrollbar">
          {logs.map((log, index) => (
            <p key={`${index}-${log}`}>{log}</p>
          ))}
          <p>&gt; BOOKINGS: {bookings.length}</p>
          <p>&gt; PROVIDERS RADAR: {providers.length}</p>
          <p>&gt; USERS: {userCount}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
        <Icon size={15} className="text-quantum-cyan" />
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
