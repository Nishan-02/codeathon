import React, { createContext, useState, useEffect, ReactNode } from 'react';

// ── Mock User shape (mirrors Firebase User) ───────────────────────────────────
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<MockUser>;
  signUp: (email: string, password: string) => Promise<MockUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
  signOut: async () => { throw new Error('AuthProvider not mounted'); },
});

// ── In-memory "user store" so Register → Login works ─────────────────────────
const registeredUsers: Record<string, { password: string; user: MockUser }> = {};

function createMockUser(email: string): MockUser {
  return {
    uid: `mock-uid-${Math.random().toString(36).slice(2, 10)}`,
    email,
    displayName: email.split('@')[0],
    emailVerified: true,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate "checking persisted session" on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // No persisted session in mock mode — user starts logged out
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ── signIn ─────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<MockUser> => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    // Check registered store first
    const found = registeredUsers[email.toLowerCase()];
    if (found) {
      if (found.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
      found.user.metadata.lastSignInTime = new Date().toISOString();
      setUser(found.user);
      return found.user;
    }

    // Accept ANY email + password with length >= 6 as demo login
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const newUser = createMockUser(email);
    registeredUsers[email.toLowerCase()] = { password, user: newUser };
    setUser(newUser);
    return newUser;
  };

  // ── signUp ─────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string): Promise<MockUser> => {
    await new Promise((r) => setTimeout(r, 800));

    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (registeredUsers[email.toLowerCase()]) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = createMockUser(email);
    registeredUsers[email.toLowerCase()] = { password, user: newUser };
    setUser(newUser);
    return newUser;
  };

  // ── signOut ────────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 300));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
