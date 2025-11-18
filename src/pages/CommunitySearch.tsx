import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Search, Users } from "lucide-react";

export default function CommunitySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities-search", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("worship_communities")
        .select("*")
        .eq("is_active", true);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: communities, error } = await query;
      if (error) throw error;
      
      if (!communities || communities.length === 0) return [];
      
      // Fetch leader profiles
      const leaderIds = communities.map(c => c.leader_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", leaderIds);
      if (profileError) throw profileError;
      
      // Fetch member counts
      const communityIds = communities.map(c => c.id);
      const { data: memberCounts, error: countError } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);
      if (countError) throw countError;
      
      // Count members per community
      const counts = memberCounts?.reduce((acc, m) => {
        acc[m.community_id] = (acc[m.community_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Merge all data
      return communities.map(c => ({
        ...c,
        profiles: profiles?.find(p => p.id === c.leader_id),
        member_count: counts?.[c.id] || 0
      }));
    },
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["user-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data.map(m => m.community_id);
    },
    enabled: !!user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: user?.id,
          role: "member",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-memberships"] });
      toast({
        title: t("community.joinSuccess"),
      });
    },
    onError: () => {
      toast({
        title: t("community.joinError"),
        variant: "destructive",
      });
    },
  });

  const isMember = (communityId: string) => {
    return userMemberships?.includes(communityId);
  };

  return (
    <div className="min-h-[100dvh] container mx-auto py-8 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("community.search")}</h1>
          <p className="text-muted-foreground">
            {t("community.searchPlaceholder")}
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("community.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t("community.loading")}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {communities?.map((community) => (
              <Card key={community.id}>
                <CardHeader>
                  <CardTitle>{community.name}</CardTitle>
                  <CardDescription>{community.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("community.leader")}:</span>
                      <span>{community.profiles?.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("community.members")}:</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {community.member_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {isMember(community.id) ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/dashboard")}
                      >
                        {t("community.alreadyMember")}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => joinMutation.mutate(community.id)}
                        disabled={joinMutation.isPending}
                      >
                        {t("community.join")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && communities?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("community.noCommunities")}
          </div>
        )}
      </div>
    </div>
  );
}
