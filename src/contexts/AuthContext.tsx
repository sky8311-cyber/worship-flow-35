import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { creditDailyLoginReward } from "@/lib/rewardsHelper";

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
  timezone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isFullyLoaded: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, birthDate?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isWorshipLeader: boolean;
  isCommunityLeaderInAnyCommunity: boolean;
  isCommunityOwnerInAnyCommunity: boolean;
  hasRole: (role: string) => boolean;
  isCommunityLeader: (communityId: string) => Promise<boolean>;
  isCommunityOwner: (communityId: string) => Promise<boolean>;
  getCommunityRole: (communityId: string) => Promise<string | null>;
  syncWorshipLeaderRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isCommunityLeaderInAnyCommunity, setIsCommunityLeaderInAnyCommunity] = useState(false);
  const [isCommunityOwnerInAnyCommunity, setIsCommunityOwnerInAnyCommunity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const syncInProgress = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  // Auth epoch: increments on every user switch / signIn / signOut to invalidate stale async results
  const authEpochRef = useRef(0);
  const queryClient = useQueryClient();

  /**
   * Fetches profile/roles for a given userId.
   * Only applies the result if the epoch hasn't changed since the call started.
   * This prevents stale async responses from overwriting a newer session's state.
   */
  const fetchProfile = async (userId: string, showTimezoneToast: boolean = false) => {
    const startEpoch = authEpochRef.current;

    // Execute all queries in parallel for faster login
    const [profileResult, rolesResult, communityRolesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
      supabase
        .from("community_members")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["community_leader", "owner"])
    ]);

    // GUARD: If epoch changed or userId no longer matches, discard this stale result
    if (authEpochRef.current !== startEpoch || prevUserIdRef.current !== userId) {
      console.log("[AuthContext] Discarding stale fetchProfile result for", userId);
      // If no current user (signed out), ensure loading is set to false
      if (!prevUserIdRef.current) {
        setLoading(false);
        setProfileLoaded(false);
      }
      return;
    }

    const profileData = profileResult.data;
    const rolesData = rolesResult.data;
    const communityRolesData = communityRolesResult.data;

    // Auto-detect and save timezone if not set
    if (profileData && !profileData.timezone) {
      const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { error } = await supabase
        .from("profiles")
        .update({ timezone: systemTimezone })
        .eq("id", userId);
      
      if (!error) {
        profileData.timezone = systemTimezone;
        if (showTimezoneToast) {
          // Import dynamically to avoid circular dependency
          import('sonner').then(({ toast }) => {
            toast.info(`시간대가 자동으로 설정되었습니다: ${systemTimezone}`, {
              duration: 5000,
            });
          });
        }
      }
    }

    // Re-check epoch after timezone update (another async operation)
    if (authEpochRef.current !== startEpoch || prevUserIdRef.current !== userId) {
      console.log("[AuthContext] Discarding stale fetchProfile result (post-timezone) for", userId);
      // If no current user (signed out), ensure loading is set to false
      if (!prevUserIdRef.current) {
        setLoading(false);
        setProfileLoaded(false);
      }
      return;
    }

    if (profileData) setProfile(profileData);
    if (rolesData) setRoles(rolesData.map((r: any) => r.role));
    
    // Check leader/owner roles from single query result
    const hasLeaderRole = communityRolesData?.some(
      (r: any) => r.role === "community_leader" || r.role === "owner"
    ) ?? false;
    const hasOwnerRole = communityRolesData?.some((r: any) => r.role === "owner") ?? false;
    
    setIsCommunityLeaderInAnyCommunity(hasLeaderRole);
    setIsCommunityOwnerInAnyCommunity(hasOwnerRole);
    setProfileLoaded(true);
    setLoading(false);
  };

  // Sync worship leader role from approved application
  const syncWorshipLeaderRole = async (): Promise<boolean> => {
    if (syncInProgress.current) return false;
    syncInProgress.current = true;
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        syncInProgress.current = false;
        return false;
      }

      const response = await supabase.functions.invoke('sync-worship-leader-role', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (response.error) {
        console.log('Role sync error:', response.error);
        syncInProgress.current = false;
        return false;
      }

      const data = response.data;
      if (data?.synced) {
        console.log('Worship leader role synced successfully');
        // Refresh profile to pick up the new role
        await fetchProfile(currentSession.user.id);
        syncInProgress.current = false;
        return true;
      }

      syncInProgress.current = false;
      return false;
    } catch (err) {
      console.log('Role sync exception:', err);
      syncInProgress.current = false;
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const startEpoch = authEpochRef.current;
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || authEpochRef.current !== startEpoch) {
        // Even on early return, ensure loading is set to false to prevent infinite loading
        if (mounted) setLoading(false);
        return;
      }

      prevUserIdRef.current = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id ?? null;
      const prevUserId = prevUserIdRef.current;

      // When switching accounts (or signing out), immediately gate the UI and bump epoch
      if (prevUserId !== newUserId) {
        authEpochRef.current += 1;
        setLoading(true);
        setProfileLoaded(false);
        setProfile(null);
        setRoles([]);
        setIsCommunityLeaderInAnyCommunity(false);
        setIsCommunityOwnerInAnyCommunity(false);

        // Clear React Query cache when user changes or signs out
        if (prevUserId) {
          queryClient.clear();
        }
      }

      prevUserIdRef.current = newUserId;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Show timezone toast on SIGNED_IN event (login)
        const showToast = event === "SIGNED_IN";
        // Use setTimeout to avoid potential deadlock; fetchProfile will set loading=false
        setTimeout(() => {
          fetchProfile(session.user.id, showToast);
          
          // Credit daily login reward on SIGNED_IN event (fire-and-forget)
          if (event === "SIGNED_IN") {
            creditDailyLoginReward(session.user.id);
          }
        }, 0);
      } else {
        // Signed out
        setProfile(null);
        setRoles([]);
        setIsCommunityLeaderInAnyCommunity(false);
        setIsCommunityOwnerInAnyCommunity(false);
        setProfileLoaded(false);
        setLoading(false);
      }
    });

    // Keep session alive when tab becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const startEpoch = authEpochRef.current;
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          // Only proceed if epoch hasn't changed and user is same
          if (currentSession && mounted && authEpochRef.current === startEpoch && prevUserIdRef.current === currentSession.user.id) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id);
            await syncWorshipLeaderRole();
          }
        } catch (err) {
          console.log('Session refresh error:', err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
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
    // Bump epoch to invalidate any in-flight async work from previous session
    authEpochRef.current += 1;
    // Immediately gate UI + clear local user data to prevent any flash of previous user's dashboard
    setLoading(true);
    setProfileLoaded(false);
    setProfile(null);
    setRoles([]);
    setIsCommunityLeaderInAnyCommunity(false);
    setIsCommunityOwnerInAnyCommunity(false);

    // Clear React Query cache before sign in to prevent stale data from previous user
    queryClient.clear();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Bump epoch FIRST to invalidate any in-flight async profile/role fetches
    authEpochRef.current += 1;
    // Immediately gate the UI
    setLoading(true);
    // Clear ALL local auth state synchronously BEFORE the network call
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setIsCommunityLeaderInAnyCommunity(false);
    setIsCommunityOwnerInAnyCommunity(false);
    setProfileLoaded(false);
    prevUserIdRef.current = null;

    // Clear React Query cache to prevent showing previous user's data on next login
    queryClient.clear();

    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if server signOut fails (e.g., session already expired), local state is already cleared
      console.warn("Server signOut failed, local state already cleared:", error);
    }
    
    // Force clear localStorage to ensure no stale tokens remain
    localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
    setLoading(false);
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
  const isFullyLoaded = !loading && !!user && profileLoaded;

  const isCommunityLeader = async (communityId: string): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from("community_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .single();

    return data?.role === "community_leader" || data?.role === "owner";
  };

  const isCommunityOwner = async (communityId: string): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from("community_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .single();

    return data?.role === "owner";
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
        isFullyLoaded,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        isAdmin,
        isWorshipLeader,
        isCommunityLeaderInAnyCommunity,
        isCommunityOwnerInAnyCommunity,
        hasRole,
        isCommunityLeader,
        isCommunityOwner,
        getCommunityRole,
        syncWorshipLeaderRole,
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
