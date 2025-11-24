import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Mail, ArrowLeft, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CommunityManagement() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const copyInviteLink = () => {
    if (!community?.invite_token) return;
    const inviteUrl = `${window.location.origin}/join/${community.invite_token}`;
    
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        toast({ 
          title: t("community.linkCopied"),
          description: inviteUrl 
        });
      })
      .catch(() => {
        toast({ 
          title: "Failed to copy link", 
          variant: "destructive" 
        });
      });
  };

  const resetInviteLinkMutation = useMutation({
    mutationFn: async () => {
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { error } = await supabase
        .from("worship_communities")
        .update({ invite_token: newToken })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", id] });
      toast({ title: t("community.linkResetSuccess") });
    },
    onError: () => {
      toast({
        title: t("community.linkResetError"),
        variant: "destructive",
      });
    },
  });

  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setName(data.name);
      setDescription(data.description || "");
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["community-members", id],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", id);
      if (error) throw error;
      
      if (!members || members.length === 0) return [];
      
      // Fetch profiles
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);
      if (profileError) throw profileError;
      
      // Fetch global worship_leader roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      
      // Merge
      return members.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.user_id),
        globalRoles: userRoles?.filter(r => r.user_id === m.user_id).map(r => r.role) || []
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("worship_communities")
        .update({ name, description })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", id] });
      toast({ title: t("community.updateSuccess") });
    },
    onError: () => {
      toast({ title: t("community.updateError"), variant: "destructive" });
    },
  });

  const promoteToCommunityLeaderMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("community_members")
        .update({ role: "community_leader" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.promoteToCommunityLeaderSuccess") });
    },
    onError: () => {
      toast({
        title: t("community.promoteToCommunityLeaderError"),
        variant: "destructive",
      });
    },
  });

  const demoteToMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("community_members")
        .update({ role: "member" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.demoteToMemberSuccess") });
    },
    onError: () => {
      toast({
        title: t("community.demoteToMemberError"),
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.removeSuccess") });
    },
    onError: () => {
      toast({ title: t("community.removeError"), variant: "destructive" });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      const memberEntry = members?.find(m => m.user_id === user?.id);
      if (!memberEntry) throw new Error("Member entry not found");
      
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberEntry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("community.leaveSuccess") });
      navigate("/dashboard");
      queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
    },
    onError: () => {
      toast({ 
        title: t("community.leaveError"), 
        variant: "destructive" 
      });
    },
  });

  // Check if user can manage this community
  const canManage = 
    isAdmin || // Admins can manage all communities
    community?.leader_id === user?.id || // Community owner (worship leader creator)
    members?.some(m => m.user_id === user?.id && m.role === 'community_leader'); // Community leaders

  if (isLoading) {
    return <div className="container mx-auto py-8">{t("community.loading")}</div>;
  }

  if (!canManage) {
    return (
      <div className="container mx-auto py-8">
        <p>{t("community.noPermission")}</p>
      </div>
    );
  }

  const isOwner = community?.leader_id === user?.id;

  return (
    <div className="min-h-[100dvh] container mx-auto py-8 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t("community.manage")}</h1>

        <div className="space-y-6">
          {/* Community Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("community.editCommunity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t("community.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">{t("community.description")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={() => updateMutation.mutate()}>
                {t("common.save")}
              </Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>{t("community.members")}</CardTitle>
              <CardDescription>
                {t("community.memberCount", { count: members?.length || 0 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members?.map((member) => {
                  const isWorshipLeader = member.globalRoles?.includes('worship_leader');
                  const isCommunityLeader = member.role === 'community_leader';
                  const isLeaderOfCommunity = member.user_id === community.leader_id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback>{member.profiles?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                          
                          {/* Role Badges */}
                          <div className="flex gap-1 mt-1">
                            {isLeaderOfCommunity && (
                              <Badge variant="default">
                                {t("community.communityOwner")}
                              </Badge>
                            )}
                            {isWorshipLeader && (
                              <Badge className="bg-primary/10 text-primary dark:bg-primary/20">
                                {t("community.worshipLeader")}
                              </Badge>
                            )}
                            {isCommunityLeader && !isWorshipLeader && (
                              <Badge className="bg-accent/10 text-accent dark:bg-accent/20">
                                {t("community.communityLeader")}
                              </Badge>
                            )}
                            {!isCommunityLeader && !isWorshipLeader && !isLeaderOfCommunity && (
                              <Badge variant="outline">
                                {t("community.member")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Promote/Demote buttons - only for non-owner, non-worship-leaders */}
                        {!isLeaderOfCommunity && !isWorshipLeader && (
                          <>
                            {isCommunityLeader ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <ArrowDown className="h-4 w-4 mr-1" />
                                    {t("community.demoteToMember")}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("community.demoteConfirmTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("community.demoteConfirmDescription", {
                                        name: member.profiles?.full_name,
                                      })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => demoteToMemberMutation.mutate(member.id)}
                                    >
                                      {t("community.demote")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <ArrowUp className="h-4 w-4 mr-1" />
                                    {t("community.promoteToCommunityLeader")}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("community.promoteConfirmTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <p>
                                        {t("community.promoteConfirmDescription", {
                                          name: member.profiles?.full_name,
                                        })}
                                      </p>
                                      <div className="mt-3 p-3 bg-muted rounded-md">
                                        <p className="text-sm font-semibold mb-2">
                                          {t("community.communityLeaderPermissions")}:
                                        </p>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                          <li>{t("community.permissionCreateSets")}</li>
                                          <li>{t("community.permissionAddSongs")}</li>
                                          <li>{t("community.permissionLimited")}</li>
                                        </ul>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => promoteToCommunityLeaderMutation.mutate(member.id)}
                                    >
                                      {t("community.promote")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}

                        {/* Leave button for current user (not for community owner) */}
                        {member.user_id === user?.id && !isLeaderOfCommunity && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                {t("community.leaveCommunity")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("community.leaveConfirmTitle")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("community.leaveConfirmDescription", { name: community.name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => leaveCommunityMutation.mutate()}
                                >
                                  {t("community.leave")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {/* Remove button (for managers removing other members, not for community owner) */}
                        {member.user_id !== user?.id && !isLeaderOfCommunity && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("community.removeMember")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("community.removeDescription", {
                                    name: member.profiles?.full_name,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("community.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                >
                                  {t("common.remove")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Permanent Invite Link */}
          <Card>
            <CardHeader>
              <CardTitle>{t("community.permanentInviteLink")}</CardTitle>
              <CardDescription>
                {t("community.shareThisLink")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
                {window.location.origin}/join/{community?.invite_token}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyInviteLink}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t("community.copyInviteLink")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetInviteLinkMutation.mutate()}
                  disabled={resetInviteLinkMutation.isPending}
                >
                  {t("community.resetInviteLink")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
