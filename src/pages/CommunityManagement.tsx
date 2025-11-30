import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Trash2, Mail, ArrowUp, ArrowDown, Send, Users, RefreshCw, Settings, Lock } from "lucide-react";
import { CommunityTeamRotationTab } from "@/components/community/CommunityTeamRotationTab";
import { UpgradePlanDialog } from "@/components/church/UpgradePlanDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select("*, church_account_id")
        .eq("id", id)
        .single();
      if (error) throw error;
      setName(data.name);
      setDescription(data.description || "");
      return data;
    },
  });

  // Check if community has a paid church account
  const { data: churchAccount } = useQuery({
    queryKey: ["community-church-account", community?.church_account_id],
    queryFn: async () => {
      if (!community?.church_account_id) return null;
      const { data, error } = await supabase
        .from("church_accounts")
        .select("id, subscription_status")
        .eq("id", community.church_account_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!community?.church_account_id,
  });

  // Check if rotation feature is available (active subscription or valid trial)
  const isTrialValid = churchAccount?.subscription_status === "trial"; // We'd need trial_ends_at to properly check
  const hasRotationFeature = churchAccount && (churchAccount.subscription_status === "active" || churchAccount.subscription_status === "trial");
  
  // Show rotation tab but gate the content
  const showRotationTab = !!community?.church_account_id;

  const { data: invitations } = useQuery({
    queryKey: ["community-invitations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_invitations")
        .select("*")
        .eq("community_id", id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
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
        .select("id, full_name, email, avatar_url, birth_date")
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
    onError: (error: any) => {
      console.error("Update community error:", error);
      toast({ title: t("community.updateError"), variant: "destructive" });
    },
  });

  const promoteToCommunityLeaderMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Promoting member:", memberId);
      const { error } = await supabase
        .from("community_members")
        .update({ role: "community_leader" })
        .eq("id", memberId);
      if (error) {
        console.error("Promote error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.promoteToCommunityLeaderSuccess") });
    },
    onError: (error: any) => {
      console.error("Promote mutation error:", error);
      toast({
        title: t("community.promoteToCommunityLeaderError"),
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const demoteToMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Demoting member:", memberId);
      const { error } = await supabase
        .from("community_members")
        .update({ role: "member" })
        .eq("id", memberId);
      if (error) {
        console.error("Demote error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.demoteToMemberSuccess") });
    },
    onError: (error: any) => {
      console.error("Demote mutation error:", error);
      toast({
        title: t("community.demoteToMemberError"),
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Removing member:", memberId);
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberId);
      if (error) {
        console.error("Remove member error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.removeSuccess") });
    },
    onError: (error: any) => {
      console.error("Remove member mutation error:", error);
      toast({ 
        title: t("community.removeError"), 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !community) return;

      const { error } = await supabase.functions.invoke("send-community-invitation", {
        body: {
          email: inviteEmail,
          communityId: id,
          communityName: community.name,
          inviterName: user.email || "A worship leader",
          inviterId: user.id,
          language,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-invitations", id] });
      toast({ title: t("community.invitationSent") });
      setInviteEmail("");
    },
    onError: (error: any) => {
      console.error("Invitation error:", error);
      toast({
        title: t("community.invitationError"),
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.functions.invoke("send-community-invitation", {
        body: { invitationId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("community.invitationResent") });
    },
    onError: (error: any) => {
      console.error("Resend invitation error:", error);
      toast({
        title: t("community.invitationError"),
        variant: "destructive",
      });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log("Cancelling invitation:", invitationId);
      const { error } = await supabase
        .from("community_invitations")
        .delete()
        .eq("id", invitationId);
      if (error) {
        console.error("Cancel invitation error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-invitations", id] });
      toast({ title: t("community.invitationCancelled") });
    },
    onError: (error: any) => {
      console.error("Cancel invitation mutation error:", error);
      toast({
        title: t("community.invitationError"),
        variant: "destructive",
      });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      const memberEntry = members?.find(m => m.user_id === user?.id);
      console.log("Leaving community, member entry:", memberEntry);
      if (!memberEntry) throw new Error("Member entry not found");
      
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberEntry.id);
      if (error) {
        console.error("Leave community error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: t("community.leaveSuccess") });
      navigate("/dashboard");
      queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
    },
    onError: (error: any) => {
      console.error("Leave community mutation error:", error);
      toast({ 
        title: t("community.leaveError"), 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    },
  });

  // Check if user can manage this community
  const canManage = 
    isAdmin || // Admins can manage all communities
    community?.leader_id === user?.id || // Community owner (worship leader creator)
    members?.some(m => m.user_id === user?.id && m.role === 'community_leader'); // Community leaders

  // Check if user is at least a member
  const isMember = members?.some(m => m.user_id === user?.id);

  if (isLoading) {
    return <div className="container mx-auto py-8">{t("community.loading")}</div>;
  }

  if (!isMember && !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <p>{t("community.notAMember")}</p>
      </div>
    );
  }

  const isOwner = community?.leader_id === user?.id;

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="container mx-auto py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h1 className="text-3xl font-bold">{t("community.manage")}</h1>
              {!canManage && (
                <Badge variant="outline" className="text-sm">
                  {t("community.readOnlyMode")}
                </Badge>
              )}
            </div>

            <Tabs defaultValue="members" className="space-y-6">
              <TabsList>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="w-4 h-4" />
                  {language === "ko" ? "멤버" : "Members"}
                </TabsTrigger>
                {showRotationTab && (
                  <TabsTrigger value="rotation" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {language === "ko" ? "로테이션" : "Rotation"}
                    {!hasRotationFeature && <Lock className="w-3 h-3 ml-1" />}
                  </TabsTrigger>
                )}
                {canManage && (
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="w-4 h-4" />
                    {language === "ko" ? "설정" : "Settings"}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="members" className="space-y-6">

            {/* Email Invitation */}
            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("community.inviteByEmail")}</CardTitle>
                  <CardDescription>
                    {t("community.inviteByEmailDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      inviteMutation.mutate();
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <Input
                      type="email"
                      placeholder={t("community.enterEmail")}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button type="submit" disabled={inviteMutation.isPending} className="sm:w-auto">
                      <Send className="h-4 w-4 mr-2" />
                      {t("community.sendInvitation")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>{t("community.members")}</CardTitle>
                <CardDescription>
                  {t("community.memberCount", { count: (members?.length || 0) + (invitations?.length || 0) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Actual Members */}
                  {members?.map((member) => {
                    const isWorshipLeader = member.globalRoles?.includes('worship_leader');
                    const isCommunityLeader = member.role === 'community_leader';
                    const isLeaderOfCommunity = member.user_id === community.leader_id;

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                            <AvatarFallback>{member.profiles?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{member.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.profiles?.email}
                            </p>
                            {member.profiles?.birth_date && (
                              <p className="text-xs text-muted-foreground">
                                🎂 {new Date(member.profiles.birth_date).toLocaleDateString(
                                  language === "ko" ? "ko-KR" : "en-US",
                                  { month: "long", day: "numeric" }
                                )}
                              </p>
                            )}
                            
                            {/* Role Badges */}
                            <div className="flex flex-wrap gap-1 mt-1">
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

                        <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                          {/* Promote/Demote - Fixed: removed nested asChild pattern */}
                          {canManage && !isLeaderOfCommunity && !isWorshipLeader ? (
                            <>
                              {isCommunityLeader ? (
                                <AlertDialog>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <ArrowDown className="h-4 w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">{t("community.demoteToMember")}</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent className="sm:hidden">
                                      {t("community.demoteToMember")}
                                    </TooltipContent>
                                  </Tooltip>
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <ArrowUp className="h-4 w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">{t("community.promoteToCommunityLeader")}</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent className="sm:hidden">
                                      {t("community.promoteToCommunityLeader")}
                                    </TooltipContent>
                                  </Tooltip>
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
                          ) : null}

                          {/* Leave/Remove - Fixed: removed nested asChild pattern */}
                          {member.user_id === user?.id && !isLeaderOfCommunity ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <span className="hidden sm:inline">{t("community.leaveCommunity")}</span>
                                  <span className="sm:hidden">{t("community.leave")}</span>
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
                          ) : canManage && member.user_id !== user?.id && !isLeaderOfCommunity ? (
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t("common.remove")}
                                </TooltipContent>
                              </Tooltip>
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
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Pending Invitations - Only visible to managers */}
                  {canManage && invitations && invitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-sm font-semibold mb-3">{t("community.pendingInvitations")}</h3>
                    </div>
                  )}
                  {canManage && invitations?.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <Mail className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("community.invitedOn", {
                              date: new Date(invitation.created_at!).toLocaleDateString(
                                language === "ko" ? "ko-KR" : "en-US"
                              ),
                            })}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {t("community.statusPending")}
                          </Badge>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                          {/* Resend button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resendInviteMutation.mutate(invitation.id)}
                                disabled={resendInviteMutation.isPending}
                              >
                                <Mail className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t("community.resendInvitation")}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden">
                              {t("community.resendInvitation")}
                            </TooltipContent>
                          </Tooltip>

                          {/* Cancel/Delete button - Fixed: removed nested asChild pattern */}
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("community.cancelInvitation")}
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("community.cancelInvitationTitle")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("community.cancelInvitationDescription", {
                                    email: invitation.email,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelInviteMutation.mutate(invitation.id)}
                                >
                                  {t("community.cancelInvitation")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Rotation Tab - Only for Church Account communities */}
              {showRotationTab && (
                <TabsContent value="rotation">
                  {hasRotationFeature ? (
                    <CommunityTeamRotationTab 
                      communityId={id!}
                      churchAccountId={community?.church_account_id}
                      isAdmin={canManage}
                    />
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          {language === "ko" ? "구독이 필요한 기능" : "Subscription Required"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {language === "ko" 
                            ? "팀 로테이션 기능을 사용하려면 교회 계정 구독이 필요합니다."
                            : "Subscribe to Church Account to use team rotation feature."}
                        </p>
                        <Button onClick={() => setShowUpgradeDialog(true)}>
                          {language === "ko" ? "플랜 선택하기" : "Choose a Plan"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}

              {/* Settings Tab - Only for managers */}
              {canManage && (
                <TabsContent value="settings" className="space-y-6">
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
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        <UpgradePlanDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog}
        />
      </TooltipProvider>
    </AppLayout>
  );
}
