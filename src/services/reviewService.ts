import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Review } from '../types';

export const addReview = async (providerId: string, clientId: string, rating: number, comment: string) => {
  await addDoc(collection(db, 'avaliacoes'), {
    providerId,
    clientId,
    rating,
    comment,
    createdAt: serverTimestamp()
  });
};

export const subscribeToReviews = (providerId: string, callback: (reviews: Review[]) => void) => {
  const q = query(
    collection(db, 'avaliacoes'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];
    callback(reviews);
  });
};
