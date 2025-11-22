import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Youtube, Loader2, Trash2, FileText, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { TagSelector } from "@/components/TagSelector";
import { ArtistSelector } from "@/components/ArtistSelector";
import { YouTubeSearchBar } from "@/components/YouTubeSearchBar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";

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
  const [scoreVariations, setScoreVariations] = useState<Array<{
    id?: string;
    key: string;
    files: Array<{ url: string; page: number; id?: string }>;
  }>>([]);
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);
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
      
      // Load score variations
      if (song.id) {
        loadScoreVariations(song.id);
      }
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
      setScoreVariations([]);
    }
  }, [song, open]);

  const loadScoreVariations = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from("song_scores")
        .select("*")
        .eq("song_id", songId)
        .order("key", { ascending: true })
        .order("page_number", { ascending: true });

      if (error) throw error;

      // Group by key
      const grouped: Record<string, Array<{ url: string; page: number; id: string }>> = {};
      data?.forEach((score) => {
        if (!grouped[score.key]) {
          grouped[score.key] = [];
        }
        grouped[score.key].push({
          url: score.file_url,
          page: score.page_number,
          id: score.id,
        });
      });

      const variations = Object.entries(grouped).map(([key, files]) => ({
        key,
        files: files.sort((a, b) => a.page - b.page),
      }));

      setScoreVariations(variations);
    } catch (error) {
      console.error("Error loading score variations:", error);
    }
  };

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

    if (!formData.score_file_url.trim() && scoreVariations.length === 0) {
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

      let songId: string;

      if (song) {
        const { error } = await supabase
          .from("songs")
          .update(data)
          .eq("id", song.id);
        if (error) throw error;
        songId = song.id;
        toast.success(t("songDialog.songUpdated"));
      } else {
        const { data: newSong, error } = await supabase
          .from("songs")
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        songId = newSong.id;
        toast.success(t("songDialog.songAdded"));
      }

      // Save score variations
      await saveScoreVariations(songId);

      onClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveScoreVariations = async (songId: string) => {
    try {
      // Delete existing scores
      await supabase.from("song_scores").delete().eq("song_id", songId);

      // Insert new scores
      const scoresToInsert = scoreVariations.flatMap((variation, varIndex) =>
        variation.files.map((file, fileIndex) => ({
          song_id: songId,
          key: variation.key,
          file_url: file.url,
          page_number: fileIndex + 1,
          position: varIndex + 1,
        }))
      );

      if (scoresToInsert.length > 0) {
        const { error } = await supabase.from("song_scores").insert(scoresToInsert);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving score variations:", error);
      throw error;
    }
  };

  const addVariation = () => {
    setScoreVariations([...scoreVariations, { key: "", files: [] }]);
  };

  const removeVariation = (index: number) => {
    setScoreVariations(scoreVariations.filter((_, i) => i !== index));
  };

  const updateVariationKey = (index: number, key: string) => {
    const updated = [...scoreVariations];
    updated[index].key = key;
    setScoreVariations(updated);
  };

  const uploadScoreFile = async (file: File, variationIndex: number) => {
    try {
      setUploadingVariationIndex(variationIndex);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("scores").getPublicUrl(filePath);

      // Add file to variation
      const updated = [...scoreVariations];
      updated[variationIndex].files.push({
        url: publicUrl,
        page: updated[variationIndex].files.length + 1,
      });
      setScoreVariations(updated);

      toast.success(t("songDialog.fileUploaded"));
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploadingVariationIndex(null);
    }
  };

  const removeScoreFile = (variationIndex: number, fileIndex: number) => {
    const updated = [...scoreVariations];
    updated[variationIndex].files.splice(fileIndex, 1);
    // Renumber pages
    updated[variationIndex].files = updated[variationIndex].files.map((f, i) => ({
      ...f,
      page: i + 1,
    }));
    setScoreVariations(updated);
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
              <ArtistSelector
                value={formData.artist}
                onValueChange={(artist) => setFormData({ ...formData, artist })}
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
            <Label>{t("songDialog.scoreFiles")}</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {t("songDialog.scoreFilesDescription")}
            </p>

            {scoreVariations.map((variation, index) => (
              <Card key={index} className="mb-3 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Select
                      value={variation.key}
                      onValueChange={(key) => updateVariationKey(index, key)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={t("songDialog.selectKey")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="C#">C#</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="D#">D#</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="F#">F#</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="G#">G#</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="A#">A#</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {variation.files.length > 0 && (
                    <div className="space-y-2">
                      {variation.files.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="flex items-center gap-2 text-sm border rounded p-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="flex-1">
                            {t("songDialog.page")} {fileIndex + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            {t("songDialog.preview")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScoreFile(index, fileIndex)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadScoreFile(file, index);
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id={`file-upload-${index}`}
                      disabled={uploadingVariationIndex === index}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        document.getElementById(`file-upload-${index}`)?.click()
                      }
                      disabled={uploadingVariationIndex === index || !variation.key}
                    >
                      {uploadingVariationIndex === index ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("songDialog.uploading")}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {variation.files.length === 0
                            ? t("songDialog.uploadScore")
                            : t("songDialog.addMorePages")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addVariation}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("songDialog.addKeyVariation")}
            </Button>
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
