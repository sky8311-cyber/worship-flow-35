import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface SongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: any;
  onClose: () => void;
}

export const SongDialog = ({ open, onOpenChange, song, onClose }: SongDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    language: "",
    default_key: "",
    bpm: "",
    time_signature: "",
    energy_level: "",
    category: "",
    tags: "",
    youtube_url: "",
    score_file_url: "",
    notes: "",
  });

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || "",
        artist: song.artist || "",
        language: song.language || "",
        default_key: song.default_key || "",
        bpm: song.bpm?.toString() || "",
        time_signature: song.time_signature || "",
        energy_level: song.energy_level?.toString() || "",
        category: song.category || "",
        tags: song.tags || "",
        youtube_url: song.youtube_url || "",
        score_file_url: song.score_file_url || "",
        notes: song.notes || "",
      });
    } else {
      setFormData({
        title: "",
        artist: "",
        language: "",
        default_key: "",
        bpm: "",
        time_signature: "",
        energy_level: "",
        category: "",
        tags: "",
        youtube_url: "",
        score_file_url: "",
        notes: "",
      });
    }
  }, [song, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scores")
        .getPublicUrl(filePath);

      setFormData({ ...formData, score_file_url: publicUrl });
      toast.success("파일이 업로드되었습니다");
    } catch (error: any) {
      toast.error("파일 업로드 실패: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("곡 제목을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        ...formData,
        bpm: formData.bpm ? parseInt(formData.bpm) : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
      };

      if (song) {
        const { error } = await supabase
          .from("songs")
          .update(data)
          .eq("id", song.id);
        if (error) throw error;
        toast.success("곡이 수정되었습니다");
      } else {
        const { error } = await supabase
          .from("songs")
          .insert([data]);
        if (error) throw error;
        toast.success("곡이 추가되었습니다");
      }

      onClose();
    } catch (error: any) {
      toast.error("저장 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{song ? "곡 수정" : "새 곡 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">곡 제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">아티스트</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">언어</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KO">한국어</SelectItem>
                  <SelectItem value="EN">영어</SelectItem>
                  <SelectItem value="KO/EN">한영 혼합</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_key">기본 키</Label>
              <Input
                id="default_key"
                value={formData.default_key}
                onChange={(e) => setFormData({ ...formData, default_key: e.target.value })}
                placeholder="예: G, E♭, C#m"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_signature">박자</Label>
              <Input
                id="time_signature"
                value={formData.time_signature}
                onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
                placeholder="예: 4/4, 6/8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy_level">에너지 레벨 (1-5)</Label>
              <Input
                id="energy_level"
                type="number"
                min="1"
                max="5"
                value={formData.energy_level}
                onChange={(e) => setFormData({ ...formData, energy_level: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="오프닝">오프닝</SelectItem>
                  <SelectItem value="찬양">찬양</SelectItem>
                  <SelectItem value="헌금">헌금</SelectItem>
                  <SelectItem value="응답">응답</SelectItem>
                  <SelectItem value="파송">파송</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그 (콤마로 구분)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="예: 성령, 회복, 빠른"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube 링크</Label>
            <Input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="score_file">악보 파일</Label>
            <div className="flex gap-2">
              <Input
                id="score_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <span className="text-sm text-muted-foreground">업로드 중...</span>}
            </div>
            {formData.score_file_url && (
              <p className="text-xs text-muted-foreground">파일이 업로드되었습니다</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : song ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
