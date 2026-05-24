
export const handleFirestoreError = (error: any, context: string) => {
  console.error(`Firestore Error [${context}]:`, error);
  // Log or trigger user feedback
  alert(`Error in ${context}: ${error.message || 'An unknown database error occurred.'}`);
  return error.message || 'An error occurred with the database.';
};
