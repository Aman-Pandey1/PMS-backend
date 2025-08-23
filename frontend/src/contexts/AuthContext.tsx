import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
  companyId?: string;
  token: string;
};

interface AuthContextShape {
  user: AuthUser | null;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('auth:user');
    if (raw) {
      try {
        const parsed: AuthUser = JSON.parse(raw);
        setUser(parsed);
      } catch {}
    }
  }, []);

  const value = useMemo<AuthContextShape>(() => ({
    user,
    loginWithPassword: async (email: string, password: string) => {
      const { user: u, token } = await (await import('../services/auth')).loginRequest(email, password);
      const authUser: AuthUser = { id: u.id, name: u.fullName, role: u.role, companyId: u.companyId, token };
      setUser(authUser);
      localStorage.setItem('auth:user', JSON.stringify(authUser));
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem('auth:user');
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}