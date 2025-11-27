import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Check, Save, Music } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface WorshipSetCardProps {
  set: {
    id: string;
    date: string;
    service_name: string;
    worship_leader: string | null;
    status: "draft" | "published";
    set_songs?: { count: number }[];
  };
  canManage: boolean;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, currentStatus: string) => void;
}

export function WorshipSetCard({ set, canManage, onDelete, onTogglePublish }: WorshipSetCardProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  const songCount = set.set_songs?.[0]?.count || 0;
  const dateLocale = language === "ko" ? ko : enUS;
  const formattedDate = format(new Date(set.date), language === "ko" ? "yyyy.MM.dd (EEE)" : "EEE, MMM d, yyyy", { locale: dateLocale });
  
  const handleCardClick = () => {
    navigate(canManage ? `/set-builder/${set.id}` : `/band-view/${set.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={set.status === "published" ? "default" : "secondary"}>
                {set.status === "draft" ? t("worshipSets.filterDraft") : t("worshipSets.filterPublished")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <h3 className="font-semibold truncate mt-1">{set.service_name}</h3>
            {set.worship_leader && (
              <p className="text-sm text-muted-foreground truncate">{set.worship_leader}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => navigate(`/band-view/${set.id}`)}
              title={t("worshipSets.view")}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {canManage && (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => navigate(`/set-builder/${set.id}`)}
                  title={t("worshipSets.edit")}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onTogglePublish(set.id, set.status)}
                  title={set.status === "draft" ? t("worshipSets.publish") : t("worshipSets.unpublish")}
                >
                  {set.status === "draft" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => onDelete(set.id)}
                  title={t("worshipSets.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Music className="w-3 h-3 mr-1" />
            {songCount} {t("common.songs")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
