import { useState, useEffect } from "react";
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
import { Trash2, Mail, ArrowUp, ArrowDown, Send, Users, RefreshCw, Settings, Lock, Crown, CalendarClock } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { CommunityTeamRotationTab } from "@/components/community/CommunityTeamRotationTab";
import { CommunityRecurringCalendarTab } from "@/components/community/CommunityRecurringCalendarTab";
import { CommunityAvatarUpload } from "@/components/community/CommunityAvatarUpload";
import { UpgradePlanDialog } from "@/components/church/UpgradePlanDialog";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";
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
import { parseLocalDate } from "@/lib/dateUtils";

export default function CommunityManagement() {
  const { id } = useParams();
  const { user, isAdmin, isWorshipLeader } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    ministry_role: string | null;
    instagram_url: string | null;
    youtube_url: string | null;
    location: string | null;
    instrument: string | null;
  } | null>(null);

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

  // Check if scheduler feature is enabled
  const { isSchedulerEnabled } = useAppSettings();

  // Real-time subscription for community members updates
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`community-members-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${id}`
        },
        (payload) => {
          console.log('Member change:', payload);
          queryClient.invalidateQueries({ queryKey: ["community-members", id] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Real-time subscription for community invitations updates
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`community-invitations-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_invitations',
          filter: `community_id=eq.${id}`
        },
        (payload) => {
          console.log('Invitation change:', payload);
          queryClient.invalidateQueries({ queryKey: ["community-invitations", id] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

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
        .select("id, full_name, email, avatar_url, birth_date, bio, ministry_role, instagram_url, youtube_url, location, instrument")
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

  const { data: joinRequests } = useQuery({
    queryKey: ["community-join-requests", id],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("community_join_requests")
        .select("*")
        .eq("community_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      if (!requests || requests.length === 0) return [];
      
      // Fetch requester profiles
      const userIds = requests.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);
      
      return requests.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.id === r.user_id)
      }));
    },
    enabled: !!id,
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
      const member = members?.find(m => m.id === memberId);
      
      const { error } = await supabase
        .from("community_members")
        .update({ role: "community_leader" })
        .eq("id", memberId);
      if (error) {
        console.error("Promote error details:", error);
        throw error;
      }

      // Send notification to promoted user
      if (member && user) {
        const { data: promoterProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: member.user_id,
          type: "promoted_to_community_leader",
          title: language === "ko" 
            ? "커뮤니티 리더로 승급되었습니다!" 
            : "You've been promoted to Community Leader!",
          message: language === "ko"
            ? `${promoterProfile?.full_name || "관리자"}님이 ${community?.name} 커뮤니티의 리더로 승급시켰습니다.`
            : `${promoterProfile?.full_name || "Admin"} promoted you to leader of ${community?.name}.`,
          related_id: id,
          related_type: "community",
          metadata: {
            promoter_name: promoterProfile?.full_name,
            community_name: community?.name,
            new_role: "community_leader"
          }
        });
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
      const member = members?.find(m => m.id === memberId);
      const previousRole = member?.role;
      
      const { error } = await supabase
        .from("community_members")
        .update({ role: "member" })
        .eq("id", memberId);
      if (error) {
        console.error("Demote error details:", error);
        throw error;
      }

      // Send notification to demoted user
      if (member && user && member.user_id !== user.id) {
        const { data: demoterProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: member.user_id,
          type: "demoted_to_member",
          title: language === "ko" 
            ? "역할이 변경되었습니다" 
            : "Your role has been changed",
          message: language === "ko"
            ? `${community?.name} 커뮤니티에서 일반 멤버로 역할이 변경되었습니다.`
            : `Your role in ${community?.name} has been changed to member.`,
          related_id: id,
          related_type: "community",
          metadata: {
            community_name: community?.name,
            previous_role: previousRole,
            new_role: "member",
            actor_id: user.id,
            actor_name: demoterProfile?.full_name,
            actor_avatar: demoterProfile?.avatar_url
          }
        });
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

  // Promote to owner mutation (only for worship leaders)
  const promoteToOwnerMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log("Promoting member to owner:", memberId);
      const member = members?.find(m => m.id === memberId);
      
      const { error } = await supabase
        .from("community_members")
        .update({ role: "owner" })
        .eq("id", memberId);
      if (error) {
        console.error("Promote to owner error details:", error);
        throw error;
      }

      // Sync leader_id in worship_communities for consistency
      if (member) {
        await supabase
          .from("worship_communities")
          .update({ leader_id: member.user_id })
          .eq("id", id);
      }

      // Send notification to promoted user
      if (member && user) {
        const { data: promoterProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: member.user_id,
          type: "promoted_to_owner",
          title: language === "ko" 
            ? "오너로 승급되었습니다!" 
            : "You've been promoted to Owner!",
          message: language === "ko"
            ? `${promoterProfile?.full_name || "관리자"}님이 ${community?.name} 커뮤니티의 오너로 승급시켰습니다.`
            : `${promoterProfile?.full_name || "Admin"} promoted you to owner of ${community?.name}.`,
          related_id: id,
          related_type: "community",
          metadata: {
            promoter_name: promoterProfile?.full_name,
            community_name: community?.name,
            new_role: "owner"
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.promoteToOwnerSuccess") });
    },
    onError: (error: any) => {
      console.error("Promote to owner mutation error:", error);
      toast({
        title: t("community.promoteToOwnerError"),
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Demote from owner mutation (only for worship leaders with owner role)
  const demoteFromOwnerMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Check if this is the last owner
      const owners = members?.filter(m => m.role === "owner");
      if (owners && owners.length <= 1) {
        throw new Error("Cannot remove the last owner");
      }
      
      console.log("Demoting owner to member:", memberId);
      const { error } = await supabase
        .from("community_members")
        .update({ role: "member" })
        .eq("id", memberId);
      if (error) {
        console.error("Demote from owner error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: t("community.demoteFromOwnerSuccess") });
    },
    onError: (error: any) => {
      console.error("Demote from owner mutation error:", error);
      toast({
        title: t("community.demoteFromOwnerError"),
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
      if (!user || !community) return { sent: 0, failed: 0, invalidEmails: [] as string[] };

      // Parse comma-separated emails
      const emails = inviteEmail
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = emails.filter(e => emailRegex.test(e));
      const invalidEmails = emails.filter(e => !emailRegex.test(e));

      if (validEmails.length === 0) {
        throw new Error("No valid emails provided");
      }

      let sent = 0;
      let failed = 0;

      // Helper to add delay between requests (Resend API rate limit: 2 req/sec)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Send invitations for each valid email with rate limiting
      for (let i = 0; i < validEmails.length; i++) {
        const email = validEmails[i];
        
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await delay(500);
        }
        
        try {
          const { error } = await supabase.functions.invoke("send-community-invitation", {
            body: {
              email,
              communityId: id,
              communityName: community.name,
              inviterName: user.email || "A worship leader",
              inviterId: user.id,
              language,
            },
          });
          if (error) {
            console.error(`Failed to send invitation to ${email}:`, error);
            failed++;
          } else {
            sent++;
          }
        } catch (err) {
          console.error(`Failed to send invitation to ${email}:`, err);
          failed++;
        }
      }

      return { sent, failed, invalidEmails };
    },
    onSuccess: (result) => {
      if (!result) return;
      
      queryClient.invalidateQueries({ queryKey: ["community-invitations", id] });
      
      const { sent, failed, invalidEmails } = result;
      
      if (sent > 0 && failed === 0 && invalidEmails.length === 0) {
        toast({ 
          title: t("community.invitationsSentCount", { count: sent.toString() }),
        });
      } else if (sent > 0) {
        toast({ 
          title: t("community.invitationsPartialSuccess", { 
            sent: sent.toString(), 
            failed: (failed + invalidEmails.length).toString() 
          }),
          variant: "default",
        });
      } else {
        toast({
          title: t("community.invitationError"),
          variant: "destructive",
        });
      }
      
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

  const approveJoinRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("community_join_requests")
        .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-join-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["community-members", id] });
      toast({
        title: t("community.joinRequestApproveSuccess"),
      });
    },
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("community_join_requests")
        .update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-join-requests", id] });
      toast({
        title: t("community.joinRequestRejectSuccess"),
      });
    },
  });

  const deleteJoinRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("community_join_requests")
        .delete()
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-join-requests", id] });
      toast({ title: t("community.joinRequestDeleted") });
    },
    onError: (error: any) => {
      console.error("Delete join request error:", error);
      toast({
        title: t("community.deleteJoinRequestError"),
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

  // Delete community mutation - only for owner
  const deleteCommunityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("worship_communities")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("community.deleteSuccess") });
      navigate("/dashboard");
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
    },
    onError: (error: any) => {
      console.error("Delete community error:", error);
      toast({ 
        title: t("community.deleteError"), 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    },
  });

  // Check if user is an owner (can delete community, manage owners)
  const isOwner = members?.some(m => m.user_id === user?.id && m.role === 'owner');
  
  // Check if user can manage this community (owner or community_leader)
  const canManage = 
    isAdmin || // Admins can manage all communities
    isOwner || // Owners
    members?.some(m => m.user_id === user?.id && m.role === 'community_leader'); // Community leaders

  // Check if user can manage owners (must be owner AND worship leader)
  const canManageOwners = isOwner && isWorshipLeader;

  // Check if user is at least a member
  const isMember = members?.some(m => m.user_id === user?.id);
  
  // Count owners for safety checks
  const ownerCount = members?.filter(m => m.role === 'owner').length || 0;

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
                {isSchedulerEnabled && (
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarClock className="w-4 h-4" />
                    {t("recurringCalendar.tabLabel")}
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
                {/* Join Requests Section - Only shown to managers */}
                {canManage && joinRequests && joinRequests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {t("community.joinRequestsTitle")}
                        <Badge variant="default">{joinRequests.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {joinRequests.map((request: any) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={request.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {request.profiles?.full_name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {request.profiles ? (
                                  <>
                                    <p className="font-medium">{request.profiles.full_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {request.profiles.email}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-medium text-muted-foreground italic">
                                    {t("common.deletedUser")}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t("community.requestDate")}: {new Date(request.created_at).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {request.profiles ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveJoinRequestMutation.mutate(request.id)}
                                    disabled={approveJoinRequestMutation.isPending}
                                  >
                                    {t("community.joinRequestApprove")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectJoinRequestMutation.mutate(request.id)}
                                    disabled={rejectJoinRequestMutation.isPending}
                                  >
                                    {t("community.joinRequestReject")}
                                  </Button>
                                </>
                              ) : null}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteJoinRequestMutation.mutate(request.id)}
                                    disabled={deleteJoinRequestMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t("common.delete")}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                    className="flex flex-col gap-2"
                  >
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder={t("community.inviteEmailPlaceholder")}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="flex-1"
                      />
                      <Button type="submit" disabled={inviteMutation.isPending || !inviteEmail.trim()} className="sm:w-auto">
                        <Send className="h-4 w-4 mr-2" />
                        {t("community.sendInvitations")}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("community.multipleEmailsHint")}
                    </p>
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
                    const memberIsWorshipLeader = member.globalRoles?.includes('worship_leader');
                    const memberIsCommunityLeader = member.role === 'community_leader';
                    const memberIsOwner = member.role === 'owner';
                    const isLegacyLeader = member.user_id === community.leader_id; // Original creator

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                            onClick={() => member.profiles && setSelectedProfile(member.profiles)}
                          >
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
                                🎂 {parseLocalDate(member.profiles.birth_date).toLocaleDateString(
                                  language === "ko" ? "ko-KR" : "en-US",
                                  { month: "long", day: "numeric" }
                                )}
                              </p>
                            )}
                            
                            {/* Role Badges */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {memberIsOwner && <RoleBadge role="community_owner" />}
                              {memberIsWorshipLeader && <RoleBadge role="worship_leader" />}
                              {memberIsCommunityLeader && !memberIsOwner && (
                                <RoleBadge role="community_leader" />
                              )}
                              {!memberIsCommunityLeader && !memberIsOwner && (
                                <RoleBadge role="member" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                          {/* Owner Management - Only owners who are worship leaders can manage other owners */}
                          {canManageOwners && member.user_id !== user?.id && memberIsWorshipLeader && !memberIsOwner && (
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                                      <Crown className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">{t("community.promoteToOwner")}</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent className="sm:hidden">
                                  {t("community.promoteToOwner")}
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("community.promoteToOwnerConfirmTitle")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <p>
                                      {t("community.promoteToOwnerConfirmDescription", {
                                        name: member.profiles?.full_name,
                                      })}
                                    </p>
                                    <div className="mt-3 p-3 bg-muted rounded-md">
                                      <p className="text-sm font-semibold mb-2">
                                        {t("community.ownerPermissions")}:
                                      </p>
                                      <ul className="text-sm space-y-1 list-disc list-inside">
                                        <li>{t("community.permissionDeleteCommunity")}</li>
                                        <li>{t("community.permissionManageOwners")}</li>
                                        <li>{t("community.permissionFullControl")}</li>
                                      </ul>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => promoteToOwnerMutation.mutate(member.id)}
                                  >
                                    {t("community.promoteToOwner")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Remove Owner Role - Only if there are multiple owners */}
                          {canManageOwners && member.user_id !== user?.id && memberIsOwner && ownerCount > 1 && (
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                                      <ArrowDown className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">{t("community.removeOwnerRole")}</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent className="sm:hidden">
                                  {t("community.removeOwnerRole")}
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("community.removeOwnerRoleConfirmTitle")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("community.removeOwnerRoleConfirmDescription", {
                                      name: member.profiles?.full_name,
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => demoteFromOwnerMutation.mutate(member.id)}
                                  >
                                    {t("community.removeOwnerRole")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Promote/Demote Community Leader - Not for owners or worship leaders */}
                          {canManage && !memberIsOwner && !memberIsWorshipLeader ? (
                            <>
                              {memberIsCommunityLeader ? (
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

                          {/* Leave/Remove */}
                          {member.user_id === user?.id && !memberIsOwner ? (
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
                          ) : canManage && member.user_id !== user?.id && !memberIsOwner ? (
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

              {/* Calendar Tab - Recurring schedules */}
              {isSchedulerEnabled && id && (
                <TabsContent value="calendar">
                  <CommunityRecurringCalendarTab communityId={id} />
                </TabsContent>
              )}

              {/* Settings Tab - Only for managers */}
              {canManage && (
                <TabsContent value="settings" className="space-y-6">
                  {/* Community Avatar */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "ko" ? "커뮤니티 프로필 사진" : "Community Profile Photo"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CommunityAvatarUpload
                        communityId={id!}
                        communityName={community?.name || ""}
                        currentUrl={community?.avatar_url}
                        onUploadSuccess={(url) => {
                          queryClient.invalidateQueries({ queryKey: ["community", id] });
                        }}
                      />
                    </CardContent>
                  </Card>

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

                  {/* Delete Community - Only for owner */}
                  {isOwner && (
                    <Card className="border-destructive/50">
                      <CardHeader>
                        <CardTitle className="text-destructive">{t("community.dangerZone")}</CardTitle>
                        <CardDescription>
                          {t("community.dangerZoneDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("community.deleteCommunity")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("community.deleteConfirmTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("community.deleteConfirmDescription")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCommunityMutation.mutate()}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("community.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        <UpgradePlanDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog}
        />

        <ProfileDialog
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
          profileOverride={selectedProfile || undefined}
          title={language === "ko" ? "멤버 프로필" : "Member Profile"}
        />
      </TooltipProvider>
    </AppLayout>
  );
}
