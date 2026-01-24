import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, Plus, Shield, LogOut, Upload, User, Home, Heart, Languages, MoreHorizontal, Trash2, Lock, Link as LinkIcon, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
// SetImportDialog moved to WorshipSets page
import { SongDialog } from "@/components/SongDialog";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import { getCountdown } from "@/lib/countdownHelper";

// New Dashboard Components
import { SongLibraryWidget } from "@/components/dashboard/SongLibraryWidget";
import { ProfileSidebarCard } from "@/components/dashboard/ProfileSidebarCard";
import { CommunitiesSidebarList } from "@/components/dashboard/CommunitiesSidebarList";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";
import { DashboardFeedTabs } from "@/components/dashboard/DashboardFeedTabs";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";
import { CompleteWorshipLeaderProfileDialog } from "@/components/CompleteWorshipLeaderProfileDialog";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { useNotifications } from "@/hooks/useNotifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SeedLeaderboard = lazy(() => import("@/components/seeds/SeedLeaderboard").then(m => ({ default: m.SeedLeaderboard })));
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { LiturgicalCalendarBanner } from "@/components/dashboard/LiturgicalCalendarBanner";
import { WLOnboardingChecklist } from "@/components/dashboard/WLOnboardingChecklist";
import { RoleSelectionDialog } from "@/components/onboarding/RoleSelectionDialog";
import { InvitedUserWelcomeDialog } from "@/components/onboarding/InvitedUserWelcomeDialog";
import { TeamMemberWelcomeDialog } from "@/components/onboarding/TeamMemberWelcomeDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    t,
    language
  } = useTranslation();
  const { setLanguage } = useLanguageContext();
  const {
    isAdmin,
    isWorshipLeader,
    isCommunityLeaderInAnyCommunity,
    isFullyLoaded,
    signOut,
    profile,
    user
  } = useAuth();
  const { unreadCount } = useNotifications();
  const { isLeaderboardEnabled, isLoading: settingsLoading } = useAppSettings();
  const dateLocale = language === "ko" ? ko : enUS;
  
  // State
  const [addSongOpen, setAddSongOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [shareLinkDialogOpen, setShareLinkDialogOpen] = useState(false);
  const [selectedSetForShare, setSelectedSetForShare] = useState<any>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showInvitedDialog, setShowInvitedDialog] = useState(false);
  const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
  const [invitedCommunityInfo, setInvitedCommunityInfo] = useState<{ name: string; avatarUrl?: string; inviterName?: string } | null>(null);
  
  // Use shared community data with loading state tracking - MUST be before any useEffects that depend on it
  const { data: communitiesData, isLoading: communitiesLoading, isFetched: communitiesFetched } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];
  // Only consider communities "ready" when data has been fetched (not just loading)
  const communitiesReady = communitiesFetched && !communitiesLoading;
  
  // CRITICAL: Gate to prevent dashboard flash - wait for ALL essential data
  // isFullyLoaded now includes role sync completion from AuthContext
  const isDashboardReady = isFullyLoaded && communitiesReady;
  
  // Set cookie to track that user has visited dashboard (for returning visitor detection)
  useEffect(() => {
    document.cookie = "kworship_visited=true; path=/; max-age=31536000; SameSite=Lax";
  }, []);
  
  // Role selection dialog for new users - only run after dashboard is fully ready
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !profile || isWorshipLeader || isAdmin) return;
      
      // Fetch latest profile with onboarding fields
      const { data: latestProfile } = await supabase
        .from("profiles")
        .select("onboarding_role_asked, onboarding_role_asked_count, invited_by_community_id, created_at")
        .eq("id", user.id)
        .single();
      
      if (!latestProfile) return;
      
      // If already asked and completed, skip
      if (latestProfile.onboarding_role_asked) return;
      
      // Check if user was invited (show different dialog)
      if (latestProfile.invited_by_community_id) {
        // Fetch community info
        const { data: community } = await supabase
          .from("worship_communities")
          .select("name, avatar_url")
          .eq("id", latestProfile.invited_by_community_id)
          .single();
        
        if (community) {
          setInvitedCommunityInfo({
            name: community.name,
            avatarUrl: community.avatar_url,
          });
          setShowInvitedDialog(true);
          return;
        }
      }
      
      // Check if new user (within 24 hours of signup)
      const signupTime = new Date(latestProfile.created_at || 0);
      const now = new Date();
      const hoursSinceSignup = (now.getTime() - signupTime.getTime()) / (1000 * 60 * 60);
      
      // Show dialog if: new user (< 24h) OR asked less than 3 times
      const askCount = latestProfile.onboarding_role_asked_count || 0;
      if (hoursSinceSignup < 24 || askCount < 3) {
        setShowRoleDialog(true);
      }
    };
    
    // Only run after communities are fetched to prevent flash
    if (!communitiesReady) return;
    
    // Small delay to ensure profile is loaded
    const timer = setTimeout(checkOnboardingStatus, 500);
    return () => clearTimeout(timer);
  }, [user, profile, isWorshipLeader, isAdmin, communitiesReady]);

  // Check if user can create sets (worship leaders, community leaders, or admins)
  const canCreateSets = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;
  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  // Mutations for worship set actions
  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase
        .from("service_sets")
        .delete()
        .eq("id", setId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("dashboard.setDeleted"));
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error(t("dashboard.setDeleteFailed"));
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const newStatus = status === "draft" ? "published" : "draft";
      const { error } = await supabase
        .from("service_sets")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      toast.success(t("dashboard.statusChanged"));
    },
    onError: (error) => {
      console.error("Publish toggle error:", error);
      toast.error(t("dashboard.statusChangeFailed"));
    },
  });

  const handleTogglePublish = async (set: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    publishMutation.mutate({ id: set.id, status: set.status });
  };

  const handleShareLink = (set: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSetForShare(set);
    setShareLinkDialogOpen(true);
  };

  const handleDelete = async (setId: string, setName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t("dashboard.confirmDeleteSet").replace("{name}", setName))) {
      deleteMutation.mutate(setId);
    }
  };

  const isPastDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = parseLocalDate(dateString);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDayOfWeek = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const dayIndex = date.getDay();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return t(`common.dayOfWeek.${days[dayIndex]}` as any);
  };
  // communityIds moved up to before useEffects that depend on it

  // Fetch collaborated set IDs
  const { data: collaboratedSetIds = [] } = useQuery({
    queryKey: ["collaborated-set-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("set_collaborators")
        .select("service_set_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map(c => c.service_set_id) || [];
    },
    enabled: !!user,
  });

  // Fetch upcoming worship sets with role-based filtering
  // Show max 4 sets: all drafts (any date) + published (future only) + collaborated sets
  const { data: upcomingSets, isLoading } = useQuery({
    queryKey: ["upcoming-sets", user?.id, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity, communityIds, collaboratedSetIds],
    queryFn: async () => {
      if (!user || !profile || communityIds.length === 0) return [];
      
      // Use local date to keep sets visible until end of day (not UTC which hides early)
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      let query = supabase
        .from("service_sets")
        .select("*")
        .in("community_id", communityIds);
      
      // Role-based filtering with future date filtering for published sets
      // Also include sets where user is a collaborator
      if (isAdmin) {
        // Admin sees all drafts + published sets from today onwards
        if (collaboratedSetIds.length > 0) {
          query = query.or(`status.eq.draft,and(status.eq.published,date.gte.${localToday}),id.in.(${collaboratedSetIds.join(",")})`);
        } else {
          query = query.or(`status.eq.draft,and(status.eq.published,date.gte.${localToday})`);
        }
      } else if (isWorshipLeader || isCommunityLeaderInAnyCommunity) {
        // Worship Leader & Community Leader: show own drafts + published sets + collaborated sets
        if (collaboratedSetIds.length > 0) {
          query = query.or(`and(status.eq.draft,created_by.eq.${user.id}),and(status.eq.published,date.gte.${localToday}),id.in.(${collaboratedSetIds.join(",")})`);
        } else {
          query = query.or(`and(status.eq.draft,created_by.eq.${user.id}),and(status.eq.published,date.gte.${localToday})`);
        }
      } else {
        // Team Member: show published sets + collaborated sets
        if (collaboratedSetIds.length > 0) {
          query = query.or(`and(status.eq.published,date.gte.${localToday}),id.in.(${collaboratedSetIds.join(",")})`);
        } else {
          query = query.eq("status", "published").gte("date", localToday);
        }
      }
      
      const { data, error } = await query
        .order("date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile && communityIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const {
    data: songsCount
  } = useQuery({
    queryKey: ["songs-count"],
    queryFn: async () => {
      const {
        count,
        error
      } = await supabase.from("songs").select("*", {
        count: "exact",
        head: true
      });
      if (error) throw error;
      return count;
    }
  });

  // Build joined communities from shared data
  const {
    data: joinedCommunities
  } = useQuery({
    queryKey: ["joined-communities", user?.id, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];
      
      // Batch fetch all member counts in one query
      const { data: allMemberCounts } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);

      // Create count map
      const countMap = (allMemberCounts || []).reduce((acc, m) => {
        acc[m.community_id] = (acc[m.community_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map using shared data without additional queries
      const communitiesWithDetails = (communitiesData?.communities || []).map(community => ({
        ...community,
        memberCount: countMap[community.id] || 0,
        userRole: communitiesData?.roleMap.get(community.id) || 'member'
      }));
      return communitiesWithDetails;
    },
    enabled: !!user && communityIds.length > 0
  });

  // Fetch songs for worship sets in dashboard
  const { data: setSongsData } = useQuery({
    queryKey: ["dashboard-set-songs", upcomingSets?.map(s => s.id)],
    queryFn: async () => {
      if (!upcomingSets || upcomingSets.length === 0) return {};
      
      const setIds = upcomingSets.map(s => s.id);
      const { data: setSongs } = await supabase
        .from("set_songs")
        .select(`
          service_set_id,
          position,
          key,
          songs (
            id,
            title
          )
        `)
        .in("service_set_id", setIds)
        .order("position", { ascending: true });

      // Group songs by set_id
      const grouped: Record<string, { position: number; title: string; key: string }[]> = {};
      setSongs?.forEach((ss: any) => {
        if (!grouped[ss.service_set_id]) {
          grouped[ss.service_set_id] = [];
        }
        grouped[ss.service_set_id].push({
          position: ss.position,
          title: ss.songs?.title || "",
          key: ss.key || ""
        });
      });

      return grouped;
    },
    enabled: !!upcomingSets && upcomingSets.length > 0,
  });

  // Fetch user stats for profile card (extended with sub-stats)
  const {
    data: userStats
  } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user || !profile) return {
        sets: 0,
        setViews: 0,
        communities: 0,
        chatMessages: 0,
        songs: 0,
        songUsageCount: 0
      };

      // 1. Created sets + total view count
      const { data: setsData } = await supabase
        .from("service_sets")
        .select("id, view_count")
        .eq("created_by", user.id);
      
      const setsCount = setsData?.length || 0;
      const setViews = setsData?.reduce((sum, s) => sum + (s.view_count || 0), 0) || 0;

      // 2. Joined communities
      const { data: communitiesData } = await supabase
        .from("community_members")
        .select("id")
        .eq("user_id", user.id);

      // 3. Chat messages (community_posts by this user)
      const { data: postsData } = await supabase
        .from("community_posts")
        .select("id")
        .eq("author_id", user.id);

      // 4. Songs contributed + usage count
      const { data: songsData } = await supabase
        .from("songs")
        .select("id")
        .eq("created_by", user.id);

      let songUsageCount = 0;
      if (songsData && songsData.length > 0) {
        const songIds = songsData.map(s => s.id);
        const { count } = await supabase
          .from("set_songs")
          .select("id", { count: "exact", head: true })
          .in("song_id", songIds);
        songUsageCount = count || 0;
      }

      return {
        sets: setsCount,
        setViews,
        communities: communitiesData?.length || 0,
        chatMessages: postsData?.length || 0,
        songs: songsData?.length || 0,
        songUsageCount
      };
    },
    enabled: !!user && !!profile
  });

  // Show loading state until dashboard is fully ready - prevents flash
  if (!isDashboardReady) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <AppLayout>
      {/* Worship Leader Profile Completion Dialog */}
      <CompleteWorshipLeaderProfileDialog />
      
      {/* Role Selection Dialog for new users */}
      {user && (
        <RoleSelectionDialog
          open={showRoleDialog}
          onOpenChange={setShowRoleDialog}
          userId={user.id}
          onComplete={() => setShowRoleDialog(false)}
          onTeamMemberSelected={() => setShowTeamMemberDialog(true)}
        />
      )}
      
      {/* Invited User Welcome Dialog */}
      {user && invitedCommunityInfo && (
        <InvitedUserWelcomeDialog
          open={showInvitedDialog}
          onOpenChange={setShowInvitedDialog}
          userId={user.id}
          communityName={invitedCommunityInfo.name}
          communityAvatarUrl={invitedCommunityInfo.avatarUrl}
          inviterName={invitedCommunityInfo.inviterName}
          onComplete={() => setShowInvitedDialog(false)}
        />
      )}
      
      {/* Team Member Welcome Dialog */}
      <TeamMemberWelcomeDialog
        open={showTeamMemberDialog}
        onOpenChange={setShowTeamMemberDialog}
      />
      
      {/* Main Content - Desktop Layout (3 columns) */}
      <div className="container mx-auto px-4 py-8 hidden lg:block">
        <div className="grid grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr_80px] gap-6 max-w-[1400px] mx-auto">
          {/* Column C: Sidebar (Profile, Communities, Quick Actions, Upcoming Services, Leaderboard) */}
          <div className="space-y-4 sticky top-24 self-start">
            <ProfileSidebarCard stats={userStats} />
            <WLOnboardingChecklist />
            <CommunitiesSidebarList communities={joinedCommunities || []} maxVisible={5} />
            <QuickActionsCard showCreateCommunity={isWorshipLeader || isAdmin} />
            <UpcomingEventsWidget 
              sets={upcomingSets || []} 
              maxVisible={3}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isCommunityLeader={isCommunityLeaderInAnyCommunity}
            />
            {!settingsLoading && isLeaderboardEnabled && (
              <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
                <SeedLeaderboard />
              </Suspense>
            )}
          </div>

          {/* Columns A+B: Main Feed */}
          <div className="space-y-6">
            {/* Row 1: Upcoming Sets (2/3) + Song Library (1/3) */}
            <div className="grid grid-cols-3 gap-4">
              {/* Upcoming Worship Sets - 2 columns */}
              <Card className="col-span-2">
                <CardHeader className="pb-3">
                  <LiturgicalCalendarBanner />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      <CardTitle className="text-lg">{t("dashboard.upcomingSets")}</CardTitle>
                    </div>
                    {canCreateSets && <div className="flex gap-2">
                        <Button size="sm" onClick={() => navigate("/set-builder")}>
                          <Plus className="w-4 h-4 mr-1" />
                          {t("dashboard.createNewSet")}
                        </Button>
                      </div>}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div> : upcomingSets && upcomingSets.length > 0 ? <div className="grid gap-3 md:grid-cols-2">
                      {upcomingSets.slice(0, 4).map(set => {
                        const isPast = isPastDate(set.date);
                        const canManage = isAdmin || ((isWorshipLeader || isCommunityLeaderInAnyCommunity) && set.created_by === user?.id);
                        const songs = setSongsData?.[set.id] || [];
                        const countdown = getCountdown(set.date, set.service_time);
                        
                        // Format time for display (AM/PM format)
                        let formattedTime = "";
                        if (set.service_time) {
                          try {
                            const timeDate = new Date(`${set.date}T${set.service_time.length === 5 ? set.service_time + ':00' : set.service_time}`);
                            formattedTime = format(timeDate, "h:mm a");
                          } catch (e) {
                            formattedTime = set.service_time;
                          }
                        }
                        
                        return (
                          <div key={set.id} className="relative group">
                            <Link to={set.status === "published" ? `/band-view/${set.id}` : `/set-builder/${set.id}`} className={`block p-4 border rounded-lg transition-colors hover:bg-muted/50 ${isPast ? "opacity-70" : ""}`}>
                              <div className="space-y-2">
                                {/* Service Name - Priority */}
                                <h3 className={`text-base font-semibold ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {set.service_name}
                                </h3>
                                
                                {/* Date Badge with Countdown and Status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {format(parseLocalDate(set.date), "yyyy.MM.dd")} ({getDayOfWeek(set.date)})
                                    {set.service_time && ` • ${formattedTime}`}
                                  </Badge>
                                  {countdown && !countdown.isPast && countdown.text && (
                                    <Badge className="text-xs bg-accent text-white hover:bg-accent">
                                      {countdown.text}
                                    </Badge>
                                  )}
                                  <Badge variant={set.status === "published" ? "default" : "secondary"} className="text-xs">
                                    {set.status === "published" ? t("dashboard.statusPublished") : t("dashboard.statusDraft")}
                                  </Badge>
                                </div>
                                
                                {/* Worship Leader - Priority */}
                                {set.worship_leader && (
                                  <p className={`text-sm ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    {t("dashboard.worshipLeader")}: {set.worship_leader}
                                  </p>
                                )}
                                
                                {/* Scripture / Theme */}
                                {(set.scripture_reference || set.theme) && (
                                  <div className={`text-sm space-y-1 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    {set.scripture_reference && (
                                      <p>{t("dashboard.scripture")}: {set.scripture_reference}</p>
                                    )}
                                    {set.theme && (
                                      <p>{t("dashboard.sermonTitle")}: {set.theme}</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Song List */}
                                {songs.length > 0 && (
                                  <div className={`text-sm space-y-0.5 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    <p className="font-medium mb-1">{t("dashboard.songList")}:</p>
                                    {songs.map((song, idx) => (
                                      <p key={idx} className="pl-6">
                                        {song.title} {song.key && `(${song.key})`}
                                      </p>
                                    ))}
                                  </div>
                                 )}
                              </div>
                            </Link>

                            {canManage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 md:opacity-0 md:group-hover:opacity-100"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => handleTogglePublish(set, e)}>
                                    {set.status === "draft" ? (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" /> {t("dashboard.publish")}
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-4 h-4 mr-2" /> {t("dashboard.unpublish")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => handleShareLink(set, e)}>
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    {t("dashboard.shareLink")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => handleDelete(set.id, set.service_name, e)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </div> : <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t("dashboard.noUpcoming")}</p>
                      {canCreateSets && <Button onClick={() => navigate("/set-builder")}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t("dashboard.createFirst")}
                        </Button>}
                    </div>}
                    
                    {/* View History Button at Bottom */}
                    <div className="flex justify-center pt-4 border-t mt-4">
                      <Link to="/worship-sets">
                        <Button variant="outline" size="sm">
                          {t("worshipSets.viewHistory")}
                        </Button>
                      </Link>
                    </div>
                </CardContent>
              </Card>

              {/* Song Library Widget - 1 column (visible to all, add button for admin/WL only) */}
              <SongLibraryWidget onAddSong={() => setAddSongOpen(true)} canAddSong={isAdmin || isWorshipLeader} />
            </div>

            {/* Community Feed Tabs */}
            <Card>
              <CardContent className="p-0">
                <DashboardFeedTabs
                  key={`feed-${communityIds.length > 0 ? 'has' : 'no'}-${isWorshipLeader ? 'wl' : 'tm'}`}
                  isWorshipLeader={isWorshipLeader || false}
                  isAdmin={isAdmin || false}
                  isCommunityLeader={isCommunityLeaderInAnyCommunity || false}
                  hasCommunities={communitiesReady ? communityIds.length > 0 : null}
                  communitiesLoading={communitiesLoading}
                  userStats={userStats}
                />
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Empty padding (on large screens) */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden container mx-auto px-4 py-4">
        <div className="space-y-4">
            {/* Onboarding Checklist for new WLs */}
            <WLOnboardingChecklist />
            <Card>
              <CardHeader>
                <LiturgicalCalendarBanner />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("dashboard.upcomingSets")}</CardTitle>
                  {canCreateSets && <Button size="sm" onClick={() => navigate("/set-builder")}>
                      <Plus className="w-4 h-4" />
                    </Button>}
                </div>
              </CardHeader>
                <CardContent>
                  {upcomingSets && upcomingSets.length > 0 ? <div className="space-y-3">
                    {upcomingSets.slice(0, 5).map(set => {
                      const isPast = isPastDate(set.date);
                      const canManage = isAdmin || (isCommunityLeaderInAnyCommunity && set.created_by === user?.id);
                      const songs = setSongsData?.[set.id] || [];
                      const countdown = getCountdown(set.date, set.service_time);
                      
                      // Format time for display (AM/PM format)
                      let formattedTime = "";
                      if (set.service_time) {
                        try {
                          const timeDate = new Date(`${set.date}T${set.service_time.length === 5 ? set.service_time + ':00' : set.service_time}`);
                          formattedTime = format(timeDate, "h:mm a");
                        } catch (e) {
                          formattedTime = set.service_time;
                        }
                      }
                      
                      return (
                        <div key={set.id} className="relative group">
                          <Link to={set.status === "published" ? `/band-view/${set.id}` : `/set-builder/${set.id}`} className="block">
                            <div className={`p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${isPast ? 'opacity-70' : ''}`}>
                              <div className="space-y-2">
                                {/* Service Name - Priority */}
                                <h3 className={`font-semibold text-sm ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {set.service_name}
                                </h3>
                                
                                {/* Date Badge with Countdown and Status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                                    {format(parseLocalDate(set.date), "yyyy.MM.dd")} ({getDayOfWeek(set.date)})
                                    {set.service_time && ` • ${formattedTime}`}
                                  </Badge>
                                  {countdown && !countdown.isPast && countdown.text && (
                                    <Badge className="text-[10px] sm:text-xs bg-accent text-white hover:bg-accent">
                                      {countdown.text}
                                    </Badge>
                                  )}
                                  <Badge variant={set.status === "published" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                                    {set.status === "published" ? "게시됨" : "작성중"}
                                  </Badge>
                                </div>
                                
                                {/* Worship Leader - Priority */}
                                {set.worship_leader && (
                                  <p className={`text-xs ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    예배인도자: {set.worship_leader}
                                  </p>
                                )}
                                
                                {/* Scripture / Theme */}
                                {(set.scripture_reference || set.theme) && (
                                  <div className={`text-xs space-y-0.5 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    {set.scripture_reference && (
                                      <p>본문: {set.scripture_reference}</p>
                                    )}
                                    {set.theme && (
                                      <p>설교제목: {set.theme}</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Song List */}
                                {songs.length > 0 && (
                                  <div className={`text-xs space-y-0.5 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    <p className="font-medium">곡 목록:</p>
                                    {songs.map((song, idx) => (
                                      <p key={idx} className="pl-6">
                                        {song.title} {song.key && `(${song.key})`}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleTogglePublish(set, e)}>
                                  {set.status === "draft" ? (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      게시하기
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="mr-2 h-4 w-4" />
                                      임시저장으로 전환
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleShareLink(set, e)}>
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  링크 공유
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => handleDelete(set.id, set.service_name, e)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}
                  </div> : <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noUpcoming")}</p>}
                  
                  {/* View History Button at Bottom */}
                  <div className="flex justify-center pt-4 border-t mt-4">
                    <Link to="/worship-sets">
                      <Button variant="outline" size="sm">
                        {t("worshipSets.viewHistory")}
                      </Button>
                    </Link>
                  </div>
              </CardContent>
            </Card>

          {/* Community Feed Tabs */}
          <Card>
            <CardContent className="p-0">
              <DashboardFeedTabs
                key={`feed-mobile-${communityIds.length > 0 ? 'has' : 'no'}-${isWorshipLeader ? 'wl' : 'tm'}`}
                isWorshipLeader={isWorshipLeader || false}
                isAdmin={isAdmin || false}
                isCommunityLeader={isCommunityLeaderInAnyCommunity || false}
                hasCommunities={communitiesReady ? communityIds.length > 0 : null}
                communitiesLoading={communitiesLoading}
                userStats={userStats}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Share Link Dialog */}
      {selectedSetForShare && (
        <ShareLinkDialog
          open={shareLinkDialogOpen}
          onOpenChange={setShareLinkDialogOpen}
          setId={selectedSetForShare.id}
          publicShareToken={selectedSetForShare.public_share_token}
          publicShareEnabled={selectedSetForShare.public_share_enabled || false}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
            queryClient.invalidateQueries({ queryKey: ["service-set", selectedSetForShare.id] });
          }}
        />
      )}

      {/* Song Dialog for adding songs from dashboard */}
      <SongDialog
        open={addSongOpen}
        onOpenChange={setAddSongOpen}
        song={null}
        onClose={() => setAddSongOpen(false)}
      />
    </AppLayout>;
};
export default Dashboard;