import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Booking, ServiceStatus } from '../types';

export type BookingAction =
  | 'accept'
  | 'en_route'
  | 'start'
  | 'provider_finish'
  | 'client_confirm_work'
  | 'client_report_paid'
  | 'provider_confirm_payment'
  | 'cancel';

const transitions: Record<BookingAction, { from: ServiceStatus[]; to: ServiceStatus }> = {
  accept: { from: ['solicitado'], to: 'aceptado' },
  en_route: { from: ['aceptado'], to: 'en_camino' },
  start: { from: ['aceptado', 'en_camino'], to: 'en_curso' },
  provider_finish: { from: ['en_curso'], to: 'pendiente_confirmacion_cliente' },
  client_confirm_work: { from: ['pendiente_confirmacion_cliente'], to: 'pendiente_pago' },
  client_report_paid: { from: ['pendiente_pago'], to: 'pago_informado' },
  provider_confirm_payment: { from: ['pago_informado'], to: 'cerrado' },
  cancel: { from: ['solicitado', 'aceptado', 'en_camino'], to: 'cancelado' },
};

const transitionTimestampField: Partial<Record<BookingAction, string>> = {
  accept: 'acceptedAt',
  en_route: 'enRouteAt',
  start: 'startedAt',
  provider_finish: 'providerFinishedAt',
  client_confirm_work: 'clientConfirmedAt',
  client_report_paid: 'paidReportedAt',
  provider_confirm_payment: 'closedAt',
  cancel: 'cancelledAt',
};

export interface CreateBookingInput {
  clienteId: string;
  clienteNombre: string;
  proveedorId: string;
  proveedorNombre: string;
  servicio: string;
  categoria?: string;
  monto: number;
  precioHora?: number;
  scheduledFor?: Date | null;
  location?: { latitude: number; longitude: number } | null;
}

export async function createBooking(input: CreateBookingInput) {
  return addDoc(collection(db, 'bookings'), {
    ...input,
    estado_servicio: 'solicitado' satisfies ServiceStatus,
    paymentMethod: 'efectivo',
    paymentStatus: 'pendiente',
    scheduledFor: input.scheduledFor || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function transitionBooking(
  bookingId: string,
  action: BookingAction,
  actorId: string
): Promise<ServiceStatus> {
  const transition = transitions[action];
  const bookingRef = doc(db, 'bookings', bookingId);

  const nextStatus = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('El pedido ya no existe.');

    const data = snapshot.data() as Booking;
    const currentStatus = data.estado_servicio;

    if (!transition.from.includes(currentStatus)) {
      throw new Error(`Transición inválida: ${currentStatus} → ${transition.to}`);
    }

    const timestampField = transitionTimestampField[action];
    const patch: Record<string, unknown> = {
      estado_servicio: transition.to,
      updatedAt: serverTimestamp(),
      lastActorId: actorId,
    };

    if (timestampField) patch[timestampField] = serverTimestamp();
    if (action === 'client_report_paid') patch.paymentStatus = 'informado';
    if (action === 'provider_confirm_payment') patch.paymentStatus = 'confirmado';

    transaction.update(bookingRef, patch);
    return transition.to;
  });

  return nextStatus;
}

export async function sendBookingNotification(
  booking: Booking,
  actorId: string,
  targetUserId: string,
  title: string,
  message: string,
  type: 'message' | 'service' | 'payment' = 'service'
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      bookingId: booking.id,
      actorId,
      userId: targetUserId,
      title,
      message,
      type,
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn('No se pudo guardar la notificación del pedido:', error);
  }
}

function mapBookings(snapshot: any): Booking[] {
  return snapshot.docs.map((bookingDoc: any) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  })) as Booking[];
}

export function subscribeToClientBookings(clientId: string, callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, 'bookings'), where('clienteId', '==', clientId));
  return onSnapshot(q, (snapshot) => callback(mapBookings(snapshot)));
}

export function subscribeToProviderBookings(providerId: string, callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, 'bookings'), where('proveedorId', '==', providerId));
  return onSnapshot(q, (snapshot) => callback(mapBookings(snapshot)));
}

export function bookingTimeValue(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function sortBookingsNewestFirst(bookings: Booking[]) {
  return [...bookings].sort((a, b) => bookingTimeValue(b.createdAt) - bookingTimeValue(a.createdAt));
}

export const CLOSED_SERVICE_STATUSES = new Set<ServiceStatus>(['cerrado', 'cancelado']);
