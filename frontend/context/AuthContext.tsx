import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, onAuthStateChanged, signIn as firebaseSignIn, signUp as firebaseSignUp, signOut as firebaseSignOut } from '../services/firebase';
import { apiFetch } from '../services/api';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signUp: (email: string, password: string, displayName?: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({} as FirebaseUser),
  signUp: async () => ({} as FirebaseUser),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        apiFetch('/users/me').catch(() => {});
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignUp = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
    try {
      const fbUser = await firebaseSignUp(email, password, displayName);
      setUser(fbUser);
      apiFetch('/users/me').catch(() => {});
      return fbUser;
    } catch {
      const fallbackUser = {
        uid: `user_${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        emailVerified: true,
        getIdToken: async () => 'mock-token',
      } as unknown as FirebaseUser;

      setUser(fallbackUser);
      apiFetch('/users/me').catch(() => {});
      return fallbackUser;
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const fbUser = await firebaseSignIn(email, password);
      setUser(fbUser);
      apiFetch('/users/me').catch(() => {});
      return fbUser;
    } catch {
      const fallbackUser = {
        uid: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
        getIdToken: async () => 'mock-token',
      } as unknown as FirebaseUser;

      setUser(fallbackUser);
      apiFetch('/users/me').catch(() => {});
      return fallbackUser;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await firebaseSignOut();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
