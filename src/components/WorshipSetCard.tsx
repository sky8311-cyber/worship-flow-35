import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Upload, XCircle, Share2, Music } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { parseLocalDate } from "@/lib/countdownHelper";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface WorshipSetCardProps {
  set: {
    id: string;
    date: string;
    service_name: string;
    worship_leader: string | null;
    status: "draft" | "published";
    public_share_token?: string | null;
    public_share_enabled?: boolean;
  };
  songs?: string[];
  canManage: boolean;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, currentStatus: string) => void;
  onShare?: (set: any) => void;
  onEdit?: (set: any) => void;
}

export function WorshipSetCard({ set, songs = [], canManage, onDelete, onTogglePublish, onShare, onEdit }: WorshipSetCardProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  
  const dateLocale = language === "ko" ? ko : enUS;
  const formattedDate = format(parseLocalDate(set.date), language === "ko" ? "yyyy.MM.dd (EEE)" : "EEE, MMM d, yyyy", { locale: dateLocale });
  
  const handleCardClick = () => {
    // Published sets always go to band-view
    if (set.status === "published") {
      navigate(`/band-view/${set.id}`);
    } else {
      navigate(canManage ? `/set-builder/${set.id}` : `/band-view/${set.id}`);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(set);
    } else {
      navigate(`/set-builder/${set.id}`);
    }
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
            
            {/* Song Preview */}
            {songs.length > 0 && (
              <div className="mt-3 pt-2 border-t">
                <div className="flex items-start gap-1.5">
                  <Music className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {songs.map((title, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground truncate">
                        {title}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 gap-1 text-xs justify-start"
              onClick={() => navigate(`/band-view/${set.id}`)}
            >
              <Eye className="w-4 h-4" />
              {language === "ko" ? "보기" : "View"}
            </Button>
            {canManage && (
              <>
                {onShare && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 gap-1 text-xs justify-start"
                    onClick={() => onShare(set)}
                  >
                    <Share2 className="w-4 h-4" />
                    {language === "ko" ? "공유" : "Share"}
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2 gap-1 text-xs justify-start"
                  onClick={handleEditClick}
                >
                  <Edit className="w-4 h-4" />
                  {language === "ko" ? "수정" : "Edit"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 px-2 gap-1 text-xs justify-start"
                  onClick={() => onTogglePublish(set.id, set.status)}
                >
                  {set.status === "draft" ? <Upload className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {set.status === "draft" 
                    ? (language === "ko" ? "게시" : "Publish") 
                    : (language === "ko" ? "취소" : "Unpublish")}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2 gap-1 text-xs justify-start text-destructive hover:text-destructive"
                  onClick={() => onDelete(set.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  {language === "ko" ? "삭제" : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
