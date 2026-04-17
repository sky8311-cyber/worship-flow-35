import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, ExternalLink, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CopyrightUploadNotice } from "@/components/copyright/CopyrightUploadNotice";
import { useCopyrightAcknowledgment } from "@/hooks/useCopyrightAcknowledgment";

interface SetSongScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setSongId?: string;
  defaultQuery?: string;
  scoreRefUrl?: string | null;
  scoreRefThumbnail?: string | null;
  privateScoreFileUrl?: string | null;
  onSaved?: (updates: {
    score_ref_url?: string | null;
    score_ref_thumbnail?: string | null;
    private_score_file_url?: string | null;
  }) => void;
}

interface SearchResult {
  title: string;
  link: string;
  thumbnailLink: string;
  contextLink?: string;
}

export const SetSongScoreDialog = ({
  open,
  onOpenChange,
  setSongId,
  defaultQuery = "",
  scoreRefUrl,
  scoreRefThumbnail,
  privateScoreFileUrl,
  onSaved,
}: SetSongScoreDialogProps) => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [apiNotConfigured, setApiNotConfigured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [privateSignedUrl, setPrivateSignedUrl] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const { acknowledge, isAcknowledging } = useCopyrightAcknowledgment();

  const handleAcknowledgeChange = async (checked: boolean) => {
    setAcknowledged(checked);
    if (checked) {
      try {
        await acknowledge();
      } catch (e) {
        console.error("Failed to record acknowledgment:", e);
      }
    }
  };

  useEffect(() => {
    if (open) {
      setQuery(defaultQuery);
      setResults([]);
      setApiNotConfigured(false);
    }
  }, [open, defaultQuery]);

  // Resolve signed URL for private score
  useEffect(() => {
    const resolve = async () => {
      if (!privateScoreFileUrl) {
        setPrivateSignedUrl(null);
        return;
      }
      const { data } = await supabase.storage
        .from("scores")
        .createSignedUrl(privateScoreFileUrl, 14400);
      setPrivateSignedUrl(data?.signedUrl || null);
    };
    resolve();
  }, [privateScoreFileUrl]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setApiNotConfigured(false);
    try {
      const { data, error } = await supabase.functions.invoke("google-image-search", {
        body: { query: query.trim() },
      });

      if (error) {
        // Check if it's the 503 not_configured error
        const ctx: any = (error as any).context;
        if (ctx?.status === 503 || (data as any)?.error === "not_configured") {
          setApiNotConfigured(true);
          setResults([]);
          return;
        }
        throw error;
      }

      if ((data as any)?.error === "not_configured") {
        setApiNotConfigured(true);
        setResults([]);
        return;
      }

      setResults((data as any)?.items || []);
    } catch (e: any) {
      console.error(e);
      toast.error("검색 중 오류가 발생했습니다");
    } finally {
      setSearching(false);
    }
  };

  const persistUpdates = async (updates: {
    score_ref_url?: string | null;
    score_ref_thumbnail?: string | null;
    private_score_file_url?: string | null;
  }) => {
    if (setSongId) {
      const { error } = await supabase
        .from("set_songs")
        .update(updates)
        .eq("id", setSongId);
      if (error) {
        toast.error("저장 실패");
        return false;
      }
      queryClient.invalidateQueries({ queryKey: ["set-songs"] });
      queryClient.invalidateQueries({ queryKey: ["band-view-songs"] });
    }
    onSaved?.(updates);
    return true;
  };

  const handleSelectImage = async (item: SearchResult) => {
    const ok = await persistUpdates({
      score_ref_url: item.link,
      score_ref_thumbnail: item.thumbnailLink,
    });
    if (ok) toast.success("악보가 저장되었습니다");
  };

  const handleClearGoogleRef = async () => {
    const ok = await persistUpdates({
      score_ref_url: null,
      score_ref_thumbnail: null,
    });
    if (ok) toast.success("저장된 악보가 삭제되었습니다");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!setSongId) {
      toast.error("먼저 셋리스트를 저장해주세요");
      return;
    }
    if (!acknowledged) {
      toast.error("저작권 안내에 동의해주세요");
      return;
    }

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("PDF 또는 이미지 파일만 업로드 가능합니다");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${setSongId}/score-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("scores")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const ok = await persistUpdates({ private_score_file_url: path });
      if (ok) toast.success("업로드 완료");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeletePrivate = async () => {
    if (privateScoreFileUrl) {
      await supabase.storage.from("scores").remove([privateScoreFileUrl]);
    }
    const ok = await persistUpdates({ private_score_file_url: null });
    if (ok) toast.success("삭제되었습니다");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>악보 관리</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              악보 검색 (Google)
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              내 악보 업로드
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Google Image Search */}
          <TabsContent value="search" className="space-y-4">
            {apiNotConfigured ? (
              <div className="flex items-start gap-3 p-4 rounded-md bg-muted border border-border">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Google 검색 기능을 사용하려면 관리자에게 API 설정을 요청하세요
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="예: 주님은 나의 힘이요 악보"
                  />
                  <Button onClick={handleSearch} disabled={searching || !query.trim()}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
                  </Button>
                </div>

                {results.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {results.map((item, i) => {
                      const isSelected = scoreRefUrl === item.link;
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectImage(item)}
                          className={`relative rounded-md overflow-hidden border-2 transition-all hover:border-primary ${
                            isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
                          }`}
                        >
                          <img
                            src={item.thumbnailLink}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-32 object-cover bg-muted"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              선택됨
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {scoreRefUrl && (
              <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">현재 저장된 악보</p>
                <div className="flex items-start gap-3">
                  {scoreRefThumbnail && (
                    <img
                      src={scoreRefThumbnail}
                      alt="saved score"
                      className="w-20 h-20 object-cover rounded border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <a
                      href={scoreRefUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      브라우저에서 열기
                    </a>
                    <p className="text-xs text-muted-foreground">
                      이미지를 불러올 수 없으면 위 링크로 원본을 확인하세요
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearGoogleRef}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Private Upload */}
          <TabsContent value="upload" className="space-y-4">
            <CopyrightUploadNotice
              checked={acknowledged}
              onCheckedChange={handleAcknowledgeChange}
              disabled={isAcknowledging}
            />

            <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
              <input
                type="file"
                id="score-upload"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                disabled={uploading || !acknowledged}
                className="hidden"
              />
              <label
                htmlFor="score-upload"
                className={`inline-flex flex-col items-center gap-2 cursor-pointer ${
                  !acknowledged || uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? "업로드 중..." : "PDF 또는 이미지 파일 선택"}
                </span>
              </label>
            </div>

            {privateScoreFileUrl && (
              <div className="border border-border rounded-md p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">업로드된 파일</p>
                <div className="flex items-center justify-between gap-3">
                  {privateSignedUrl && privateScoreFileUrl.match(/\.(png|jpe?g|webp)$/i) ? (
                    <img
                      src={privateSignedUrl}
                      alt="private score"
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  ) : (
                    <a
                      href={privateSignedUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      파일 열기
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeletePrivate}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
