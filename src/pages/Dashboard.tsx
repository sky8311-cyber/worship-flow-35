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
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import { getCountdown } from "@/lib/countdownHelper";

// New Dashboard Components
import { SongLibraryWidget } from "@/components/dashboard/SongLibraryWidget";
import { ProfileSidebarCard } from "@/components/dashboard/ProfileSidebarCard";
import { CommunitiesSidebarList } from "@/components/dashboard/CommunitiesSidebarList";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";
import { CompleteWorshipLeaderProfileDialog } from "@/components/CompleteWorshipLeaderProfileDialog";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { useNotifications } from "@/hooks/useNotifications";
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
  const dateLocale = language === "ko" ? ko : enUS;
  const [importSetOpen, setImportSetOpen] = useState(false);
  const [addSongOpen, setAddSongOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

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

  const handleShareLink = async (set: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const bandViewUrl = `${window.location.origin}/band-view/${set.id}`;
    await navigator.clipboard.writeText(bandViewUrl);
    toast.success("링크가 복사되었습니다");
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
  // Fetch upcoming worship sets with role-based filtering
  // Show max 4 sets: all drafts (any date) + published (future only)
  const { data: upcomingSets, isLoading } = useQuery({
    queryKey: ["upcoming-sets", user?.id, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's communities
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      
      const communityIds = memberData?.map(m => m.community_id) || [];
      if (communityIds.length === 0) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from("service_sets")
        .select("*")
        .in("community_id", communityIds);
      
      // Role-based filtering with future date filtering for published sets
      if (isAdmin) {
        // Admin sees all drafts + published future sets
        query = query.or(`status.eq.draft,and(status.eq.published,date.gte.${today})`);
      } else if (isCommunityLeaderInAnyCommunity) {
        // Community Leader: show own drafts + published future sets
        query = query.or(`and(status.eq.draft,created_by.eq.${user.id}),and(status.eq.published,date.gte.${today})`);
      } else {
        // Team Member: show ONLY published future sets
        query = query.eq("status", "published").gte("date", today);
      }
      
      const { data, error } = await query
        .order("date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

  // Fetch joined communities
  const {
    data: joinedCommunities
  } = useQuery({
    queryKey: ["joined-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data: memberData,
        error
      } = await supabase.from("community_members").select("community_id, role").eq("user_id", user.id);
      if (error) throw error;
      if (!memberData || memberData.length === 0) return [];
      const communityIds = memberData.map(m => m.community_id);
      
      // Create a role map for quick lookup
      const roleMap = new Map(memberData.map(m => [m.community_id, m.role]));
      
      const {
        data: communities,
        error: communitiesError
      } = await supabase.from("worship_communities").select("id, name, avatar_url, leader_id").in("id", communityIds);
      if (communitiesError) throw communitiesError;

      // Fetch member counts
      const communitiesWithDetails = await Promise.all(communities.map(async community => {
        const {
          count
        } = await supabase.from("community_members").select("*", {
          count: "exact",
          head: true
        }).eq("community_id", community.id);
        return {
          ...community,
          memberCount: count || 0,
          userRole: roleMap.get(community.id) || 'member'
        };
      }));
      return communitiesWithDetails;
    },
    enabled: !!user
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
   return <div className="min-h-screen bg-gradient-soft">
       {/* Header */}
       <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
         <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Breadcrumb */}
            <div className="justify-self-start hidden md:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center">
                      <Home className="h-4 w-4" />
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Center: Logo - Desktop */}
            <Link to="/dashboard" className="hidden md:block justify-self-center col-start-2">
              <img src={logoDesktop} alt="K-Worship" className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            
            {/* Left: Logo - Mobile */}
            <Link to="/dashboard" className="md:hidden justify-self-start col-start-1">
              <img src={logoMobile} alt="K-Worship" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            
            {/* Right: Navigation Items */}
          <div className="col-start-3 justify-self-end flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/favorites")}>
              <Heart className="h-5 w-5" />
            </Button>
            
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <NotificationBadge count={unreadCount} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-auto">
                <NotificationPanel />
              </PopoverContent>
            </Popover>
            
            {isAdmin && <Button variant="ghost" size="icon" asChild>
                <Link to="/admin">
                  <Shield className="h-5 w-5" />
                </Link>
              </Button>}
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium">{profile?.full_name || t("profile.title")}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                      
                      {/* Role Badges */}
                      <div className="flex gap-1 flex-wrap">
                        {isAdmin && <Badge variant="destructive" className="text-xs">
                            {t("roles.admin")}
                          </Badge>}
                        {isWorshipLeader && <Badge className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                            {t("roles.worshipLeader")}
                          </Badge>}
                        {isCommunityLeaderInAnyCommunity && <Badge className="text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
                            {t("roles.communityLeader")}
                          </Badge>}
                        {!isAdmin && !isWorshipLeader && !isCommunityLeaderInAnyCommunity && <Badge variant="outline" className="text-xs">
                            {t("roles.member")}
                          </Badge>}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="md:hidden" onClick={() => setProfileDialogOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    {t("profile.title")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="md:hidden" onClick={() => {
                    setLanguage(language === "en" ? "ko" : "en");
                  }}>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>{language === "en" ? "한국어" : "English"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Desktop Layout (3 columns) */}
      <main className="container mx-auto px-4 py-8 hidden lg:block">
        <div className="grid grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr_80px] gap-6 max-w-[1400px] mx-auto">
          {/* Column C: Sidebar (Profile, Communities, Quick Actions, Upcoming Services) */}
          <div className="space-y-4">
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
                                    링크 복사
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
                </CardContent>
              </Card>

              {/* Song Library Widget - 1 column (Admin/Worship Leader only) */}
              {(isAdmin || isWorshipLeader) && <SongLibraryWidget onAddSong={() => setAddSongOpen(true)} onImport={() => setImportSetOpen(true)} />}
            </div>

            {/* Community Feed */}
            <Card>
              <CardHeader>
                <CardTitle>{t("community.joined")}</CardTitle>
              </CardHeader>
              <CardContent>
        <CommunityFeed userStats={userStats} />
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Empty padding (on large screens) */}
          <div className="hidden lg:block"></div>
        </div>
      </main>

      {/* Mobile Layout - Tabs */}
      <main className="lg:hidden container mx-auto px-4 py-4">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="w-full sticky top-16 bg-background border-b grid grid-cols-3">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">예배공동체</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">곡 라이브러리</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4 mt-4">
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
                                  링크 복사
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
              </CardContent>
            </Card>

            {/* Community Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("community.joined")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CommunityFeed />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="space-y-4 mt-4">
            <CommunitiesSidebarList communities={joinedCommunities || []} maxVisible={10} />
            <QuickActionsCard showCreateCommunity={isWorshipLeader || isAdmin} />
            <UpcomingEventsWidget 
              sets={upcomingSets || []} 
              maxVisible={5}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isCommunityLeader={isCommunityLeaderInAnyCommunity}
            />
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">곡 라이브러리</CardTitle>
              </CardHeader>
              <CardContent>
                <SongLibraryWidget 
                  onAddSong={() => setAddSongOpen(true)}
                  onImport={() => setImportSetOpen(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <SetImportDialog open={importSetOpen} onOpenChange={setImportSetOpen} onImportComplete={() => {
      queryClient.invalidateQueries({
        queryKey: ["upcoming-sets"]
      });
      setImportSetOpen(false);
    }} />

      <SongDialog open={addSongOpen} onOpenChange={setAddSongOpen} song={null} onClose={() => {
      setAddSongOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["songs-count"]
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-songs"]
      });
    }} />

      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
        stats={userStats} 
      />

      <CompleteWorshipLeaderProfileDialog />
    </div>;
};
export default Dashboard;