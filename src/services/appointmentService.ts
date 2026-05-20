import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Appointment } from '../types';

export const createAppointment = async (providerId: string, clientId: string, date: Date, service: string) => {
  await addDoc(collection(db, 'agendamentos'), {
    providerId,
    clientId,
    date,
    status: 'pending',
    service,
    createdAt: serverTimestamp()
  });
};

export const subscribeToAppointments = (userId: string, callback: (appointments: Appointment[]) => void) => {
  const q = query(
    collection(db, 'agendamentos'),
    where('clientId', '==', userId),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
    callback(appointments);
  });
};
