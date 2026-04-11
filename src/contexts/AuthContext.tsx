import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  phone: string;
  role: string;
  village: string;
  address: string;
  created_at?: string;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (phone: string, role: string) => Promise<void>;
  signIn: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<Profile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await (supabase as any).from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) setUser(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        setTimeout(() => { if (mounted) loadProfile(s.user.id); }, 0);
      } else {
        setUser(null);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadProfile]);

  const signUp = async (phone: string, role: string) => {
    const clean = phone.replace(/\s/g, '');
    const email = `${clean}@dukkandoor.app`;
    const { data, error } = await supabase.auth.signUp({ email, password: clean });
    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        return signIn(phone);
      }
      throw error;
    }
    if (data.user) {
      await (supabase as any).from('profiles').insert({ id: data.user.id, phone: clean, role });
      await loadProfile(data.user.id);
    }
  };

  const signIn = async (phone: string) => {
    const clean = phone.replace(/\s/g, '');
    const email = `${clean}@dukkandoor.app`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: clean });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.removeItem('dukkan_cart');
  };

  const updateUser = async (data: Partial<Profile>) => {
    if (!session?.user) return;
    const { error } = await (supabase as any).from('profiles').update(data).eq('id', session.user.id);
    if (error) throw error;
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const refreshUser = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthenticated: !!session, signUp, signIn, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
