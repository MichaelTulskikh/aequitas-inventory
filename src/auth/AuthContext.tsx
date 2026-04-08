import React, { createContext, useContext, useEffect, useState } from 'react';
import { getIdToken, logout as authLogout } from './auth';

export type Role = "[Admin]" | "[Staff]" | "[Viewer]" | "Admin" | "Staff" | "Viewer" ;

export function parseJwt(token: string): any {
  const base64 = token.split(".")[1];
  return JSON.parse(atob(base64));
}

export type AuthUser = {
  sub: string;
  email?: string;
  roles: string[];
  idToken: string;
};

type AuthContextType = {
  user: AuthUser | null;
  setUserFromToken: (idToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate on refresh
  useEffect(() => {
    const idToken = getIdToken();
    if (!idToken) return;

    setUserFromToken(idToken);
  }, []);

  const setUserFromToken = (idToken: string) => {
    const claims = parseJwt(idToken);

    setUser({
      sub: claims.sub,
      email: claims.email,
      roles: Array.isArray(claims['cognito:groups'])
        ? claims['cognito:groups']
        : claims['cognito:groups']
        ? [claims['cognito:groups']]
        : [],
      idToken
    });
  };

  const logout = () => {
    authLogout(); // calls Cognito logout + clears storage
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUserFromToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
