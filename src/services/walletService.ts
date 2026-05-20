import { db } from '../firebase';
import { collection, doc, getDoc, updateDoc, setDoc, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, increment } from 'firebase/firestore';
import { Wallet, Transaction } from '../types';

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  const walletRef = doc(db, 'wallets', userId);
  const docSnap = await getDoc(walletRef);
  if (docSnap.exists()) {
    return { userId, ...docSnap.data() } as Wallet;
  }
  return null;
};

export const createWallet = async (userId: string) => {
  await setDoc(doc(db, 'wallets', userId), {
    userId,
    balance: 0
  });
};

export const addFunds = async (userId: string, amount: number) => {
  const walletRef = doc(db, 'wallets', userId);
  await updateDoc(walletRef, {
    balance: increment(amount)
  });
  await addDoc(collection(db, 'transactions'), {
    userId,
    amount,
    type: 'deposit',
    description: 'Adição de fundos',
    timestamp: serverTimestamp()
  });
};

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    callback(transactions);
  });
};
