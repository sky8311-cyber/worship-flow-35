import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Instagram, Youtube, Calendar, Users, UserCheck, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AvatarEditDialog } from "@/components/profile/AvatarEditDialog";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";

interface ProfileStats {
  sets: number;
  communities: number;
  collaborations: number;
}

interface ProfileSidebarCardProps {
  stats?: ProfileStats;
}

export function ProfileSidebarCard({ stats }: ProfileSidebarCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      <Card className="sticky top-20">
        <CardContent className="p-6">
          {/* Avatar + Edit Icon */}
          <div className="relative group">
            <Avatar
              className="cursor-pointer mx-auto w-20 h-20 ring-2 ring-offset-2 ring-primary/20 hover:ring-primary/40 transition-all"
              onClick={() => navigate("/profile")}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-1 -right-1 rounded-full bg-card shadow-md border opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={() => setEditDialogOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-center mt-4">
            {profile?.full_name || t("profile.yourName")}
          </h3>

          {/* Ministry Role */}
          {profile?.ministry_role && (
            <p className="text-sm text-muted-foreground text-center mt-1">
              {profile.ministry_role}
            </p>
          )}

          {/* Bio */}
          <p className="text-sm text-muted-foreground text-center mt-2 line-clamp-2 min-h-[40px]">
            {profile?.bio || t("profile.addBio")}
          </p>

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
            {!profile?.instagram_url && !profile?.youtube_url && (
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

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
            <StatItem
              icon={<Calendar className="w-4 h-4" />}
              count={stats?.sets || 0}
              label={t("profile.sets")}
            />
            <StatItem
              icon={<Users className="w-4 h-4" />}
              count={stats?.communities || 0}
              label={t("profile.communities")}
            />
            <StatItem
              icon={<UserCheck className="w-4 h-4" />}
              count={stats?.collaborations || 0}
              label={t("profile.collabs")}
            />
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/profile")}
          >
            {t("profile.viewProfile")}
          </Button>
        </CardContent>
      </Card>

      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentUrl={profile?.avatar_url || null}
      />
      <ProfileEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </>
  );
}
