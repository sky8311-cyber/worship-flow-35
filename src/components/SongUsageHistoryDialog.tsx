import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ArrowRight, Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSongUsage, SongUsageItem } from "@/hooks/useSongUsage";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface SongUsageHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  songTitle: string;
}

export const SongUsageHistoryDialog = ({
  open,
  onOpenChange,
  songId,
  songTitle,
}: SongUsageHistoryDialogProps) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { data: usageData, isLoading } = useSongUsage(songId);

  const handleOpenSet = (item: SongUsageItem) => {
    onOpenChange(false);
    if (item.is_same_community && item.can_edit) {
      navigate(`/set-builder/${item.service_set_id}`);
    } else {
      navigate(`/band-view/${item.service_set_id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy-MM-dd (EEE)", {
        locale: language === "ko" ? ko : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
            {t("songUsage.usageHistoryTitle")}
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-2" style={{ wordBreak: "keep-all" }}>
            {songTitle}
          </p>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            </div>
          </div>
        ) : usageData && usageData.usage_history.length > 0 ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-accent/20 rounded-lg border border-border">
              <p className="text-sm font-medium mb-1">
                {t("songUsage.totalUsageCount")}: <span className="text-primary">{usageData.usage_count}{t("songUsage.times")}</span>
              </p>
              {usageData.last_used_at && (
                <p className="text-sm text-muted-foreground">
                  {t("songUsage.lastUsedAt")}: {formatDate(usageData.last_used_at)}
                </p>
              )}
            </div>

            {/* Usage List */}
            <div className="space-y-3">
              {usageData.usage_history.map((item, idx) => (
                <div
                  key={`${item.service_set_id}-${idx}`}
                  className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">{formatDate(item.date)}</span>
                        <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-xs">
                          {item.status === "published" ? t("bandView.published") : t("bandView.draft")}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-foreground mb-1" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
                        {item.service_name}
                      </h4>

                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {item.worship_leader && (
                          <p>
                            {t("bandView.labels.leader")}: {item.worship_leader}
                          </p>
                        )}
                        {item.community_name && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{t("songUsage.worshipCommunity")}: {item.community_name}</span>
                          </div>
                        )}
                        <p>
                          {t("songUsage.setPosition")}: {item.position}{language === "ko" ? "번" : ""}
                        </p>
                      </div>

                      {!item.is_same_community && item.status === "published" && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>{t("songUsage.crossCommunityReadOnly")}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSet(item)}
                      className="flex-shrink-0"
                    >
                      {t("songUsage.openSet")}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground" style={{ wordBreak: "keep-all" }}>
              {t("songUsage.neverUsed")}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
