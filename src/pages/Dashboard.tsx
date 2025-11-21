import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, Plus, Shield, LogOut, Upload, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SetImportDialog } from "@/components/SetImportDialog";
import { SongDialog } from "@/components/SongDialog";
import logo from "@/assets/logo.png";

// New Dashboard Components
import { SongLibraryWidget } from "@/components/dashboard/SongLibraryWidget";
import { ProfileSidebarCard } from "@/components/dashboard/ProfileSidebarCard";
import { CommunitiesSidebarList } from "@/components/dashboard/CommunitiesSidebarList";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { UpcomingServicesWidget } from "@/components/dashboard/UpcomingServicesWidget";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const { isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity, signOut, profile, user } = useAuth();
  const dateLocale = language === "ko" ? ko : enUS;
  const [importSetOpen, setImportSetOpen] = useState(false);
  const [addSongOpen, setAddSongOpen] = useState(false);

  // Check if user can create sets (worship leaders, community leaders, or admins)
  const canCreateSets = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  const { data: upcomingSets, isLoading } = useQuery({
    queryKey: ["upcoming-sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: songsCount } = useQuery({
    queryKey: ["songs-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count;
    },
  });

  // Fetch joined communities
  const { data: joinedCommunities } = useQuery({
    queryKey: ["joined-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: memberData, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (error) throw error;
      if (!memberData || memberData.length === 0) return [];

      const communityIds = memberData.map((m) => m.community_id);

      const { data: communities, error: communitiesError } = await supabase
        .from("worship_communities")
        .select("id, name, avatar_url")
        .in("id", communityIds);

      if (communitiesError) throw communitiesError;

      // Fetch member counts
      const communitiesWithDetails = await Promise.all(
        communities.map(async (community) => {
          const { count } = await supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);

          return {
            ...community,
            memberCount: count || 0,
          };
        })
      );

      return communitiesWithDetails;
    },
    enabled: !!user,
  });

  // Fetch user stats for profile card
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return { sets: 0, communities: 0, collaborations: 0 };

      // Count created sets
      const { count: setsCount } = await supabase
        .from("service_sets")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);

      // Count joined communities
      const { count: communitiesCount } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Count collaborations
      const { count: collaborationsCount } = await supabase
        .from("set_collaborators")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      return {
        sets: setsCount || 0,
        communities: communitiesCount || 0,
        collaborations: collaborationsCount || 0,
      };
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Breadcrumb */}
            <div className="justify-self-start hidden md:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t("breadcrumb.dashboard")}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Center: Logo */}
            <Link to="/dashboard" className="justify-self-center col-start-2">
              <img 
                src={logo} 
                alt="K-Worship" 
                className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            
            {/* Right: Navigation Items */}
            <div className="justify-self-end flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin">
                    <Shield className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              
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
                        {isAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            {t("roles.admin")}
                          </Badge>
                        )}
                        {isWorshipLeader && (
                          <Badge className="text-xs bg-purple-500 hover:bg-purple-600">
                            {t("roles.worshipLeader")}
                          </Badge>
                        )}
                        {isCommunityLeaderInAnyCommunity && (
                          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
                            {t("roles.communityLeader")}
                          </Badge>
                        )}
                        {!isAdmin && !isWorshipLeader && !isCommunityLeaderInAnyCommunity && (
                          <Badge variant="outline" className="text-xs">
                            {t("roles.member")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    {t("profile.viewProfile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
            <UpcomingServicesWidget sets={upcomingSets || []} maxVisible={3} />
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
                    {canCreateSets && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => navigate("/set-builder")}>
                          <Plus className="w-4 h-4 mr-1" />
                          {t("dashboard.createNewSet")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setImportSetOpen(true)}>
                          <Upload className="w-4 h-4 mr-1" />
                          {t("common.import")}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
                  ) : upcomingSets && upcomingSets.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {upcomingSets.slice(0, 4).map((set) => (
                        <Link key={set.id} to={`/set-builder/${set.id}`}>
                          <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-sm truncate">{set.service_name}</h3>
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(set.date), "M/d", { locale: dateLocale })}
                              </Badge>
                            </div>
                            {set.worship_leader && (
                              <p className="text-xs text-muted-foreground truncate">
                                {set.worship_leader}
                              </p>
                            )}
                            {set.theme && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {set.theme}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t("dashboard.noUpcoming")}</p>
                      {canCreateSets && (
                        <Button onClick={() => navigate("/set-builder")}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t("dashboard.createFirst")}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Song Library Widget - 1 column (Admin/Worship Leader only) */}
              {(isAdmin || isWorshipLeader) && (
                <SongLibraryWidget 
                  onAddSong={() => setAddSongOpen(true)}
                  onImport={() => setImportSetOpen(true)}
                />
              )}
            </div>

            {/* Community Feed */}
            <Card>
              <CardHeader>
                <CardTitle>{t("community.joined")}</CardTitle>
                <CardDescription>{t("dashboard.scheduledServices")}</CardDescription>
              </CardHeader>
              <CardContent>
                <CommunityFeed />
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Empty padding (on large screens) */}
          <div className="hidden lg:block"></div>
        </div>
      </main>

      {/* Mobile Layout - Tabs */}
      <main className="lg:hidden container mx-auto px-4 py-4">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full sticky top-16 bg-background border-b grid grid-cols-3">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">{t("common.home")}</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{t("community.title")}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t("profile.title")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4 mt-4">
            {/* Upcoming Sets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("dashboard.upcomingSets")}</CardTitle>
                  {canCreateSets && (
                    <Button size="sm" onClick={() => navigate("/set-builder")}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {upcomingSets && upcomingSets.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSets.slice(0, 5).map((set) => (
                      <Link key={set.id} to={`/set-builder/${set.id}`}>
                        <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{set.service_name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(set.date), "M/d (EEE)", { locale: dateLocale })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noUpcoming")}</p>
                )}
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
            <UpcomingServicesWidget sets={upcomingSets || []} maxVisible={5} />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <ProfileSidebarCard stats={userStats} />
          </TabsContent>
        </Tabs>
      </main>

      <SetImportDialog 
        open={importSetOpen} 
        onOpenChange={setImportSetOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
          setImportSetOpen(false);
        }}
      />

      <SongDialog
        open={addSongOpen}
        onOpenChange={setAddSongOpen}
        song={null}
        onClose={() => {
          setAddSongOpen(false);
          queryClient.invalidateQueries({ queryKey: ["songs-count"] });
          queryClient.invalidateQueries({ queryKey: ["recent-songs"] });
        }}
      />
    </div>
  );
};

export default Dashboard;
