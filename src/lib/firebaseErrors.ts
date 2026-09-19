export const handleFirestoreError = (error: any, context: string) => {
  const message = error?.message || 'An unknown database error occurred.';
  console.error(`Firestore Error [${context}]:`, error);
  return message;
};
