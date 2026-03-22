import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminImageUploadProps {
  currentUrl: string | null;
  onUploadSuccess: (url: string | null) => void;
  folder: string;
  label: string;
  sizeGuide: string;
  aspectClass?: string; // e.g. "aspect-video", "aspect-square"
  maxSizeMB?: number;
}

export const AdminImageUpload = ({
  currentUrl,
  onUploadSuccess,
  folder,
  label,
  sizeGuide,
  aspectClass = "aspect-video",
  maxSizeMB = 5,
}: AdminImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: `파일 크기가 ${maxSizeMB}MB를 초과합니다`, variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "이미지 파일만 업로드 가능합니다", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      onUploadSuccess(publicUrl);
      toast({ title: "이미지가 업로드되었습니다" });
    } catch (err: any) {
      toast({ title: "업로드 실패", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onUploadSuccess(null);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <HelpTooltip text={sizeGuide} side="top" size={12} />
      </div>

      {currentUrl ? (
        <div className="relative group">
          <div className={cn("w-full rounded-md overflow-hidden border bg-muted", aspectClass)}>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="destructive"
              className="h-6 w-6"
              onClick={handleRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer",
            aspectClass
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-[10px]">클릭하여 업로드</span>
            </>
          )}
        </button>
      )}

      {currentUrl && (
        <Button
          size="sm"
          variant="outline"
          className="mt-1.5 h-7 text-xs w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
          변경
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};
