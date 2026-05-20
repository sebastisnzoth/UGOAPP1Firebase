import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Message } from '../types';

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  await addDoc(collection(db, 'mensagens'), {
    senderId,
    receiverId,
    content,
    timestamp: serverTimestamp()
  });
};

export const subscribeToMessages = (userId1: string, userId2: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'mensagens'),
    where('senderId', 'in', [userId1, userId2]),
    where('receiverId', 'in', [userId1, userId2]),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  });
};
