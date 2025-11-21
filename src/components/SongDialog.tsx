import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Youtube, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { TagSelector } from "@/components/TagSelector";
import { YouTubeSearchBar } from "@/components/YouTubeSearchBar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: any;
  onClose: () => void;
}

export const SongDialog = ({ open, onOpenChange, song, onClose }: SongDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    artist: "",
    language: "",
    default_key: "",
    category: "",
    tags: [] as string[],
    youtube_url: "",
    score_file_url: "",
    notes: "",
    interpretation: "",
  });

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || "",
        subtitle: song.subtitle || "",
        artist: song.artist || "",
        language: song.language || "",
        default_key: song.default_key || "",
        category: song.category || "",
        tags: song.tags ? song.tags.split(",").map((t: string) => t.trim()) : [],
        youtube_url: song.youtube_url || "",
        score_file_url: song.score_file_url || "",
        notes: song.notes || "",
        interpretation: song.interpretation || "",
      });
    } else {
      setFormData({
        title: "",
        subtitle: "",
        artist: "",
        language: "",
        default_key: "",
        category: "",
        tags: [],
        youtube_url: "",
        score_file_url: "",
        notes: "",
        interpretation: "",
      });
    }
  }, [song, open]);

  const [isDragging, setIsDragging] = useState(false);
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scores")
        .getPublicUrl(filePath);

      setFormData({ ...formData, score_file_url: publicUrl });
      toast.success(t("songDialog.fileUploaded"));
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error(t("songDialog.invalidFileType"));
      return;
    }

    await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error(t("songDialog.titleRequired"));
      return;
    }

    if (!formData.youtube_url.trim()) {
      toast.error(t("songDialog.youtubeRequired"));
      return;
    }

    if (!formData.score_file_url.trim()) {
      toast.error(t("songDialog.scoreRequired"));
      return;
    }

    setLoading(true);
    try {
      const normalizedCategory = formData.category === "uncategorized" ? null : formData.category;
      
      const data: any = {
        ...formData,
        category: normalizedCategory || null,
        tags: formData.tags.join(", "),
      };

      if (song) {
        const { error } = await supabase
          .from("songs")
          .update(data)
          .eq("id", song.id);
        if (error) throw error;
        toast.success(t("songDialog.songUpdated"));
      } else {
        const { error } = await supabase
          .from("songs")
          .insert([data]);
        if (error) throw error;
        toast.success(t("songDialog.songAdded"));
      }

      onClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {song ? t("songDialog.editSong") : t("songDialog.addSong")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("songDialog.title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">{t("songDialog.subtitle")}</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder={t("songDialog.subtitlePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="artist">{t("songDialog.artist")}</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="language">{t("songDialog.language")}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
                  <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
                  <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">
              {t("songDialog.category")}
            </Label>
            <Select value={formData.category || "uncategorized"} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("songLibrary.selectCategory")} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="uncategorized">{t("songLibrary.categories.uncategorized")}</SelectItem>
                <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="key">{t("songDialog.key")}</Label>
              <Input
                id="key"
                value={formData.default_key}
                onChange={(e) => setFormData({ ...formData, default_key: e.target.value })}
                placeholder="C, D, Em, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">{t("songDialog.tags")}</Label>
            <TagSelector 
              selectedTags={formData.tags} 
              onTagsChange={(tags) => setFormData({ ...formData, tags })} 
            />
          </div>

          <div>
            <Label htmlFor="youtube_url">
              {t("songDialog.youtubeUrl")} <span className="text-destructive">*</span>
            </Label>
            
            <div className="space-y-3">
              <Collapsible open={showYouTubeSearch} onOpenChange={setShowYouTubeSearch}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    <Youtube className="w-4 h-4 mr-2" />
                    {showYouTubeSearch ? t("songDialog.hideYoutubeSearch") : t("songDialog.searchYouTube")}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-4 rounded-lg border-2 border-accent bg-accent/30">
                    <YouTubeSearchBar
                      onSelectVideo={(url) => {
                        setFormData({ ...formData, youtube_url: url });
                        setShowYouTubeSearch(false);
                      }}
                      defaultQuery={formData.title && formData.artist ? `${formData.title} ${formData.artist}` : formData.title}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div>
                <Label htmlFor="youtube_url_input" className="text-xs text-muted-foreground mb-1 block">
                  {t("songDialog.youtubeUrl")}
                </Label>
                <Input
                  id="youtube_url_input"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder={t("songDialog.youtubePlaceholder")}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="score_file">
              {t("songDialog.scoreFile")} <span className="text-destructive">*</span>
            </Label>
            
            {!formData.score_file_url ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm">{t("songDialog.dragDropFile")}</p>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("songDialog.uploading")}
                      </>
                    ) : (
                      <>
                        📁 {t("songDialog.selectFile")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl">
                      {formData.score_file_url.match(/\.(pdf)$/i) ? '📄' : '🖼️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t("songDialog.uploadedFile")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formData.score_file_url.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.score_file_url, '_blank')}
                    >
                      {t("songDialog.previewScore")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setFormData({ ...formData, score_file_url: '' })}
                    >
                      {t("songDialog.removeFile")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">{t("songDialog.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
