import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Instagram, Youtube, Calendar, Users, UserCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AvatarEditDialog } from "@/components/profile/AvatarEditDialog";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { SeedWidget } from "@/components/seeds/SeedWidget";

interface ProfileStats {
  sets: number;
  communities: number;
  collaborations: number;
}

interface Profile {
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
}

interface ProfileSidebarCardProps {
  stats?: ProfileStats;
  profileOverride?: Profile;
}

export function ProfileSidebarCard({ stats, profileOverride }: ProfileSidebarCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile: authProfile, user } = useAuth();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const profile = profileOverride || authProfile;

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || "U";

  const StatItem = ({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-xl font-bold">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Avatar + Edit Icon */}
          <div className="relative group mx-auto w-40">
            <div className="cursor-pointer" onClick={() => setAvatarDialogOpen(true)}>
              {profile?.id ? (
                <AvatarWithLevel
                  userId={profile.id}
                  avatarUrl={profile.avatar_url}
                  fallback={initials}
                  size="lg"
                  className="w-40 h-40 ring-2 ring-offset-2 ring-primary/20 hover:ring-primary/40 transition-all"
                />
              ) : (
                <Avatar className="w-40 h-40 ring-2 ring-offset-2 ring-primary/20">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              )}
            </div>
            {!profileOverride && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-1 -right-1 rounded-full bg-card shadow-md border opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => setEditDialogOpen(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-center mt-4">
            {profile?.full_name || t("profile.yourName")}
          </h3>

          {/* Profile Badges */}
          {(profile?.location || profile?.ministry_role || profile?.instrument) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {profile?.location && (
                <Badge variant="secondary" className="text-xs">
                  {profile.location}
                </Badge>
              )}
              {profile?.ministry_role && (
                <Badge variant="secondary" className="text-xs">
                  {profile.ministry_role}
                </Badge>
              )}
              {profile?.instrument && (
                <Badge variant="secondary" className="text-xs">
                  {profile.instrument}
                </Badge>
              )}
            </div>
          )}

          {/* Bio */}
          <p className="text-sm text-muted-foreground text-center mt-2 line-clamp-2 min-h-[40px]">
            {profile?.bio || t("profile.addBio")}
          </p>

          {/* Seed Widget */}
          {!profileOverride && <SeedWidget />}

          {/* Social Links */}
          <div className="flex justify-center gap-2 mt-4">
            {profile?.instagram_url ? (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-pink-100 dark:hover:bg-pink-950">
                  <Instagram className="w-4 h-4" />
                </Button>
              </a>
            ) : null}
            {profile?.youtube_url ? (
              <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-red-100 dark:hover:bg-red-950">
                  <Youtube className="w-4 h-4" />
                </Button>
              </a>
            ) : null}
            {!profile?.instagram_url && !profile?.youtube_url && !profileOverride && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {t("profile.addSocial")}
              </Button>
            )}
          </div>

          {/* Stats Row - Only show if stats provided */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
              <StatItem
                icon={<Calendar className="w-4 h-4" />}
                count={stats.sets || 0}
                label={t("profile.sets")}
              />
              <StatItem
                icon={<Users className="w-4 h-4" />}
                count={stats.communities || 0}
                label={t("profile.communities")}
              />
              <StatItem
                icon={<UserCheck className="w-4 h-4" />}
                count={stats.collaborations || 0}
                label={t("profile.collabs")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {!profileOverride && (
        <>
          <AvatarEditDialog
            open={avatarDialogOpen}
            onOpenChange={setAvatarDialogOpen}
            currentUrl={profile?.avatar_url || null}
          />
          <ProfileEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
        </>
      )}
    </>
  );
}
