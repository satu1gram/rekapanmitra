import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Explicitly recover session on mount to handle cold-start with IndexedDB
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setUser(initialSession.user);
          setSession(initialSession);
        }
      } catch (error) {
        console.error('Error recovering session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes — catch login/logout/token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prev => {
        const nextId = session?.user?.id ?? null;
        const prevId = prev?.id ?? null;
        return nextId === prevId ? prev : (session?.user ?? null);
      });
      setSession(prev => {
        const nextToken = session?.access_token ?? null;
        const prevToken = prev?.access_token ?? null;
        return nextToken === prevToken ? prev : session;
      });
      // We already set loading to false in initializeAuth, but this ensures 
      // reactive updates don't keep it loading indefinitely if initializeAuth fails.
      setLoading(false);
    });

    // When the PWA returns to foreground (after being killed / suspended),
    // the network may not have been ready during cold start, causing Supabase
    // to fire SIGNED_OUT. Re-check the session once the app is visible again.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s) {
            setUser(s.user);
            setSession(s);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    // Supabase kadang tidak mengembalikan error untuk email yang sudah terdaftar,
    // melainkan mengembalikan user dengan identities kosong (array kosong).
    // Ini adalah cara Supabase mencegah email enumeration.
    if (!error && data?.user && data.user.identities?.length === 0) {
      return { error: new Error('Email ini sudah terdaftar.') as Error };
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
