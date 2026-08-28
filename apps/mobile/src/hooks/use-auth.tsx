import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { User as EvenSplitUser } from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AuthContextValue {
  session: Session | null;
  authUser: SupabaseUser | null;
  profile: EvenSplitUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<EvenSplitUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data as EvenSplitUser | null);
    } catch (err) {
      console.error("EvenSplit: failed to load profile", err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    // `loading` must stay true until the profile fetch (not just the
    // session lookup) has settled. fetchProfile is async and was
    // previously fired without being awaited here, so on a cold start
    // `loading` flipped to false and `profile` was still null - app/index.tsx
    // reads that as "no profile yet" and redirects a fully-authenticated
    // returning user to profile-setup, before their real profile ever had a
    // chance to load. This is the "session doesn't survive a restart" bug:
    // the session was never actually lost, the redirect just fired one
    // render too early.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user.id) {
        await fetchProfile(data.session.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        // Same race as the cold-start path above, but for a fresh sign-in:
        // login.tsx does router.replace("/") right after signInWithPassword
        // resolves, which re-evaluates SplashGate immediately. Without this
        // loading gate, SplashGate can see session=truthy, profile=null and
        // send an existing user to profile-setup before their real profile
        // has loaded, exactly as on a cold start.
        setLoading(true);
        void fetchProfile(newSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await fetchProfile(session.user.id);
  }, [session?.user.id, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authUser: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
