import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ProvidersContextType {
  providers: any[];
  isLoading: boolean;
}

const ProvidersContext = createContext<ProvidersContextType>({
  providers: [],
  isLoading: false,
});

export function ProvidersProvider({
  children,
  isAuthReady,
  user,
}: {
  children: React.ReactNode;
  isAuthReady: boolean;
  user: any;
}) {
  const [providerDocs, setProviderDocs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }

    const unsubscribeProviders = onSnapshot(
      collection(db, 'profiles_providers'),
      (snapshot) => {
        setProviderDocs(
          snapshot.docs.map((providerDoc) => ({
            id: providerDoc.id,
            ...providerDoc.data(),
          }))
        );
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          'profiles_providers (providers context)'
        );
        setIsLoading(false);
      }
    );

    const unsubscribeReviews = onSnapshot(
      collection(db, 'avaliacoes'),
      (snapshot) => {
        setReviews(
          snapshot.docs.map((reviewDoc) => ({
            id: reviewDoc.id,
            ...reviewDoc.data(),
          }))
        );
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          'avaliacoes (providers context)'
        );
      }
    );

    return () => {
      unsubscribeProviders();
      unsubscribeReviews();
    };
  }, [isAuthReady, user]);

  const providers = useMemo(() => {
    const stats = new Map<string, { total: number; count: number }>();

    reviews.forEach((review) => {
      const providerId = String(review.providerId || '');
      const rating = Number(review.rating);
      if (!providerId || !Number.isFinite(rating)) return;

      const current = stats.get(providerId) || { total: 0, count: 0 };
      current.total += rating;
      current.count += 1;
      stats.set(providerId, current);
    });

    return providerDocs.map((provider) => {
      const providerStats = stats.get(provider.id);
      const calculatedRating = providerStats
        ? providerStats.total / providerStats.count
        : Number(provider.rating || 0);

      return {
        ...provider,
        rating: calculatedRating,
        reviewsCount: providerStats?.count || 0,
      };
    });
  }, [providerDocs, reviews]);

  const value = useMemo(
    () => ({ providers, isLoading }),
    [providers, isLoading]
  );

  return (
    <ProvidersContext.Provider value={value}>
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProviders() {
  return useContext(ProvidersContext);
}
