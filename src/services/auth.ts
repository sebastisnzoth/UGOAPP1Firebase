import { auth, signInWithGoogle } from '../firebase';
import { GoogleAuthProvider } from 'firebase/auth';

let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;

  const result = await signInWithGoogle();
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedAccessToken = credential?.accessToken || null;
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
