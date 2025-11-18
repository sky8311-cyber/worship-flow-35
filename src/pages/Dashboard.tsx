import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, Plus, Shield, LogOut, Users, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { isAdmin, isWorshipLeader, signOut, profile, user } = useAuth();
  const dateLocale = language === "ko" ? ko : enUS;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
        .limit(5);

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

  // Fetch communities for worship leaders
  const { data: myCommunities } = useQuery({
    queryKey: ["my-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("worship_communities")
        .select("id, name, description, created_at")
        .eq("leader_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch member counts for each community
      const communitiesWithCounts = await Promise.all(
        data.map(async (community) => {
          const { count } = await supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);
          
          return { ...community, memberCount: count || 0 };
        })
      );

      return communitiesWithCounts;
    },
    enabled: isWorshipLeader && !!user,
  });

  // Fetch joined communities for team members
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
        .select("id, name, description, leader_id")
        .in("id", communityIds);

      if (communitiesError) throw communitiesError;

      // Fetch leader profiles and member counts
      const communitiesWithDetails = await Promise.all(
        communities.map(async (community) => {
          const { data: leaderProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", community.leader_id)
            .single();

          const { count } = await supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);

          return {
            ...community,
            leaderName: leaderProfile?.full_name || "Unknown",
            memberCount: count || 0,
          };
        })
      );

      return communitiesWithDetails;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t("dashboard.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {profile?.full_name && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile.full_name}
              </span>
            )}
            <LanguageToggle />
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                title={t("dashboard.adminMenu")}
              >
                <Link to="/admin">
                  <Shield className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title={t("dashboard.logout")}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">{t("dashboard.totalSongs")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {songsCount || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("dashboard.songsRegistered")}</p>
              <Link to="/songs">
                <Button variant="outline" className="w-full mt-4">
                  {t("dashboard.viewLibrary")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">{t("dashboard.upcomingServices")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {upcomingSets?.length || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("dashboard.servicesScheduled")}</p>
              <Button 
                onClick={() => navigate("/set-builder")}
                className="w-full mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.createNewSet")}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {isWorshipLeader ? myCommunities?.length || 0 : joinedCommunities?.length || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isWorshipLeader ? t("community.myCommunities") : t("community.joined")}
              </p>
              {isWorshipLeader ? (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("community.createNew")}
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => navigate("/community/search")}
                  className="w-full mt-4"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("community.search")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.upcomingSets")}</CardTitle>
                <CardDescription>{t("dashboard.scheduledServices")}</CardDescription>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
            ) : upcomingSets && upcomingSets.length > 0 ? (
              <div className="space-y-3">
                {upcomingSets.map((set) => (
                  <Link key={set.id} to={`/set-builder/${set.id}`}>
                     <div className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {set.service_name}
                            </h3>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(set.date), language === "ko" ? "M/d (EEE)" : "M/d (EEE)", { locale: dateLocale })}
                            </span>
                          </div>
                          {set.worship_leader && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {t("dashboard.leader")}: {set.worship_leader}
                            </p>
                          )}
                          {set.theme && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                              {t("dashboard.theme")}: {set.theme}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("dashboard.noUpcoming")}</p>
                <Button onClick={() => navigate("/set-builder")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.createFirst")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communities Section */}
        {isWorshipLeader && myCommunities && myCommunities.length > 0 && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle>{t("community.myCommunities")}</CardTitle>
              <CardDescription>{t("community.manageCommunities")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myCommunities.map((community) => (
                  <Card key={community.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base md:text-lg truncate">{community.name}</CardTitle>
                      {community.description && (
                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                          {community.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        {t("community.memberCount", { count: community.memberCount })}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/community/${community.id}`)}
                        className="w-full text-xs sm:text-sm"
                      >
                        {t("community.manage")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isWorshipLeader && joinedCommunities && joinedCommunities.length > 0 && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle>{t("community.joined")}</CardTitle>
              <CardDescription>{t("community.yourCommunities")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedCommunities.map((community) => (
                  <Card key={community.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base md:text-lg truncate">{community.name}</CardTitle>
                      {community.description && (
                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                          {community.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {t("community.leader")}: {community.leaderName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("community.memberCount", { count: community.memberCount })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <CreateCommunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg md:hidden">
        <div className="flex justify-around py-3">
          <Link to="/" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">{t("common.home")}</span>
          </Link>
          <Link to="/songs" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">{t("common.songLibrary")}</span>
          </Link>
          <button
            onClick={() => navigate("/set-builder")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">{t("dashboard.createNewSet")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
