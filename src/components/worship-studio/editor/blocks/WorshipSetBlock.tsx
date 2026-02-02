import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileStack, Calendar, Music, Copy, X } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface WorshipSetBlockProps {
  setId: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function WorshipSetBlock({ setId, isEditing, onRemove }: WorshipSetBlockProps) {
  const { language } = useTranslation();
  
  const { data: set, isLoading } = useQuery({
    queryKey: ["worship-set-block", setId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select(`
          id, 
          service_name, 
          date, 
          worship_leader,
          set_songs(
            id,
            song:songs(id, title, artist)
          )
        `)
        .eq("id", setId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!setId,
  });
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "PPP", { locale: language === "ko" ? ko : enUS });
    } catch {
      return dateStr;
    }
  };
  
  const handleCopySet = () => {
    // TODO: Implement copy set functionality
    toast.success(language === "ko" ? "셋 복사 기능 준비 중" : "Copy set feature coming soon");
  };
  
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }
  
  if (!set) {
    return (
      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
        {language === "ko" ? "예배셋을 찾을 수 없습니다" : "Worship set not found"}
      </div>
    );
  }
  
  const songs = set.set_songs || [];
  
  return (
    <div className="relative group my-2">
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:bg-accent/5 transition-colors">
        {/* Header */}
        <div className="p-4 flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
            <FileStack className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">
              {set.service_name || (language === "ko" ? "제목 없음" : "Untitled")}
            </h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {set.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(set.date)}
                </span>
              )}
              {set.worship_leader && (
                <span className="truncate">{set.worship_leader}</span>
              )}
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCopySet}
            className="gap-1 flex-shrink-0"
          >
            <Copy className="h-3 w-3" />
            {language === "ko" ? "복사" : "Copy"}
          </Button>
        </div>
        
        {/* Song list preview */}
        {songs.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {songs.slice(0, 5).map((setSong: any, idx: number) => (
                <span 
                  key={setSong.id || idx}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted"
                >
                  <Music className="h-3 w-3" />
                  {setSong.song?.title || "Unknown"}
                </span>
              ))}
              {songs.length > 5 && (
                <span className="text-xs px-2 py-1 text-muted-foreground">
                  +{songs.length - 5} {language === "ko" ? "곡" : "more"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isEditing && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
