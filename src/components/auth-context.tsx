import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: any;
  session: any;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    (supabase.auth as any)
      .getSession()
      .then(({ data: { session } }: any) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err: any) => {
        console.warn("Auth getSession warning:", err);
        setLoading(false);
      });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((_event: any, currentSession: any) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await (supabase.auth as any).signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
