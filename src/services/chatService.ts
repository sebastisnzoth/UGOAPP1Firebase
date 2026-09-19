import { db } from '../firebase';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import type { Message } from '../types';

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  const cleanContent = content.trim();
  if (!cleanContent) return;

  await addDoc(collection(db, 'mensagens'), {
    senderId,
    receiverId,
    content: cleanContent,
    timestamp: serverTimestamp(),
  });
};

export const subscribeToMessages = (
  currentUserId: string,
  targetUserId: string,
  callback: (messages: Message[]) => void
) => {
  let sentMessages: Message[] = [];
  let receivedMessages: Message[] = [];

  const emit = () => {
    const merged = [...sentMessages, ...receivedMessages].sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() ?? a.timestamp?.seconds * 1000 ?? 0;
      const bTime = b.timestamp?.toMillis?.() ?? b.timestamp?.seconds * 1000 ?? 0;
      return aTime - bTime;
    });
    callback(merged);
  };

  const sentQuery = query(
    collection(db, 'mensagens'),
    where('senderId', '==', currentUserId),
    where('receiverId', '==', targetUserId)
  );

  const receivedQuery = query(
    collection(db, 'mensagens'),
    where('senderId', '==', targetUserId),
    where('receiverId', '==', currentUserId)
  );

  const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
    sentMessages = snapshot.docs.map((messageDoc) => ({
      id: messageDoc.id,
      ...messageDoc.data(),
    })) as Message[];
    emit();
  });

  const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
    receivedMessages = snapshot.docs.map((messageDoc) => ({
      id: messageDoc.id,
      ...messageDoc.data(),
    })) as Message[];
    emit();
  });

  return () => {
    unsubscribeSent();
    unsubscribeReceived();
  };
};
