import { useState, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateRoom, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Camera, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioCoverEditorProps {
  room: WorshipRoom;
  isOwner?: boolean;
}

export function StudioCoverEditor({ room, isOwner = false }: StudioCoverEditorProps) {
  const { language } = useTranslation();
  const updateRoom = useUpdateRoom();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [studioName, setStudioName] = useState(room.studio_name || "");
  const [isUploading, setIsUploading] = useState(false);
  
  const coverUrl = (room as any).cover_image_url;
  const displayName = (room as any).studio_name || room.owner?.full_name || (language === "ko" ? "나의 아틀리에" : "My Atelier");
  
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "ko" ? "파일이 너무 큽니다 (최대 5MB)" : "File too large (max 5MB)");
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${room.id}-cover.${fileExt}`;
      const filePath = `studio-covers/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("component-images")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("component-images")
        .getPublicUrl(filePath);
      
      await supabase
        .from("worship_rooms")
        .update({ cover_image_url: publicUrl })
        .eq("id", room.id);
      
      toast.success(language === "ko" ? "커버 이미지가 업데이트되었습니다" : "Cover image updated");
      window.location.reload();
    } catch (error) {
      console.error("Cover upload error:", error);
      toast.error(language === "ko" ? "업로드 실패" : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSaveName = async () => {
    try {
      await supabase
        .from("worship_rooms")
        .update({ studio_name: studioName.trim() || null })
        .eq("id", room.id);
      
      setIsEditingName(false);
      toast.success(language === "ko" ? "저장되었습니다" : "Saved");
    } catch (error) {
      toast.error(language === "ko" ? "저장 실패" : "Save failed");
    }
  };
  
  return (
    <div className="relative">
      {/* Cover Image */}
      <div 
        className={cn(
          "h-32 md:h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden",
          coverUrl && "bg-cover bg-center"
        )}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Upload button */}
        {isOwner && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 opacity-80 hover:opacity-100 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4" />
              {isUploading 
                ? (language === "ko" ? "업로드 중..." : "Uploading...") 
                : (language === "ko" ? "커버 변경" : "Change Cover")}
            </Button>
          </>
        )}
      </div>
      
      {/* Profile section */}
      <div className="px-4 -mt-10 relative z-10 pb-4 border-b border-border/20">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarImage src={room.owner?.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {room.owner?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          
          {/* Name */}
          <div className="flex-1 pb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder={language === "ko" ? "스튜디오 이름" : "Studio name"}
                  className="h-9 max-w-xs"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl font-bold">{displayName}</h1>
                {isOwner && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setStudioName((room as any).studio_name || "");
                      setIsEditingName(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
            
            {room.owner?.is_ambassador && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full mt-1">
                👑 {language === "ko" ? "앰버서더" : "Ambassador"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
