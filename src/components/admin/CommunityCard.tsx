import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    is_active: boolean;
    profiles?: {
      full_name: string;
      email: string;
    };
    community_members?: number;
    service_sets?: number;
  };
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function CommunityCard({ community, onToggleActive }: CommunityCardProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const leader = community.profiles as any;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{community.name}</h3>
              {community.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {community.description}
                </p>
              )}
            </div>
            <Badge variant={community.is_active ? "default" : "secondary"}>
              {community.is_active ? t("admin.communities.active") : t("admin.communities.inactive")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
            <div>
              <p className="text-muted-foreground text-xs">{t("admin.communities.leader")}</p>
              <p className="font-medium">{leader?.full_name || "-"}</p>
              <p className="text-xs text-muted-foreground truncate">{leader?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("admin.communities.created")}</p>
              <p className="font-medium">{format(new Date(community.created_at), "PP", { locale: dateLocale })}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{community.community_members || 0} {t("admin.communities.members")}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {community.service_sets || 0} {t("admin.communities.sets")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("admin.communities.actions")}</span>
              <Switch
                checked={community.is_active}
                onCheckedChange={(checked) => onToggleActive(community.id, checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
