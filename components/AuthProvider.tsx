import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  credits: {
    audits_balance: number;
    draft_basic_balance: number;
    draft_custom_balance: number;
  };
  refreshCredits: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  credits: {
    audits_balance: 0,
    draft_basic_balance: 0,
    draft_custom_balance: 0,
  },
  refreshCredits: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({
    audits_balance: 0,
    draft_basic_balance: 0,
    draft_custom_balance: 0,
  });

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (data && !error) {
        setCredits({
          audits_balance: data.audits_balance || 0,
          draft_basic_balance: data.draft_basic_balance || 0,
          draft_custom_balance: data.draft_custom_balance || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchCredits(session.user.id).finally(() => setLoading(false));
        } else {
          setCredits({ audits_balance: 0, draft_basic_balance: 0, draft_custom_balance: 0 });
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshCredits = async () => {
    if (user) await fetchCredits(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, credits, refreshCredits, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
