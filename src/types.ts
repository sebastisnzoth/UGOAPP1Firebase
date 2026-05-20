export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'service' | 'payment';
  read: boolean;
  timestamp: any;
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
  timestamp: any; // Using any for Firestore timestamp
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

export interface UserProfile {
  uid: string;
  nombre: string;
  foto?: string;
  bio?: string;
  rating?: number;
  rol: 'cliente' | 'proveedor' | 'admin';
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
