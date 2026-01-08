import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Crown, Shield, User, Trash2, UserPlus, Loader2, Mail } from "lucide-react";

interface ChurchAccountMembersTabProps {
  churchAccountId: string;
  maxSeats: number;
  usedSeats: number;
  isAdmin: boolean;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function ChurchAccountMembersTab({ churchAccountId, maxSeats, usedSeats, isAdmin }: ChurchAccountMembersTabProps) {
  const { user } = useAuth();
  const { language } = useLanguageContext();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Fetch members
  const { data: members, isLoading } = useQuery({
    queryKey: ["church-account-members", churchAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_account_members")
        .select(`
          *,
          profile:profiles!church_account_members_user_id_fkey(id, email, full_name, avatar_url)
        `)
        .eq("church_account_id", churchAccountId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Member[];
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // First find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      
      if (profileError || !profile) {
        throw new Error(language === "ko" ? "해당 이메일의 사용자를 찾을 수 없습니다" : "User not found with this email");
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("church_account_members")
        .select("id")
        .eq("church_account_id", churchAccountId)
        .eq("user_id", profile.id)
        .single();
      
      if (existing) {
        throw new Error(language === "ko" ? "이미 멤버입니다" : "Already a member");
      }

      // Add member
      const { error } = await supabase
        .from("church_account_members")
        .insert({
          church_account_id: churchAccountId,
          user_id: profile.id,
          role,
        });
      
      if (error) throw error;

      // Update used_seats
      const { error: updateError } = await supabase
        .from("church_accounts")
        .update({ used_seats: usedSeats + 1 })
        .eq("id", churchAccountId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "멤버가 추가되었습니다" : "Member added");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
      queryClient.invalidateQueries({ queryKey: ["church-account-members", churchAccountId] });
      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("church_account_members")
        .update({ role })
        .eq("id", memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 변경되었습니다" : "Role updated");
      queryClient.invalidateQueries({ queryKey: ["church-account-members", churchAccountId] });
    },
    onError: () => {
      toast.error(language === "ko" ? "역할 변경 실패" : "Failed to update role");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("church_account_members")
        .delete()
        .eq("id", memberId);
      
      if (error) throw error;

      // Update used_seats
      const { error: updateError } = await supabase
        .from("church_accounts")
        .update({ used_seats: Math.max(1, usedSeats - 1) })
        .eq("id", churchAccountId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "멤버가 제거되었습니다" : "Member removed");
      queryClient.invalidateQueries({ queryKey: ["church-account-members", churchAccountId] });
      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
    },
    onError: () => {
      toast.error(language === "ko" ? "멤버 제거 실패" : "Failed to remove member");
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />{language === "ko" ? "소유자" : "Owner"}</Badge>;
      case "admin":
        return <Badge className="bg-blue-500"><Shield className="w-3 h-3 mr-1" />{language === "ko" ? "관리자" : "Admin"}</Badge>;
      default:
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />{language === "ko" ? "멤버" : "Member"}</Badge>;
    }
  };

  const canAddMore = usedSeats < maxSeats;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{language === "ko" ? "팀 멤버 관리" : "Team Member Management"}</CardTitle>
            <CardDescription>
              {language === "ko"
                ? `${usedSeats}/${maxSeats} 팀 멤버 등록됨`
                : `${usedSeats}/${maxSeats} team members joined`}
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button disabled={!canAddMore} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {language === "ko" ? "멤버 추가" : "Add Member"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "ko" ? "멤버 추가" : "Add Member"}</DialogTitle>
                  <DialogDescription>
                    {language === "ko"
                      ? "K-Worship에 가입된 사용자를 이메일로 검색하여 추가합니다."
                      : "Search and add K-Worship users by email."}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "이메일" : "Email"}</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "역할" : "Role"}</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{language === "ko" ? "멤버" : "Member"}</SelectItem>
                        <SelectItem value="admin">{language === "ko" ? "관리자" : "Admin"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                      {language === "ko" ? "취소" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={addMemberMutation.isPending}>
                      {addMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {language === "ko" ? "추가" : "Add"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {!canAddMore && (
          <p className="text-sm text-amber-600 mt-2">
            {language === "ko"
              ? "팀 멤버 최대 인원에 도달했습니다. 더 추가하려면 멤버십을 업그레이드하세요."
              : "Maximum team members reached. Upgrade your membership to add more."}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !members?.length ? (
          <p className="text-center text-muted-foreground py-8">
            {language === "ko" ? "멤버가 없습니다" : "No members"}
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {member.profile?.id ? (
                    <AvatarWithLevel
                      userId={member.profile.id}
                      avatarUrl={member.profile.avatar_url}
                      fallback={member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || "?"}
                      size="md"
                      className="w-10 h-10"
                    />
                  ) : (
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <p className="font-medium">
                      {member.profile?.full_name || (language === "ko" ? "이름 없음" : "No name")}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.profile?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && member.role !== "owner" ? (
                    <Select
                      value={member.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{language === "ko" ? "멤버" : "Member"}</SelectItem>
                        <SelectItem value="admin">{language === "ko" ? "관리자" : "Admin"}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getRoleBadge(member.role)
                  )}
                  {isAdmin && member.role !== "owner" && member.user_id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{language === "ko" ? "멤버 제거" : "Remove Member"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === "ko"
                              ? `${member.profile?.full_name || member.profile?.email}님을 예배 공동체 계정에서 제거하시겠습니까?`
                              : `Remove ${member.profile?.full_name || member.profile?.email} from this Worship Community Account?`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {language === "ko" ? "제거" : "Remove"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
