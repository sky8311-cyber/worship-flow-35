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
  signInWithGoogle: () => Promise<{ error: any }>;
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
  const [roleSyncComplete, setRoleSyncComplete] = useState(false);
  const syncInProgress = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  const initFetchDoneRef = useRef(false);
  // Auth epoch: increments on every user switch / signIn / signOut to invalidate stale async results
  const authEpochRef = useRef(0);
  // Track last visibility refresh to debounce tab switches
  const lastRefreshRef = useRef<number>(0);
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
  // OPTIMIZED: 24-hour cooldown to reduce unnecessary network calls
  const syncWorshipLeaderRole = async (): Promise<boolean> => {
    // Skip if already a worship leader - no need to call edge function
    if (roles.includes('worship_leader')) {
      setRoleSyncComplete(true);
      return false;
    }
    
    // Skip if already tried within 24 hours (reduces redundant calls)
    const lastSyncKey = `wl_sync_${prevUserIdRef.current}`;
    const lastSync = localStorage.getItem(lastSyncKey);
    if (lastSync && Date.now() - parseInt(lastSync) < 24 * 60 * 60 * 1000) {
      console.log('[AuthContext] Skipping WL sync - tried within 24h');
      setRoleSyncComplete(true);
      return false;
    }
    
    if (syncInProgress.current) {
      setRoleSyncComplete(true);
      return false;
    }
    syncInProgress.current = true;
    
    try {
      // Use refreshSession to get a fresh token and ensure session validity
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !currentSession) {
        // Session is invalid or expired - this is normal, just skip sync
        syncInProgress.current = false;
        setRoleSyncComplete(true);
        return false;
      }

      const response = await supabase.functions.invoke('sync-worship-leader-role-v2', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      // Save timestamp after attempt (successful or not) to prevent repeated calls
      localStorage.setItem(lastSyncKey, Date.now().toString());

      // Gracefully handle 401/Unauthorized - this is normal when session hasn't propagated yet
      if (response.error) {
        const errorMsg = response.error.message || '';
        // Silently ignore auth-related errors - expected during session propagation
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('unauthorized') || errorMsg.includes('non-2xx')) {
          syncInProgress.current = false;
          setRoleSyncComplete(true);
          return false;
        }
        // Only log non-auth errors
        console.log('Role sync error (non-auth):', response.error);
        syncInProgress.current = false;
        setRoleSyncComplete(true);
        return false;
      }

      const data = response.data;
      if (data?.synced) {
        console.log('Worship leader role synced successfully');
        // Refresh profile to pick up the new role
        await fetchProfile(currentSession.user.id);
        syncInProgress.current = false;
        setRoleSyncComplete(true);
        return true;
      }

      syncInProgress.current = false;
      setRoleSyncComplete(true);
      return false;
    } catch (err) {
      console.log('Role sync exception:', err);
      syncInProgress.current = false;
      setRoleSyncComplete(true);
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
        initFetchDoneRef.current = true;
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
        setRoleSyncComplete(false);
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
        // Skip INITIAL_SESSION if initAuth already fetched this user's profile
        if (event === "INITIAL_SESSION" && initFetchDoneRef.current && prevUserId === newUserId) {
          // Still run syncWorshipLeaderRole but skip redundant fetchProfile
          setTimeout(async () => {
            await syncWorshipLeaderRole();
          }, 0);
          return;
        }

        const showToast = event === "SIGNED_IN";
        setTimeout(async () => {
          await fetchProfile(session.user.id, showToast);
          
          if (event === "SIGNED_IN") {
            creditDailyLoginReward(session.user.id);
          }
          
          // Update last_active_at once per session event (consolidated here, removed from usePageAnalytics)
          const shouldUpdateActivity = event === "SIGNED_IN" || 
                                       event === "TOKEN_REFRESHED";
          if (shouldUpdateActivity) {
            supabase.from('profiles').update({ 
              last_active_at: new Date().toISOString() 
            }).eq('id', session.user.id).then(() => {
              console.log('[AuthContext] Updated last_active_at for event:', event);
            });
          }
          
          await syncWorshipLeaderRole();
        }, 0);
      } else {
        // Signed out
        setProfile(null);
        setRoles([]);
        setIsCommunityLeaderInAnyCommunity(false);
        setIsCommunityOwnerInAnyCommunity(false);
        setProfileLoaded(false);
        setRoleSyncComplete(false);
        setLoading(false);
      }
    });

    // Keep session alive when tab becomes visible again (debounced to 5 minutes)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Skip if refreshed within last 5 minutes
        if (now - lastRefreshRef.current < fiveMinutes) {
          return;
        }
        
        lastRefreshRef.current = now;
        const startEpoch = authEpochRef.current;
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          // Only proceed if epoch hasn't changed and user is same
          if (currentSession && mounted && authEpochRef.current === startEpoch && prevUserIdRef.current === currentSession.user.id) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id);
            await syncWorshipLeaderRole();
            
            // Update last_active_at on tab reactivation (fire-and-forget)
            supabase.from('profiles').update({ 
              last_active_at: new Date().toISOString() 
            }).eq('id', currentSession.user.id).then(() => {
              console.log('[AuthContext] Updated last_active_at on tab visibility');
            });
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

  const signInWithGoogle = async () => {
    // Bump epoch to invalidate any in-flight async work from previous session
    authEpochRef.current += 1;
    // Immediately gate UI + clear local user data
    setLoading(true);
    setProfileLoaded(false);
    setProfile(null);
    setRoles([]);
    setIsCommunityLeaderInAnyCommunity(false);
    setIsCommunityOwnerInAnyCommunity(false);

    // Clear React Query cache
    queryClient.clear();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
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
  // Wait for role sync to complete before marking as fully loaded
  const isFullyLoaded = !loading && !!user && profileLoaded && roleSyncComplete;

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
        signInWithGoogle,
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
