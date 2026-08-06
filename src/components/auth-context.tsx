import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: any;
  session: any;
  loading: boolean;
  loginAsDemo: (customEmail?: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  loginAsDemo: () => {},
  logout: async () => {},
});

const DEMO_USER = {
  id: "demo-user-123",
  email: "demo.user@trustshield.ai",
  user_metadata: { name: "Demo Security Lead" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loginAsDemo = (customEmail?: string) => {
    const demoEmail = customEmail || "demo.user@trustshield.ai";
    const demoSession = {
      access_token: "demo-access-token",
      user: {
        id: "demo-user-" + Math.abs(demoEmail.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)),
        email: demoEmail,
        user_metadata: { name: demoEmail.split("@")[0] },
      },
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ts_demo_session", JSON.stringify(demoSession));
      } catch {}
    }
    setSession(demoSession);
    setUser(demoSession.user);
  };

  useEffect(() => {
    // 1. Check local demo session first
    if (typeof window !== "undefined") {
      try {
        const storedDemo = localStorage.getItem("ts_demo_session");
        if (storedDemo) {
          const parsed = JSON.parse(storedDemo);
          if (parsed?.user) {
            setSession(parsed);
            setUser(parsed.user);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    // 2. Get initial Supabase session
    (supabase.auth as any)
      .getSession()
      .then(({ data: { session } }: any) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        console.warn("Auth getSession warning:", err);
        setLoading(false);
      });

    // 3. Listen for auth changes
    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((_event: any, currentSession: any) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("ts_demo_session");
      } catch {}
    }
    try {
      await (supabase.auth as any).signOut();
    } catch {}
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
