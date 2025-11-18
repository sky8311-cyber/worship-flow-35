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
    bpm: "",
    time_signature: "",
    energy_level: "",
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
        bpm: song.bpm?.toString() || "",
        time_signature: song.time_signature || "",
        energy_level: song.energy_level?.toString() || "",
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
        bpm: "",
        time_signature: "",
        energy_level: "",
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

    setLoading(true);
    try {
      const data: any = {
        ...formData,
        tags: formData.tags.join(", "),
        bpm: formData.bpm ? parseInt(formData.bpm) : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
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

            <div>
              <Label htmlFor="bpm">{t("songDialog.bpm")}</Label>
              <Input
                id="bpm"
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="time_signature">{t("songDialog.timeSignature")}</Label>
              <Input
                id="time_signature"
                value={formData.time_signature}
                onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
                placeholder="4/4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="energy_level">{t("songDialog.energyLevel")} (1-5)</Label>
              <Input
                id="energy_level"
                type="number"
                min="1"
                max="5"
                value={formData.energy_level}
                onChange={(e) => setFormData({ ...formData, energy_level: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">{t("songDialog.category")}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="오프닝">{t("songLibrary.categories.opening")}</SelectItem>
                  <SelectItem value="찬양">{t("songLibrary.categories.worship")}</SelectItem>
                  <SelectItem value="헌금">{t("songLibrary.categories.offering")}</SelectItem>
                  <SelectItem value="응답">{t("songLibrary.categories.response")}</SelectItem>
                  <SelectItem value="파송">{t("songLibrary.categories.sending")}</SelectItem>
                </SelectContent>
              </Select>
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
            <Label htmlFor="youtube_url">{t("songDialog.youtubeUrl")}</Label>
            <Input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder={t("songDialog.youtubePlaceholder")}
              className="mb-2"
            />
            <Collapsible open={showYouTubeSearch} onOpenChange={setShowYouTubeSearch}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full">
                  <Youtube className="w-4 h-4 mr-2" />
                  {showYouTubeSearch ? t("songDialog.hideYoutubeSearch") : t("songDialog.searchYouTube")}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <YouTubeSearchBar
                  onSelectVideo={(url) => {
                    setFormData({ ...formData, youtube_url: url });
                    setShowYouTubeSearch(false);
                  }}
                  defaultQuery={formData.title && formData.artist ? `${formData.title} ${formData.artist}` : formData.title}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div>
            <Label htmlFor="score_file">{t("songDialog.scoreFile")}</Label>
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
              {formData.score_file_url && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ {t("songDialog.fileUploaded")}
                </p>
              )}
            </div>
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
