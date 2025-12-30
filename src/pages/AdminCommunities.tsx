import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminNav } from "@/components/admin/AdminNav";
import { CommunityCard } from "@/components/admin/CommunityCard";
import { useTranslation } from "@/hooks/useTranslation";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Users, LayoutGrid, List } from "lucide-react";
import { useState, useEffect } from "react";

const AdminCommunities = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);
  
  const { data: communities, isLoading } = useQuery({
    queryKey: ["admin-communities"],
    queryFn: async () => {
      // Step 1: Fetch all communities (simple select)
      const { data: communitiesData, error } = await supabase
        .from("worship_communities")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (!communitiesData || communitiesData.length === 0) return [];

      // Step 2: Collect unique leader IDs
      const leaderIds = [...new Set(communitiesData.map(c => c.leader_id))];

      // Step 3: Batch fetch leader profiles
      const { data: leaders } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", leaderIds);

      // Step 4: Build leader lookup map
      const leaderMap = new Map((leaders || []).map(l => [l.id, l]));

      // Step 5: For each community, count members and sets
      const enrichedCommunities = await Promise.all(
        communitiesData.map(async (community) => {
          const { count: memberCount } = await supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);
          
          const { count: setCount } = await supabase
            .from("service_sets")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);
          
          // Get latest activity from service_sets
          const { data: latestSet } = await supabase
            .from("service_sets")
            .select("updated_at")
            .eq("community_id", community.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Get latest member join
          const { data: latestMember } = await supabase
            .from("community_members")
            .select("joined_at")
            .eq("community_id", community.id)
            .order("joined_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Calculate last activity (most recent of all dates)
          const activityDates = [
            latestSet?.updated_at,
            latestMember?.joined_at,
            community.updated_at
          ].filter(Boolean) as string[];
          
          const lastActivity = activityDates.length > 0
            ? activityDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
            : community.created_at;
          
          return {
            ...community,
            profiles: leaderMap.get(community.leader_id),
            community_members: memberCount || 0,
            service_sets: setCount || 0,
            last_activity: lastActivity
          };
        })
      );

      return enrichedCommunities;
    },
  });
  
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("worship_communities")
        .update({ is_active: isActive })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success(t("admin.communities.statusUpdated"));
    },
    onError: () => {
      toast.error(t("admin.communities.statusUpdateError"));
    },
  });
  
  return (
    <div className="min-h-screen bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl">{t("admin.communities.title")}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading communities...</p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities?.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
                  />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.communities.name")}</TableHead>
                    <TableHead>{t("admin.communities.leader")}</TableHead>
                    <TableHead>{t("admin.communities.members")}</TableHead>
                    <TableHead>{t("admin.communities.sets")}</TableHead>
                    <TableHead>{language === "ko" ? "마지막 활동" : "Last Activity"}</TableHead>
                    <TableHead>{t("admin.communities.created")}</TableHead>
                    <TableHead>{t("admin.communities.status")}</TableHead>
                    <TableHead>{t("admin.communities.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities?.map((community) => {
                    const leader = community.profiles as any;
                    const memberCount = community.community_members || 0;
                    const setCount = community.service_sets || 0;
                    
                    return (
                      <TableRow key={community.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{community.name}</div>
                            {community.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {community.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{leader?.full_name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{leader?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{memberCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>{setCount}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(community.last_activity), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(community.created_at), "PPP", { locale: dateLocale })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={community.is_active ? "default" : "secondary"}>
                            {community.is_active ? t("admin.communities.active") : t("admin.communities.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={community.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: community.id, isActive: checked })
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminCommunities;
