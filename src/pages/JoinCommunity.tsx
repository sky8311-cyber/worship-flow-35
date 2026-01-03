import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { creditFirstCommunityJoinReward } from "@/lib/rewardsHelper";

const JoinCommunity = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinCommunity = async () => {
      if (!token) {
        setError(t("community.communityNotFound"));
        setLoading(false);
        return;
      }

      // Check if user is logged in
      if (!user) {
        localStorage.setItem("redirectAfterLogin", `/join/${token}`);
        navigate("/auth/login");
        return;
      }

      try {
        // Look up community by invite token
        const { data: communityData, error: communityError } = await supabase
          .from("worship_communities")
          .select("*")
          .eq("invite_token", token)
          .single();

        if (communityError || !communityData) {
          setError(t("community.communityNotFound"));
          setLoading(false);
          return;
        }

        setCommunity(communityData);

        // Check if already a member
        const { data: existingMember } = await supabase
          .from("community_members")
          .select("*")
          .eq("community_id", communityData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingMember) {
          toast({
            title: t("community.alreadyMember"),
            description: communityData.name,
          });
          navigate("/dashboard");
          return;
        }

        // Add user to community
        const { error: insertError } = await supabase
          .from("community_members")
          .insert({
            community_id: communityData.id,
            user_id: user.id,
            role: "member",
          });

        if (insertError) throw insertError;

        // Credit K-Seed reward for first community join (fire-and-forget)
        creditFirstCommunityJoinReward(user.id, communityData.id);

        toast({
          title: t("community.joinSuccess"),
          description: communityData.name,
        });
        navigate("/dashboard");
      } catch (err) {
        console.error("Error joining community:", err);
        setError(t("community.communityNotFound"));
        setLoading(false);
      }
    };

    joinCommunity();
  }, [token, user, navigate, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("community.joiningCommunity")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("common.error")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              {t("common.backToDashboard")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default JoinCommunity;
