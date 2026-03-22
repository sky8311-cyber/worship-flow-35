import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Users, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function CommunitySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities-search", searchQuery],
    queryFn: async () => {
      // Fetch all active communities (no server-side search filter)
      const { data: communities, error } = await supabase
        .from("worship_communities")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      if (!communities || communities.length === 0) return [];
      
      // Fetch leader profiles
      const leaderIds = communities.map(c => c.leader_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", leaderIds);
      
      // Fetch member counts
      const communityIds = communities.map(c => c.id);
      const { data: memberCounts } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);
      
      const counts = memberCounts?.reduce((acc, m) => {
        acc[m.community_id] = (acc[m.community_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Merge all data
      const enrichedCommunities = communities.map(c => ({
        ...c,
        profiles: profiles?.find(p => p.id === c.leader_id),
        member_count: counts?.[c.id] || 0
      }));
      
      // Client-side filtering (name, description, owner name)
      if (!searchQuery) return enrichedCommunities;
      
      const lowerQuery = searchQuery.toLowerCase();
      return enrichedCommunities.filter(c => 
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery) ||
        c.profiles?.full_name?.toLowerCase().includes(lowerQuery)
      );
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

  const { data: userJoinRequests } = useQuery({
    queryKey: ["user-join-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_join_requests")
        .select("community_id, status")
        .eq("user_id", user?.id);
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.community_id] = r.status; });
      return map;
    },
    enabled: !!user?.id,
  });

  const joinRequestMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("community_join_requests")
        .insert({
          community_id: communityId,
          user_id: user?.id,
          status: "pending",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-join-requests"] });
      toast({
        title: t("community.joinRequestSent"),
        description: t("community.joinRequestSentDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("community.joinError"),
        variant: "destructive",
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("community_join_requests")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user?.id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-join-requests"] });
      toast({
        title: t("community.joinRequestCanceled"),
        description: t("community.joinRequestCanceledDesc"),
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

  const hasPendingRequest = (communityId: string) => {
    return userJoinRequests?.includes(communityId);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("community.search")}</h1>
            <p className="text-muted-foreground">
              {t("community.searchPlaceholder")}
            </p>
          </div>

        <div className="mb-6">
          <SearchInput
            placeholder={t("community.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
                      <span className="text-muted-foreground">{t("community.communityOwner")}:</span>
                      <span>{community.profiles?.full_name || t("community.unknownLeader")}</span>
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
                        onClick={() => navigate(`/community/${community.id}`)}
                      >
                        {t("community.alreadyMember")}
                      </Button>
                    ) : hasPendingRequest(community.id) ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => cancelRequestMutation.mutate(community.id)}
                        disabled={cancelRequestMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t("community.cancelJoinRequest")}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => joinRequestMutation.mutate(community.id)}
                        disabled={joinRequestMutation.isPending}
                      >
                        {t("community.joinRequest")}
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
    </AppLayout>
  );
}
