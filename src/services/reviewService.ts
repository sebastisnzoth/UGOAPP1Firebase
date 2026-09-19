import { db } from '../firebase';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Review } from '../types';

export const addReview = async (
  bookingId: string,
  providerId: string,
  clientId: string,
  rating: number,
  comment: string
) => {
  const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));

  await setDoc(doc(db, 'avaliacoes', bookingId), {
    bookingId,
    providerId,
    clientId,
    rating: normalizedRating,
    comment: comment.trim().slice(0, 500),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToReviews = (
  providerId: string,
  callback: (reviews: Review[]) => void
) => {
  const q = query(
    collection(db, 'avaliacoes'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reviews = snapshot.docs.map((reviewDoc) => ({
      id: reviewDoc.id,
      ...reviewDoc.data(),
    })) as Review[];
    callback(reviews);
  });
};
