export interface Notification {
  id: string;
  userId: string;
  bookingId?: string;
  actorId?: string;
  title: string;
  message: string;
  type: 'message' | 'service' | 'payment';
  read: boolean;
  timestamp: any;
}

export type ServiceStatus =
  | 'solicitado'
  | 'aceptado'
  | 'en_camino'
  | 'en_curso'
  | 'pendiente_confirmacion_cliente'
  | 'pendiente_pago'
  | 'pago_informado'
  | 'cerrado'
  | 'cancelado';

export type PaymentStatus = 'pendiente' | 'informado' | 'confirmado';
export type PaymentMethod = 'efectivo' | 'mercado_pago';

export interface Booking {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  proveedorId: string;
  proveedorNombre?: string;
  servicio: string;
  categoria?: string;
  monto: number;
  precioHora?: number;
  estado_servicio: ServiceStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  scheduledFor?: any;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  createdAt: any;
  updatedAt?: any;
  acceptedAt?: any;
  enRouteAt?: any;
  startedAt?: any;
  providerFinishedAt?: any;
  clientConfirmedAt?: any;
  paidReportedAt?: any;
  closedAt?: any;
  cancelledAt?: any;
  lastActorId?: string;
}

export interface Contract {
  id: string;
  providerId: string;
  clientId: string;
  amount: number;
  status: 'bloqueado' | 'en_progreso' | 'completado' | 'disputa';
  milestoneVerified: boolean;
  service: string;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
}

export interface Review {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Appointment {
  id: string;
  providerId: string;
  clientId: string;
  date: any;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  service: string;
}

export type UserRole = 'cliente' | 'proveedor' | 'administrador';

export interface UserProfile {
  uid: string;
  nombre: string;
  email?: string;
  foto?: string;
  bio?: string;
  role: UserRole;
  disponible?: boolean;
  karma: number;
  bio_memoria?: {
    score_total: number;
    servicios_exitosos: number;
    preferencias?: string[];
  } | string;
}

export interface HugoResponse {
  hugo_mensaje: string;
  accion:
    | 'NEGOCIAR_PROVEEDOR'
    | 'PROPONER_CIERRE'
    | 'CONFIRMAR_EMERGENCIA'
    | 'MEMORIA_CONSULTA'
    | 'REGISTRAR_NUEVO_GOOGLE'
    | 'RECOCAR_SUPERADMIN';
  ui_action:
    | 'LOGIN_SCREEN'
    | 'CLIENT_DASHBOARD'
    | 'PROVIDER_DASHBOARD'
    | 'ADMIN_DASHBOARD'
    | 'ACTIVE_SERVICE'
    | 'CHECKOUT';
  ui_data: {
    rol_actual: UserRole | 'ninguno';
    karma_usuario: number;
    estado_boveda: 'ESPERANDO' | 'ASEGURADA' | 'LIBERADA_HITOS';
    monto_acordado?: number;
    mapa_seguimiento: {
      activo: boolean;
      eta_llegada: string | null;
    };
  };
  datos_sistema?: {
    servicio_solicitado: string | null;
    fecha_hora_solicitada: string | null;
  };
}

export interface Wallet {
  userId: string;
  balance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'service_payment' | 'withdrawal';
  description: string;
  timestamp: any;
}
