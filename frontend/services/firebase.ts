import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { CONFIG } from '../constants/config';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: CONFIG.FIREBASE.apiKey,
  authDomain: CONFIG.FIREBASE.authDomain,
  projectId: CONFIG.FIREBASE.projectId,
  storageBucket: CONFIG.FIREBASE.storageBucket,
  messagingSenderId: CONFIG.FIREBASE.messagingSenderId,
  appId: CONFIG.FIREBASE.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Authentication helper methods
export const signUp = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch {
      // ignore non-critical profile update error
    }
  }
  return userCredential.user;
};

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const getIdToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
};

export { onAuthStateChanged };
