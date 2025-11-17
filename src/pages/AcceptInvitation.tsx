import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitation() {
  const { token } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data: invitation, error } = await supabase
        .from("community_invitations")
        .select("*")
        .eq("id", token)
        .eq("status", "pending")
        .maybeSingle();
      if (error) throw error;
      if (!invitation) return null;
      
      // Fetch community
      const { data: community, error: commError } = await supabase
        .from("worship_communities")
        .select("name, description")
        .eq("id", invitation.community_id)
        .single();
      if (commError) throw commError;
      
      // Fetch inviter profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", invitation.invited_by)
        .single();
      if (profileError) throw profileError;
      
      return {
        ...invitation,
        worship_communities: community,
        profiles: profile
      };
    },
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user || !invitation) return;

      // Add to community members
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: invitation.community_id,
          user_id: user.id,
          role: invitation.role || "member",
        });
      if (memberError) throw memberError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from("community_invitations")
        .update({ status: "accepted" })
        .eq("id", token);
      if (inviteError) throw inviteError;
    },
    onSuccess: () => {
      setAccepted(true);
      toast({ title: t("community.joinSuccess") });
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: () => {
      toast({ title: t("community.joinError"), variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_invitations")
        .update({ status: "declined" })
        .eq("id", token);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invitation declined" });
      navigate("/dashboard");
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Invalid or Expired Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid or has already been used.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Invitation Accepted!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Community Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a worship community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div>
              <span className="font-medium">{t("community.name")}: </span>
              <span>{invitation.worship_communities?.name}</span>
            </div>
            <div>
              <span className="font-medium">Invited by: </span>
              <span>{invitation.profiles?.full_name}</span>
            </div>
            {invitation.worship_communities?.description && (
              <div>
                <span className="font-medium">{t("community.description")}: </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {invitation.worship_communities.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => declineMutation.mutate()}
              disabled={declineMutation.isPending}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
