import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Appointment } from '../types';
import { handleFirestoreError } from '../lib/firebaseErrors';

export const createAppointment = async (providerId: string, clientId: string, date: Date, service: string) => {
  try {
    await addDoc(collection(db, 'agendamentos'), {
      providerId,
      clientId,
      date,
      status: 'pending',
      service,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'createAppointment');
    throw error;
  }
};

export const subscribeToAppointments = (userId: string, callback: (appointments: Appointment[]) => void, onError: (error: any) => void) => {
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
  }, (error) => {
    handleFirestoreError(error, 'subscribeToAppointments');
    onError(error);
  });
};
