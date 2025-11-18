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
import { Trash2, Mail, ArrowLeft, Copy } from "lucide-react";
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
  const { user } = useAuth();
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
        .select("id, full_name, email")
        .in("id", userIds);
      if (profileError) throw profileError;
      
      // Merge
      return members.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.user_id)
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

  const isLeader = community?.leader_id === user?.id;

  if (isLoading) {
    return <div className="container mx-auto py-8">{t("community.loading")}</div>;
  }

  if (!isLeader) {
    return (
      <div className="container mx-auto py-8">
        <p>You don't have permission to manage this community.</p>
      </div>
    );
  }

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
              <div className="space-y-2">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                    </div>
                    {member.user_id !== community.leader_id && (
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
                              Are you sure you want to remove this member?
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
                ))}
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
