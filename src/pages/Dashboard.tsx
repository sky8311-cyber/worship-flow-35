import { useState } from "react";
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
import { SetImportDialog } from "@/components/SetImportDialog";
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
import { SeedLeaderboard } from "@/components/seeds/SeedLeaderboard";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserCommunities } from "@/hooks/useUserCommunities";

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
    signOut,
    profile,
    user
  } = useAuth();
  const { unreadCount } = useNotifications();
  const { isLeaderboardEnabled, isLoading: settingsLoading } = useAppSettings();
  const dateLocale = language === "ko" ? ko : enUS;
  const [importSetOpen, setImportSetOpen] = useState(false);
  const [addSongOpen, setAddSongOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [shareLinkDialogOpen, setShareLinkDialogOpen] = useState(false);
  const [selectedSetForShare, setSelectedSetForShare] = useState<any>(null);

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
      toast.success("워십세트가 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("워십세트 삭제에 실패했습니다");
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
      toast.success("상태가 변경되었습니다");
    },
    onError: (error) => {
      console.error("Publish toggle error:", error);
      toast.error("상태 변경에 실패했습니다");
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
    if (confirm(`"${setName}" 워십세트를 삭제하시겠습니까?`)) {
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
  // Use shared community data
  const { data: communitiesData } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];

  // Fetch upcoming worship sets with role-based filtering
  // Show max 4 sets: all drafts (any date) + published (future only)
  const { data: upcomingSets, isLoading } = useQuery({
    queryKey: ["upcoming-sets", user?.id, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];
      
      // Use local date to keep sets visible until end of day (not UTC which hides early)
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      let query = supabase
        .from("service_sets")
        .select("*")
        .in("community_id", communityIds);
      
      // Role-based filtering with future date filtering for published sets
      if (isAdmin) {
        // Admin sees all drafts + published sets from today onwards
        query = query.or(`status.eq.draft,and(status.eq.published,date.gte.${localToday})`);
      } else if (isWorshipLeader || isCommunityLeaderInAnyCommunity) {
        // Worship Leader & Community Leader: show own drafts + published sets from today onwards
        query = query.or(`and(status.eq.draft,created_by.eq.${user.id}),and(status.eq.published,date.gte.${localToday})`);
      } else {
        // Team Member: show ONLY published sets from today onwards
        query = query.eq("status", "published").gte("date", localToday);
      }
      
      const { data, error } = await query
        .order("date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && communityIds.length > 0,
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

  // Fetch user stats for profile card
  const {
    data: userStats
  } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return {
        sets: 0,
        communities: 0,
        collaborations: 0
      };

      // Count created sets - use select with data instead of head
      const {
        data: setsData,
        error: setsError
      } = await supabase
        .from("service_sets")
        .select("id")
        .eq("created_by", user.id);

      // Count joined communities
      const {
        data: communitiesData,
        error: communitiesError
      } = await supabase
        .from("community_members")
        .select("id")
        .eq("user_id", user.id);

      // Count collaborations
      const {
        data: collaborationsData,
        error: collaborationsError
      } = await supabase
        .from("set_collaborators")
        .select("id")
        .eq("user_id", user.id);

      if (setsError) console.error("Sets count error:", setsError);
      if (communitiesError) console.error("Communities count error:", communitiesError);
      if (collaborationsError) console.error("Collaborations count error:", collaborationsError);

      return {
        sets: setsData?.length || 0,
        communities: communitiesData?.length || 0,
        collaborations: collaborationsData?.length || 0
      };
    },
    enabled: !!user
  });
  return <AppLayout>
      {/* Worship Leader Profile Completion Dialog */}
      <CompleteWorshipLeaderProfileDialog />
      
      {/* Main Content - Desktop Layout (3 columns) */}
      <div className="container mx-auto px-4 py-8 hidden lg:block">
        <div className="grid grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr_80px] gap-6 max-w-[1400px] mx-auto">
          {/* Column C: Sidebar (Profile, Communities, Quick Actions, Upcoming Services, Leaderboard) */}
          <div className="space-y-4 sticky top-24 self-start">
            <ProfileSidebarCard stats={userStats} />
            <CommunitiesSidebarList communities={joinedCommunities || []} maxVisible={5} />
            <QuickActionsCard showCreateCommunity={isWorshipLeader || isAdmin} />
            <UpcomingEventsWidget 
              sets={upcomingSets || []} 
              maxVisible={3}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isCommunityLeader={isCommunityLeaderInAnyCommunity}
            />
            {!settingsLoading && isLeaderboardEnabled && <SeedLeaderboard />}
          </div>

          {/* Columns A+B: Main Feed */}
          <div className="space-y-6">
            {/* Row 1: Upcoming Sets (2/3) + Song Library (1/3) */}
            <div className="grid grid-cols-3 gap-4">
              {/* Upcoming Worship Sets - 2 columns */}
              <Card className="col-span-2">
                <CardHeader className="pb-3">
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
                        <Button size="sm" variant="outline" onClick={() => setImportSetOpen(true)}>
                          <Upload className="w-4 h-4 mr-1" />
                          {t("common.import")}
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
                                    {set.status === "published" ? "게시됨" : "작성중"}
                                  </Badge>
                                </div>
                                
                                {/* Worship Leader - Priority */}
                                {set.worship_leader && (
                                  <p className={`text-sm ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    예배인도자: {set.worship_leader}
                                  </p>
                                )}
                                
                                {/* Scripture / Theme */}
                                {(set.scripture_reference || set.theme) && (
                                  <div className={`text-sm space-y-1 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
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
                                  <div className={`text-sm space-y-0.5 ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                    <p className="font-medium mb-1">곡 목록:</p>
                                    {songs.map((song, idx) => (
                                      <p key={idx} className="pl-6">
                                        {song.position}. {song.title} {song.key && `(${song.key})`}
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
                                        <Upload className="w-4 h-4 mr-2" /> 게시하기
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-4 h-4 mr-2" /> 비공개로 전환
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => handleShareLink(set, e)}>
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    링크 공유
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

              {/* Song Library Widget - 1 column (Admin/Worship Leader only) */}
              {(isAdmin || isWorshipLeader) && <SongLibraryWidget onAddSong={() => setAddSongOpen(true)} onImport={() => setImportSetOpen(true)} />}
            </div>

            {/* Community Feed Tabs */}
            <Card>
              <CardContent className="p-0">
                <DashboardFeedTabs 
                  isWorshipLeader={isWorshipLeader}
                  isAdmin={isAdmin}
                  isCommunityLeader={isCommunityLeaderInAnyCommunity}
                  hasCommunities={communityIds.length > 0}
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
            {/* Upcoming Sets */}
            <Card>
              <CardHeader>
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
                                        {song.position}. {song.title} {song.key && `(${song.key})`}
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
                isWorshipLeader={isWorshipLeader}
                isAdmin={isAdmin}
                isCommunityLeader={isCommunityLeaderInAnyCommunity}
                hasCommunities={communityIds.length > 0}
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
    </AppLayout>;
};
export default Dashboard;