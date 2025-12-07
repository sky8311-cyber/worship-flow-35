import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery } from "@tanstack/react-query";
import { Users, ChurchIcon, Loader2 } from "lucide-react";

const InvitedSignUp = () => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const signupInProgress = useRef(false); // Flag to prevent redirect during fresh signup
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    birthDate: "",
  });

  // Fetch invitation details using SECURITY DEFINER function (works for unauthenticated users)
  const { data: invitation, isLoading: invitationLoading, error: invitationError } = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      if (!invitationId) throw new Error("No invitation ID");
      
      // Use SECURITY DEFINER function to bypass RLS for unauthenticated users
      const { data: inviteData, error: inviteError } = await supabase
        .rpc("get_invitation_by_id", { invitation_uuid: invitationId })
        .maybeSingle();
      
      if (inviteError) throw inviteError;
      if (!inviteData) return null;
      
      // Then get community (public data)
      const { data: community } = await supabase
        .from("worship_communities")
        .select("id, name, description, avatar_url")
        .eq("id", inviteData.community_id)
        .single();
      
      // Then get inviter (public data)
      const { data: inviter } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", inviteData.invited_by)
        .single();
      
      return {
        ...inviteData,
        community,
        inviter,
      };
    },
    enabled: !!invitationId,
  });

  // If user is already logged in (before visiting this page), redirect to AcceptInvitation
  // Skip redirect if signup is in progress (we handle the flow locally)
  useEffect(() => {
    if (!authLoading && user && !signupInProgress.current) {
      navigate(`/accept-invitation/${invitationId}`);
    }
  }, [authLoading, user, navigate, invitationId]);

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation?.email) {
      setFormData(prev => ({ ...prev, email: invitation.email }));
    }
  }, [invitation?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    signupInProgress.current = true; // Prevent useEffect redirect during signup flow
    
    // Sign up the user
    const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone, formData.birthDate);
    
    if (error) {
      signupInProgress.current = false; // Reset flag on error
      
      // Check if user already exists
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        toast({
          title: t("invitedSignUp.accountExists"),
          description: t("invitedSignUp.pleaseLogin"),
        });
        setLoading(false);
        navigate(`/login?redirect=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`);
        return;
      }
      
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Wait a moment for the auth state to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the current user
    const { data: { user: newUser } } = await supabase.auth.getUser();
    
    if (!newUser) {
      toast({
        title: t("auth.error"),
        description: "Failed to get user after signup",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Add user to community using upsert to handle duplicates gracefully
    const { error: memberError } = await supabase
      .from("community_members")
      .upsert({
        community_id: invitation?.community_id,
        user_id: newUser.id,
        role: invitation?.role || "member",
      }, { onConflict: 'community_id,user_id' });
    
    if (memberError) {
      // Suppress duplicate key errors - user is already a member (which is fine)
      if (!memberError.message?.includes('duplicate')) {
        console.error("Failed to add to community:", memberError);
      }
      // Don't block - they can accept invitation later
    }
    
    // Update invitation status
    const { error: inviteUpdateError } = await supabase
      .from("community_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);
    
    if (inviteUpdateError) {
      console.error("Failed to update invitation:", inviteUpdateError);
    }
    
    // Send welcome email
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email: formData.email, name: formData.fullName }
      });
    } catch (emailError) {
      console.log('Welcome email failed, but signup succeeded:', emailError);
    }
    
    toast({
      title: t("invitedSignUp.success"),
      description: t("invitedSignUp.welcomeToCommunity", { communityName: invitation?.community?.name }),
    });
    
    setLoading(false);
    navigate("/dashboard");
  };

  // Loading state
  if (authLoading || invitationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired invitation
  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">{t("invitedSignUp.invalidInvitation")}</CardTitle>
            <CardDescription>{t("invitedSignUp.invalidInvitationDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              {t("auth.backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">{t("invitedSignUp.expiredInvitation")}</CardTitle>
            <CardDescription>{t("invitedSignUp.expiredInvitationDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              {t("auth.backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is already accepted
  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("invitedSignUp.alreadyAccepted")}</CardTitle>
            <CardDescription>{t("invitedSignUp.alreadyAcceptedDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              {t("auth.login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Community info banner */}
          <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              {invitation.community?.avatar_url ? (
                <img 
                  src={invitation.community.avatar_url} 
                  alt={invitation.community?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChurchIcon className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("invitedSignUp.invitedBy", { inviterName: invitation.inviter?.full_name || "A worship leader" })}
            </p>
            <p className="font-semibold text-lg text-foreground">
              {invitation.community?.name}
            </p>
          </div>
          
          <CardTitle>{t("invitedSignUp.title")}</CardTitle>
          <CardDescription>{t("invitedSignUp.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("invitedSignUp.emailLocked")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">{t("auth.birthDate")}</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.loading")}
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  {t("invitedSignUp.joinCommunity")}
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`)}
              >
                {t("auth.login")}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitedSignUp;
