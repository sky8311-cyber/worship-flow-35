import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  birth_date: string | null;
  bio: string | null;
  location: string | null;
  ministry_role: string | null;
  instrument: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  cover_image_url: string | null;
  needs_worship_leader_profile: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, birthDate?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isWorshipLeader: boolean;
  isCommunityLeaderInAnyCommunity: boolean;
  hasRole: (role: string) => boolean;
  isCommunityLeader: (communityId: string) => Promise<boolean>;
  getCommunityRole: (communityId: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isCommunityLeaderInAnyCommunity, setIsCommunityLeaderInAnyCommunity] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    // Check if user is a community leader in any community
    const { data: communityLeaderData } = await supabase
      .from("community_members")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "community_leader")
      .limit(1);

    if (profileData) setProfile(profileData);
    if (rolesData) setRoles(rolesData.map((r: any) => r.role));
    setIsCommunityLeaderInAnyCommunity(!!communityLeaderData && communityLeaderData.length > 0);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    // Keep session alive when tab becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (err) {
          console.log('Session refresh error:', err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, birthDate?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          birth_date: birthDate || null,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    // Send welcome email via Resend (don't block signup if it fails)
    if (!error) {
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email, name: fullName }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue with signup flow even if email fails
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if server signOut fails (e.g., session already expired),
      // we still want to clear local state
      console.warn("Server signOut failed, clearing local state:", error);
    }
    
    // Always clear ALL local auth state regardless of server response
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setIsCommunityLeaderInAnyCommunity(false);
    
    // Force clear localStorage to ensure no stale tokens remain
    localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const hasRole = (role: string) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isWorshipLeader = hasRole("worship_leader");

  const isCommunityLeader = async (communityId: string): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from("community_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .single();

    return data?.role === "community_leader";
  };

  const getCommunityRole = async (communityId: string): Promise<string | null> => {
    if (!user) return null;

    const { data } = await supabase
      .from("community_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .single();

    return data?.role || null;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        isAdmin,
        isWorshipLeader,
        isCommunityLeaderInAnyCommunity,
        hasRole,
        isCommunityLeader,
        getCommunityRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
