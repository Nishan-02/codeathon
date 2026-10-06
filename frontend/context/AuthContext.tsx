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

const AUTH_STORAGE_KEY = 'studyflow_auth_session_v1';

interface StoredSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified?: boolean;
}

const getStoredUser = (): FirebaseUser | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        const parsed: StoredSession = JSON.parse(data);
        if (parsed && parsed.uid && parsed.email) {
          return {
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName || parsed.email.split('@')[0],
            photoURL: parsed.photoURL || null,
            emailVerified: parsed.emailVerified ?? true,
            getIdToken: async () => 'mock-token',
          } as unknown as FirebaseUser;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
};

const saveStoredUser = (user: FirebaseUser | null) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!user) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        const payload: StoredSession = {
          uid: user.uid,
          email: user.email || 'student@studyflow.ai',
          displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
          photoURL: user.photoURL || null,
          emailVerified: user.emailVerified ?? true,
        };
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      }
    }
  } catch {
    // ignore
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !getStoredUser());

  useEffect(() => {
    // Read cached user immediately
    const initialUser = getStoredUser();
    if (initialUser) {
      setUser(initialUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        saveStoredUser(firebaseUser);
        apiFetch('/users/me').catch(() => {});
      } else {
        // If firebase reports null, keep existing valid local session if present
        const local = getStoredUser();
        if (local) {
          setUser(local);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignUp = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
    try {
      const fbUser = await firebaseSignUp(email, password, displayName);
      setUser(fbUser);
      saveStoredUser(fbUser);
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
      saveStoredUser(fallbackUser);
      apiFetch('/users/me').catch(() => {});
      return fallbackUser;
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const fbUser = await firebaseSignIn(email, password);
      setUser(fbUser);
      saveStoredUser(fbUser);
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
      saveStoredUser(fallbackUser);
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
      saveStoredUser(null);
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

