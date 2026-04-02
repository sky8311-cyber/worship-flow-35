import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InlineCommunitySearchProps {
  onClose?: () => void;
}

export function InlineCommunitySearch({ onClose }: InlineCommunitySearchProps) {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const trimmed = query.trim();
  const canSearch = trimmed.length >= 2;

  const { data: communities, isLoading } = useQuery({
    queryKey: ["inline-community-search", trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select("id, name, description, avatar_url")
        .eq("is_active", true)
        .ilike("name", `%${trimmed}%`)
        .limit(20);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const communityIds = data.map((c) => c.id);
      const { data: memberCounts } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);

      const counts = memberCounts?.reduce((acc, m) => {
        acc[m.community_id] = (acc[m.community_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return data.map((c) => ({ ...c, member_count: counts?.[c.id] || 0 }));
    },
    enabled: canSearch,
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["user-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data.map((m) => m.community_id);
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
      data.forEach((r) => { map[r.community_id] = r.status; });
      return map;
    },
    enabled: !!user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const currentStatus = userJoinRequests?.[communityId];
      if (currentStatus) {
        await supabase
          .from("community_join_requests")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", user?.id);
      }
      const { error } = await supabase
        .from("community_join_requests")
        .insert({ community_id: communityId, user_id: user?.id, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-join-requests"] });
      toast({ title: t("community.joinRequestSent"), description: t("community.joinRequestSentDesc") });
    },
    onError: () => {
      toast({ title: t("community.joinError"), variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
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
      toast({ title: t("community.joinRequestCanceled"), description: t("community.joinRequestCanceledDesc") });
    },
    onError: () => {
      toast({ title: t("community.joinError"), variant: "destructive" });
    },
  });

  const isMember = (id: string) => userMemberships?.includes(id);
  const getStatus = (id: string) => userJoinRequests?.[id] || null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchInput
          placeholder={language === "ko" ? "공동체 이름 검색..." : "Search community name..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-sm pr-16"
          autoFocus
        />
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-8 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-accent"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!canSearch && (
        <p className="text-xs text-muted-foreground px-1">
          {language === "ko" ? "2글자 이상 입력하세요" : "Type at least 2 characters"}
        </p>
      )}

      {canSearch && isLoading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {canSearch && !isLoading && communities && communities.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          {language === "ko" ? "검색 결과가 없습니다" : "No results found"}
        </p>
      )}

      {canSearch && !isLoading && communities && communities.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto overflow-x-hidden">
          {communities.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors overflow-hidden">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={c.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{c.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> {c.member_count}
                </p>
              </div>
              <div className="shrink min-w-0">
                {isMember(c.id) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 truncate max-w-[80px]"
                    onClick={() => navigate(`/community/${c.id}`)}
                  >
                    {language === "ko" ? "멤버" : "Member"}
                  </Button>
                ) : getStatus(c.id) === "pending" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => cancelMutation.mutate(c.id)}
                    disabled={cancelMutation.isPending}
                  >
                    <X className="w-3 h-3 mr-1" />
                    {language === "ko" ? "취소" : "Cancel"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => joinMutation.mutate(c.id)}
                    disabled={joinMutation.isPending}
                  >
                    {language === "ko" ? "신청" : "Join"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
