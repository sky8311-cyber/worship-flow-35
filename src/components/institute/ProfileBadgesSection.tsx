import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileBadgesSectionProps {
  userId: string;
}

export function ProfileBadgesSection({ userId }: ProfileBadgesSectionProps) {
  const { language } = useTranslation();

  const { data: badges = [] } = useQuery({
    queryKey: ["institute-badges", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_badges")
        .select("*, institute_certifications(title_ko, title, badge_image_url)")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" />
        K-Worship Certified
      </h3>

      {badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link to="/institute" className="text-primary hover:underline">
            {language === "ko" ? "/institute에서 과정을 시작해보세요" : "Start a course at /institute"}
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge: any) => {
            const cert = badge.institute_certifications;
            const awardedDate = badge.awarded_at
              ? new Date(badge.awarded_at).toLocaleDateString(
                  language === "ko" ? "ko-KR" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )
              : "";

            return (
              <Card key={badge.id} className="p-4 flex items-center gap-3">
                {cert?.badge_image_url ? (
                  <img src={cert.badge_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {language === "ko" ? cert?.title_ko : cert?.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{awardedDate}</p>
                  <Badge variant="outline" className="text-[10px] mt-1 text-primary border-primary/30">
                    K-Worship Certified
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
