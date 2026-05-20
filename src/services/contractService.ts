import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Contract } from '../types';

export const createContract = async (contract: Omit<Contract, 'id' | 'createdAt' | 'status' | 'milestoneVerified'>) => {
  return await addDoc(collection(db, 'contratos'), {
    ...contract,
    status: 'bloqueado',
    milestoneVerified: false,
    createdAt: serverTimestamp()
  });
};

export const updateContractStatus = async (contractId: string, status: Contract['status']) => {
  const contractRef = doc(db, 'contratos', contractId);
  await updateDoc(contractRef, { status });
};

export const verifyMilestone = async (contractId: string) => {
  const contractRef = doc(db, 'contratos', contractId);
  await updateDoc(contractRef, {
    milestoneVerified: true,
    status: 'completado'
  });
};
