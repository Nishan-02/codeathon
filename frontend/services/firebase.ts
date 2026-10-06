export { app } from '../lib/firebase/config';
export {
  auth,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getIdToken,
  onAuthStateChanged,
} from '../lib/firebase/auth';
export type { FirebaseUser } from '../lib/firebase/auth';
