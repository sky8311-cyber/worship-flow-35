import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Building2, Link2, Unlink, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";

interface ChurchAccountCommunitiesTabProps {
  churchAccountId: string;
  isAdmin: boolean;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  leader_id: string;
  church_account_id: string | null;
  member_count?: number;
}

export function ChurchAccountCommunitiesTab({ churchAccountId, isAdmin }: ChurchAccountCommunitiesTabProps) {
  const { user } = useAuth();
  const { language } = useLanguageContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch linked communities
  const { data: linkedCommunities, isLoading: loadingLinked } = useQuery({
    queryKey: ["church-account-communities", churchAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select(`
          *,
          community_members(count)
        `)
        .eq("church_account_id", churchAccountId);
      
      if (error) throw error;
      return data.map(c => ({
        ...c,
        member_count: c.community_members?.[0]?.count || 0
      })) as Community[];
    },
  });

  // Fetch user's unlinked communities (for linking)
  const { data: unlinkedCommunities, isLoading: loadingUnlinked } = useQuery({
    queryKey: ["unlinked-communities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("worship_communities")
        .select("*")
        .eq("leader_id", user.id)
        .is("church_account_id", null);
      
      if (error) throw error;
      return data as Community[];
    },
    enabled: isAdmin && !!user?.id,
  });

  // Link community mutation
  const linkMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("worship_communities")
        .update({ church_account_id: churchAccountId })
        .eq("id", communityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "커뮤니티가 연결되었습니다" : "Community linked");
      setShowLinkDialog(false);
      setSelectedCommunityId("");
      queryClient.invalidateQueries({ queryKey: ["church-account-communities", churchAccountId] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-communities", user?.id] });
    },
    onError: () => {
      toast.error(language === "ko" ? "연결 실패" : "Failed to link");
    },
  });

  // Unlink community mutation
  const unlinkMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from("worship_communities")
        .update({ church_account_id: null })
        .eq("id", communityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "커뮤니티 연결이 해제되었습니다" : "Community unlinked");
      queryClient.invalidateQueries({ queryKey: ["church-account-communities", churchAccountId] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-communities", user?.id] });
    },
    onError: () => {
      toast.error(language === "ko" ? "연결 해제 실패" : "Failed to unlink");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{language === "ko" ? "예배공동체" : "Communities"}</CardTitle>
            <CardDescription>
              {language === "ko"
                ? "이 교회 계정에 연결된 예배공동체를 관리합니다."
                : "Manage communities linked to this church account."}
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Link2 className="w-4 h-4" />
                  {language === "ko" ? "커뮤니티 연결" : "Link Community"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "ko" ? "커뮤니티 연결" : "Link Community"}</DialogTitle>
                  <DialogDescription>
                    {language === "ko"
                      ? "내가 운영하는 커뮤니티를 이 교회 계정에 연결합니다."
                      : "Link a community you own to this church account."}
                  </DialogDescription>
                </DialogHeader>
                {loadingUnlinked ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : !unlinkedCommunities?.length ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{language === "ko" ? "연결할 수 있는 커뮤니티가 없습니다" : "No communities available to link"}</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => {
                        setShowLinkDialog(false);
                        setShowCreateDialog(true);
                      }}
                    >
                      {language === "ko" ? "새 커뮤니티 만들기" : "Create New Community"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ko" ? "커뮤니티 선택" : "Select community"} />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedCommunities.map((community) => (
                          <SelectItem key={community.id} value={community.id}>
                            {community.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                        {language === "ko" ? "취소" : "Cancel"}
                      </Button>
                      <Button
                        onClick={() => linkMutation.mutate(selectedCommunityId)}
                        disabled={!selectedCommunityId || linkMutation.isPending}
                      >
                        {linkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {language === "ko" ? "연결" : "Link"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadingLinked ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !linkedCommunities?.length ? (
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-1">
              {language === "ko" ? "연결된 커뮤니티가 없습니다" : "No linked communities"}
            </h3>
            <p className="text-sm">
              {language === "ko"
                ? "커뮤니티를 이 교회 계정에 연결하면 통합 관리할 수 있습니다."
                : "Link communities to this church account for unified management."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {linkedCommunities.map((community) => (
              <div key={community.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={community.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Building2 className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{community.name}</h4>
                      {community.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{community.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {community.member_count} {language === "ko" ? "명" : "members"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unlinkMutation.mutate(community.id)}
                        disabled={unlinkMutation.isPending}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Community Dialog */}
      <CreateCommunityDialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            // Invalidate unlinked communities query after potential creation
            queryClient.invalidateQueries({ queryKey: ["unlinked-communities", user?.id] });
          }
        }} 
      />
    </Card>
  );
}
