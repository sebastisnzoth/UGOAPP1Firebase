import { getDoc, doc } from 'firebase/firestore';
import { db } from './src/firebase';

async function testConnection() {
  try {
    console.log('Testing Firestore...');
    // Try to get a dummy document to see if it's accessible
    const docRef = doc(db, 'test-collection', 'test-doc');
    await getDoc(docRef);
    console.log('Firestore connection successful');
  } catch (err: any) {
    console.error('Firestore connection failed: ', err.message);
  }
}

testConnection();
