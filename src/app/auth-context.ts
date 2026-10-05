import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}