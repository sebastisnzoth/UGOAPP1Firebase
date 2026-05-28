import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase';

interface ProvidersContextType {
  providers: any[];
  isLoading: boolean;
}

const ProvidersContext = createContext<ProvidersContextType>({ providers: [], isLoading: false });

export function ProvidersProvider({ children, isAuthReady, user }: { children: React.ReactNode; isAuthReady: boolean; user: any }) {
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }
    
    const providersRef = collection(db, 'profiles');
    const q = query(providersRef, where('tipo', '==', 'prestador'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const providersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProviders(providersList);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'profiles (providers context)');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const value = useMemo(() => ({ providers, isLoading }), [providers, isLoading]);

  return (
    <ProvidersContext.Provider value={value}>
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProviders() {
  return useContext(ProvidersContext);
}
