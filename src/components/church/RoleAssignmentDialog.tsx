import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { User, Mail, Loader2, X, Send, Users } from "lucide-react";

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
  roleNameKo?: string | null;
  roleColor: string;
  churchAccountId: string;
  visibleCommunityIds: string[];
}

interface Assignment {
  id: string;
  user_id: string;
  community_id: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  community?: {
    name: string;
  };
}

interface CommunityMember {
  user_id: string;
  community_id: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  community?: {
    id: string;
    name: string;
  };
}

export function RoleAssignmentDialog({
  open,
  onOpenChange,
  roleId,
  roleName,
  roleNameKo,
  roleColor,
  churchAccountId,
  visibleCommunityIds,
}: RoleAssignmentDialogProps) {
  const { language } = useLanguageContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedCommunityForInvite, setSelectedCommunityForInvite] = useState("");

  // Fetch current assignments for this role
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["role-assignments", roleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_role_assignments")
        .select(`
          id,
          user_id,
          community_id
        `)
        .eq("role_id", roleId);
      
      if (error) throw error;
      
      // Fetch profiles and communities separately
      if (!data || data.length === 0) return [];
      
      const userIds = [...new Set(data.map(d => d.user_id))];
      const communityIds = [...new Set(data.map(d => d.community_id))];
      
      const [profilesRes, communitiesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email").in("id", userIds),
        supabase.from("worship_communities").select("id, name").in("id", communityIds)
      ]);
      
      return data.map(d => ({
        ...d,
        profile: profilesRes.data?.find(p => p.id === d.user_id),
        community: communitiesRes.data?.find(c => c.id === d.community_id)
      })) as Assignment[];
    },
    enabled: open,
  });

  // Fetch members from visible communities
  const { data: availableMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ["community-members-for-assignment", visibleCommunityIds],
    queryFn: async () => {
      if (visibleCommunityIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("community_members")
        .select("user_id, community_id")
        .in("community_id", visibleCommunityIds);
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      const userIds = [...new Set(data.map(d => d.user_id))];
      const communityIds = [...new Set(data.map(d => d.community_id))];
      
      const [profilesRes, communitiesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email").in("id", userIds),
        supabase.from("worship_communities").select("id, name").in("id", communityIds)
      ]);
      
      return data.map(d => ({
        ...d,
        profile: profilesRes.data?.find(p => p.id === d.user_id),
        community: communitiesRes.data?.find(c => c.id === d.community_id)
      })) as CommunityMember[];
    },
    enabled: open && visibleCommunityIds.length > 0,
  });

  // Fetch visible communities for invite dropdown
  const { data: communities } = useQuery({
    queryKey: ["communities-for-invite", visibleCommunityIds],
    queryFn: async () => {
      if (visibleCommunityIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("worship_communities")
        .select("id, name")
        .in("id", visibleCommunityIds);
      
      if (error) throw error;
      return data;
    },
    enabled: open && visibleCommunityIds.length > 0,
  });

  // Assign role mutation
  const assignMutation = useMutation({
    mutationFn: async (members: { userId: string; communityId: string }[]) => {
      const insertData = members.map(m => ({
        role_id: roleId,
        user_id: m.userId,
        community_id: m.communityId,
        assigned_by: user?.id,
      }));
      
      const { error } = await supabase
        .from("church_role_assignments")
        .upsert(insertData, { onConflict: "role_id,user_id,community_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 할당되었습니다" : "Role assigned");
      queryClient.invalidateQueries({ queryKey: ["role-assignments", roleId] });
      setSelectedMembers(new Set());
    },
    onError: () => {
      toast.error(language === "ko" ? "역할 할당 실패" : "Failed to assign role");
    },
  });

  // Remove assignment mutation
  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("church_role_assignments")
        .delete()
        .eq("id", assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 해제되었습니다" : "Role removed");
      queryClient.invalidateQueries({ queryKey: ["role-assignments", roleId] });
    },
  });

  // Invite by email mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCommunityForInvite || !inviteEmail) return;
      
      const community = communities?.find(c => c.id === selectedCommunityForInvite);
      
      const { error } = await supabase.functions.invoke("send-community-invitation", {
        body: {
          email: inviteEmail,
          communityId: selectedCommunityForInvite,
          communityName: community?.name || "Community",
          inviterName: user?.email || "Admin",
          inviterId: user?.id,
          roleId: roleId, // Pass role for auto-assignment on accept
          language,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "초대가 발송되었습니다" : "Invitation sent");
      setInviteEmail("");
      setSelectedCommunityForInvite("");
    },
    onError: () => {
      toast.error(language === "ko" ? "초대 발송 실패" : "Failed to send invitation");
    },
  });

  const handleToggleMember = (key: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkAssign = () => {
    const membersToAssign = Array.from(selectedMembers).map(key => {
      const [userId, communityId] = key.split(":");
      return { userId, communityId };
    });
    assignMutation.mutate(membersToAssign);
  };

  // Filter out already assigned members
  const unassignedMembers = availableMembers?.filter(m => 
    !assignments?.some(a => a.user_id === m.user_id && a.community_id === m.community_id)
  );

  const displayName = language === "ko" && roleNameKo ? roleNameKo : roleName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: roleColor }}
            >
              <Users className="w-4 h-4" />
            </div>
            {language === "ko" ? `"${displayName}" 역할 할당` : `Assign "${displayName}" Role`}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "이 역할을 할당할 멤버를 선택하거나 이메일로 초대하세요."
              : "Select members to assign this role or invite by email."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assign" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assign">
              {language === "ko" ? "멤버 선택" : "Select Members"}
            </TabsTrigger>
            <TabsTrigger value="current">
              {language === "ko" ? "현재 할당" : "Current"} ({assignments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invite">
              {language === "ko" ? "이메일 초대" : "Email Invite"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="flex-1 mt-4 min-h-0">
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleCommunityIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{language === "ko" ? "먼저 커뮤니티 가시성을 설정하세요" : "Set community visibility first"}</p>
              </div>
            ) : !unassignedMembers?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{language === "ko" ? "할당 가능한 멤버가 없습니다" : "No available members"}</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {unassignedMembers.map((member) => {
                      const key = `${member.user_id}:${member.community_id}`;
                      const isSelected = selectedMembers.has(key);
                      
                      return (
                        <div 
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent"
                          }`}
                          onClick={() => handleToggleMember(key)}
                        >
                          <Checkbox checked={isSelected} />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.profile?.full_name || member.profile?.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.community?.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {selectedMembers.size > 0 && (
                  <div className="pt-4 border-t mt-4">
                    <Button 
                      onClick={handleBulkAssign}
                      disabled={assignMutation.isPending}
                      className="w-full"
                    >
                      {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {language === "ko" 
                        ? `${selectedMembers.size}명에게 역할 할당`
                        : `Assign role to ${selectedMembers.size} members`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="current" className="flex-1 mt-4 min-h-0">
            {loadingAssignments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !assignments?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{language === "ko" ? "할당된 멤버가 없습니다" : "No assigned members"}</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {assignment.profile?.full_name || assignment.profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {assignment.community?.name}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeMutation.mutate(assignment.id)}
                        disabled={removeMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="invite" className="flex-1 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "ko"
                  ? "이메일로 초대하면 수락 시 자동으로 이 역할이 할당됩니다."
                  : "When invited by email, this role will be automatically assigned upon acceptance."}
              </p>
              
              <div className="space-y-2">
                <Label>{language === "ko" ? "커뮤니티 선택" : "Select Community"}</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedCommunityForInvite}
                  onChange={(e) => setSelectedCommunityForInvite(e.target.value)}
                >
                  <option value="">{language === "ko" ? "커뮤니티 선택..." : "Select community..."}</option>
                  {communities?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>{language === "ko" ? "이메일 주소" : "Email Address"}</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => inviteMutation.mutate()}
                    disabled={!inviteEmail || !selectedCommunityForInvite || inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "닫기" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
