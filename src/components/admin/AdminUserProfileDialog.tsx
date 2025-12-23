import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { RoleBadge } from "@/components/RoleBadge";
import { Phone, Calendar, MapPin, Music, Church, Instagram, Youtube, Mail, Globe, Briefcase, Sprout } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface AdminUserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminUserProfileDialog({ userId, open, onOpenChange }: AdminUserProfileDialogProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Worship leader info is now in profiles table, no separate query needed

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!userId && open,
  });

  // Fetch seed data
  const { data: seedInfo, isLoading: seedLoading } = useQuery({
    queryKey: ["admin-user-seeds", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: seeds, error: seedsError } = await supabase
        .from("user_seeds")
        .select("total_seeds, current_level")
        .eq("user_id", userId)
        .maybeSingle();

      if (seedsError) throw seedsError;
      if (!seeds) return null;

      const { data: levelInfo, error: levelError } = await supabase
        .from("seed_levels")
        .select("name_ko, name_en, emoji, badge_color, min_seeds, max_seeds")
        .eq("level", seeds.current_level)
        .single();

      if (levelError) throw levelError;

      // Calculate progress to next level
      const currentSeeds = seeds.total_seeds;
      const minSeeds = levelInfo.min_seeds;
      const maxSeeds = levelInfo.max_seeds;
      let progress = 100;
      let seedsToNext = 0;
      
      if (maxSeeds) {
        const range = maxSeeds - minSeeds;
        const currentProgress = currentSeeds - minSeeds;
        progress = Math.min(100, Math.round((currentProgress / range) * 100));
        seedsToNext = maxSeeds - currentSeeds;
      }

      return {
        totalSeeds: seeds.total_seeds,
        currentLevel: seeds.current_level,
        levelName: language === "ko" ? levelInfo.name_ko : levelInfo.name_en,
        emoji: levelInfo.emoji,
        badgeColor: levelInfo.badge_color,
        progress,
        seedsToNext
      };
    },
    enabled: !!userId && open,
  });

  const isLoading = profileLoading || rolesLoading || seedLoading;

  const hasAdmin = userRoles?.includes("admin");
  const hasWorshipLeader = userRoles?.includes("worship_leader");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.users.viewProfile")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-xl font-semibold">{profile.full_name || "No name"}</h3>
                  {hasAdmin && <RoleBadge role="admin" />}
                  {hasWorshipLeader && <RoleBadge role="worship_leader" />}
                  {!hasAdmin && !hasWorshipLeader && <RoleBadge role="member" />}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{profile.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seed Info Section */}
            {seedInfo && (
              <>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-green-600" />
                    {t("admin.users.seedInfo")}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">{seedInfo.emoji}</div>
                      <div className="text-xs text-muted-foreground">{t("admin.users.level")}</div>
                      <div className="font-semibold">Lv.{seedInfo.currentLevel}</div>
                      <div className="text-xs text-green-600">{seedInfo.levelName}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-xs text-muted-foreground">{t("admin.users.totalSeeds")}</div>
                      <div className="font-semibold">{seedInfo.totalSeeds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">📈</div>
                      <div className="text-xs text-muted-foreground">{t("seeds.dailyProgress")}</div>
                      <div className="font-semibold">{seedInfo.progress}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <div className="text-xs text-muted-foreground">{t("seeds.seedsToNextLevel")}</div>
                      <div className="font-semibold">{seedInfo.seedsToNext > 0 ? seedInfo.seedsToNext : "MAX"}</div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${seedInfo.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Basic Info Section */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {t("admin.users.basicInfo")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.birth_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(profile.birth_date), "PPP", { locale: dateLocale })}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.instrument && (
                  <div className="flex items-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.instrument}</span>
                  </div>
                )}
                {profile.ministry_role && (
                  <div className="flex items-center gap-2 text-sm">
                    <Church className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.ministry_role}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t("admin.users.bio")}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              </>
            )}

            {/* Social Links */}
            {(profile.instagram_url || profile.youtube_url) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t("admin.users.socialLinks")}</h4>
                  <div className="flex gap-2">
                    {profile.instagram_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(profile.instagram_url!, "_blank")}
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </Button>
                    )}
                    {profile.youtube_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(profile.youtube_url!, "_blank")}
                      >
                        <Youtube className="h-4 w-4 mr-2" />
                        YouTube
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Worship Leader Profile Section - using profiles table fields */}
            {profile.church_name && (
              <>
                <Separator className="my-4" />
                <div className="bg-primary/5 p-4 rounded-lg space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Church className="h-4 w-4" />
                    {t("admin.users.worshipLeaderProfile")}
                  </h4>

                  {/* Church Info */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      {t("admin.users.churchInfo")}
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Church className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{profile.church_name}</span>
                      </div>
                      {profile.church_website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={profile.church_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profile.church_website}
                          </a>
                        </div>
                      )}
                      {profile.country && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.country}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Info */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      {t("admin.users.serviceInfo")}
                    </h5>
                    <div className="space-y-2">
                      {profile.serving_position && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.serving_position}</span>
                        </div>
                      )}
                      {profile.years_serving && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {profile.years_serving}{" "}
                            {language === "ko" ? "년" : "years"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Introduction */}
                  {profile.worship_leader_intro && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                        {t("admin.users.introduction")}
                      </h5>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {profile.worship_leader_intro}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("common.noData")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}