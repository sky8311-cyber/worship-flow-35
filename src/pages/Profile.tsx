import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, MapPin, Instagram, Youtube } from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = targetUserId === currentUser?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);
      return data?.map(r => r.role) || [];
    },
    enabled: !!targetUserId,
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", targetUserId],
    queryFn: async () => {
      const [communities, sets, collaborations] = await Promise.all([
        supabase
          .from("community_members")
          .select("id", { count: 'exact' })
          .eq("user_id", targetUserId),
        supabase
          .from("service_sets")
          .select("id", { count: 'exact' })
          .eq("created_by", targetUserId),
        supabase
          .from("set_collaborators")
          .select("id", { count: 'exact' })
          .eq("user_id", targetUserId),
      ]);

      return {
        communities: communities.count || 0,
        sets: sets.count || 0,
        collaborations: collaborations.count || 0,
      };
    },
    enabled: !!targetUserId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{t("profile.notFound")}</div>
      </div>
    );
  }

  const initials = profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-primary/10">
        {profile.cover_image_url && (
          <img 
            src={profile.cover_image_url} 
            className="w-full h-full object-cover" 
            alt="Cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-20">
        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.full_name || profile.email}</h1>
                  {profile.ministry_role && (
                    <p className="text-muted-foreground">{profile.ministry_role}</p>
                  )}
                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </p>
                  )}
                </div>

                {isOwnProfile && (
                  <Button onClick={() => navigate("/profile/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t("profile.editProfile")}
                  </Button>
                )}
              </div>

              {/* Roles */}
              {userRoles && userRoles.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {userRoles.includes('worship_leader') && (
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                      {t("community.worshipLeader")}
                    </Badge>
                  )}
                  {userRoles.includes('admin') && (
                    <Badge variant="destructive">
                      {t("common.admin")}
                    </Badge>
                  )}
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Instagram className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {profile.youtube_url && (
                  <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Youtube className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">{t("profile.bio")}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                {stats?.communities || 0}
              </CardTitle>
              <CardDescription className="text-center">
                {t("profile.communities")}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                {stats?.sets || 0}
              </CardTitle>
              <CardDescription className="text-center">
                {t("profile.sets")}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                {stats?.collaborations || 0}
              </CardTitle>
              <CardDescription className="text-center">
                {t("profile.collaborations")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
