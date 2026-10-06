// ── Firebase Service (STUB for mock-auth mode) ────────────────────────────────
// This file is intentionally non-functional until real Firebase credentials
// are added to a .env file.  See .env.example for the required variables.
//
// When you're ready to enable real Firebase auth:
//   1. Create a Firebase project at https://console.firebase.google.com
//   2. Copy .env.example → .env and fill in all EXPO_PUBLIC_FIREBASE_* values
//   3. Replace AuthContext.tsx with the firebase-backed version
//   4. Restore getIdToken() in services/api.ts
//
// Nothing in the app currently imports from this file.

export const auth = null;

export const signUp = async (_email: string, _password: string) => {
  throw new Error('Firebase not configured. Use mock auth.');
};

export const signIn = async (_email: string, _password: string) => {
  throw new Error('Firebase not configured. Use mock auth.');
};

export const signOut = async () => {
  throw new Error('Firebase not configured. Use mock auth.');
};

export const getCurrentUser = () => null;

export const getIdToken = async (): Promise<string | null> => null;

export const onAuthStateChanged = (_auth: any, _cb: any) => () => {};
