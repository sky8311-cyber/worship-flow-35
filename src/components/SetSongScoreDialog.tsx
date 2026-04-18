import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Upload, Trash2, Loader2, AlertCircle, Music, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CopyrightUploadNotice } from "@/components/copyright/CopyrightUploadNotice";
import { useCopyrightAcknowledgment } from "@/hooks/useCopyrightAcknowledgment";
import { convertPdfToImages } from "@/utils/pdfToImages";

interface SetSongScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setSongId?: string;
  songId?: string | null;
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

interface VaultScore {
  id: string;
  score_url: string;
  thumbnail_url: string | null;
  musical_key: string | null;
  label: string | null;
  pages_count: number | null;
}

interface SearchResult {
  title: string;
  link: string;
  thumbnailLink: string;
  contextLink?: string;
  width?: number | null;
  height?: number | null;
}

interface SelectedScore {
  id: string;
  type: "web" | "upload";
  url: string;
  thumbnail: string | null;
  musicalKey: string;
  isPrimary: boolean;
  vaultScoreId?: string | null;
  label?: string | null;
}

const MUSICAL_KEYS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const SetSongScoreDialog = ({
  open,
  onOpenChange,
  setSongId,
  songId,
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
  const [setupErrorMessage, setSetupErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedScores, setSelectedScores] = useState<SelectedScore[]>([]);
  const [saving, setSaving] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultScore[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("search");
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
      setSetupErrorMessage(null);
      setActiveTab("search");
      setVaultItems([]);
      setVaultLoaded(false);
    }
  }, [open, defaultQuery]);

  const loadVault = async () => {
    if (vaultLoaded || vaultLoading) return;
    setVaultLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setVaultLoaded(true);
        return;
      }
      let q = supabase
        .from("user_score_vault")
        .select("id, score_url, thumbnail_url, musical_key, label, pages_count")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (songId) q = q.eq("song_id", songId);
      const { data, error } = await q;
      if (error) throw error;
      setVaultItems((data || []) as VaultScore[]);
      setVaultLoaded(true);
    } catch (e) {
      console.error("Failed to load vault:", e);
      toast.error("보관함 불러오기 실패");
    } finally {
      setVaultLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "vault" && !vaultLoaded && !vaultLoading) {
      loadVault();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  // Load existing scores from set_song_scores when dialog opens
  useEffect(() => {
    const load = async () => {
      if (!open || !setSongId) return;
      const { data, error } = await supabase
        .from("set_song_scores")
        .select("*")
        .eq("set_song_id", setSongId)
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Failed to load scores:", error);
        return;
      }
      setSelectedScores(
        (data || []).map((row: any) => ({
          id: row.id,
          type: row.score_type as "web" | "upload",
          url: row.score_url,
          thumbnail: row.score_thumbnail,
          musicalKey: row.musical_key || "C",
          isPrimary: !!row.is_primary,
          vaultScoreId: row.vault_score_id ?? null,
        }))
      );
    };
    load();
  }, [open, setSongId]);

  const isSelected = (url: string) => selectedScores.some((s) => s.url === url);

  const toggleWebSelection = (item: SearchResult) => {
    setSelectedScores((prev) => {
      if (prev.some((s) => s.url === item.link)) {
        return prev.filter((s) => s.url !== item.link);
      }
      const isFirst = prev.length === 0;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "web",
          url: item.link,
          thumbnail: item.thumbnailLink,
          musicalKey: "C",
          isPrimary: isFirst,
        },
      ];
    });
  };

  const removeSelected = (id: string) => {
    setSelectedScores((prev) => {
      const removed = prev.find((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      // If we removed the primary, promote the first remaining
      if (removed?.isPrimary && next.length > 0 && !next.some((s) => s.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const updateSelectedKey = (id: string, key: string) => {
    setSelectedScores((prev) => prev.map((s) => (s.id === id ? { ...s, musicalKey: key } : s)));
  };

  const setAsPrimary = (id: string) => {
    setSelectedScores((prev) => prev.map((s) => ({ ...s, isPrimary: s.id === id })));
  };

  // Debounced search: rapid typing/Enter only triggers once per 400ms
  const lastSearchAtRef = useRef(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const elapsed = Date.now() - lastSearchAtRef.current;
    const wait = elapsed > 400 ? 0 : 400 - elapsed;
    searchDebounceRef.current = setTimeout(() => {
      lastSearchAtRef.current = Date.now();
      handleSearch();
    }, wait);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setApiNotConfigured(false);
    setSetupErrorMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-image-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query: query.trim() }),
        },
      );

      const body = await res.json().catch(() => ({}));

      if (body?.error || !res.ok) {
        toast.error("이미지 검색에 실패했습니다");
        setResults([]);
        return;
      }

      setResults((body?.items || []).filter((item: any) => (item.width == null || item.width >= 300) && (item.height == null || item.height >= 200)));
    } catch (e: any) {
      console.error(e);
      toast.error("이미지 검색에 실패했습니다");
    } finally {
      setSearching(false);
    }
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

      // PDF: convert each page to a PNG and upload as separate set_song_scores rows.
      // Image: upload as a single file.
      if (file.type === "application/pdf") {
        const pageImages = await convertPdfToImages(file);
        if (pageImages.length === 0) {
          toast.error("PDF에서 페이지를 추출하지 못했습니다");
          return;
        }

        const uploadedPaths: string[] = [];
        for (const { blob, page } of pageImages) {
          const path = `${user.id}/${setSongId}/score-${Date.now()}-p${page}.png`;
          const { error: upErr } = await supabase.storage
            .from("scores")
            .upload(path, blob, { upsert: true, contentType: "image/png" });
          if (upErr) throw upErr;
          uploadedPaths.push(path);
        }

        const baseLabel = file.name.replace(/\.[^.]+$/, "");
        setSelectedScores((prev) => {
          const newRows: SelectedScore[] = uploadedPaths.map((path, idx) => ({
            id: crypto.randomUUID(),
            type: "upload" as const,
            url: path,
            thumbnail: null,
            musicalKey: "C",
            isPrimary: prev.length === 0 && idx === 0,
            label: `${baseLabel} - p${idx + 1}`,
          }));
          return [...prev, ...newRows];
        });
        toast.success(`PDF ${pageImages.length}페이지를 이미지로 변환했습니다. 저장 버튼을 눌러주세요.`);
      } else {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${setSongId}/score-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("scores")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;

        const baseLabel = file.name.replace(/\.[^.]+$/, "");
        setSelectedScores((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "upload",
            url: path,
            thumbnail: null,
            musicalKey: "C",
            isPrimary: prev.length === 0,
            label: baseLabel,
          },
        ]);
        toast.success("업로드 완료. 저장 버튼을 눌러주세요.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveAll = async () => {
    if (!setSongId) {
      toast.error("먼저 셋리스트를 저장해주세요");
      return;
    }
    setSaving(true);
    try {
      // Ensure exactly one primary if there are selections
      let scoresToSave = selectedScores;
      if (scoresToSave.length > 0 && !scoresToSave.some((s) => s.isPrimary)) {
        scoresToSave = scoresToSave.map((s, i) => ({ ...s, isPrimary: i === 0 }));
      }

      // Get current user (for vault upserts)
      const { data: { user } } = await supabase.auth.getUser();

      // Vault upsert for upload-type scores that don't already have a vault_score_id
      const vaultIdByLocalId: Record<string, string> = {};
      if (user) {
        const toVault = scoresToSave.filter(
          (s) => s.type === "upload" && !s.vaultScoreId
        );
        if (toVault.length > 0) {
          const vaultRows = toVault.map((s) => ({
            user_id: user.id,
            song_id: songId ?? null,
            score_url: s.url,
            thumbnail_url: s.thumbnail,
            musical_key: s.musicalKey,
            label: s.label ?? null,
            pages_count: 1,
          }));
          const { data: vaultInserted, error: vaultErr } = await supabase
            .from("user_score_vault")
            .insert(vaultRows)
            .select("id");
          if (vaultErr) {
            console.warn("Vault insert failed (non-fatal):", vaultErr);
          } else if (vaultInserted) {
            toVault.forEach((s, i) => {
              const inserted = vaultInserted[i];
              if (inserted?.id) vaultIdByLocalId[s.id] = inserted.id;
            });
          }
        }
      }

      // Delete existing
      const { error: delErr } = await supabase
        .from("set_song_scores")
        .delete()
        .eq("set_song_id", setSongId);
      if (delErr) throw delErr;

      // Insert new rows
      if (scoresToSave.length > 0) {
        const rows = scoresToSave.map((s, i) => ({
          set_song_id: setSongId,
          score_type: s.type,
          score_url: s.url,
          score_thumbnail: s.thumbnail,
          musical_key: s.musicalKey,
          sort_order: i,
          is_primary: s.isPrimary,
          vault_score_id: s.vaultScoreId ?? vaultIdByLocalId[s.id] ?? null,
        }));
        const { error: insErr } = await supabase.from("set_song_scores").insert(rows);
        if (insErr) throw insErr;
      }

      // Auto-gating: update service_sets.has_private_scores & band_view_visibility
      try {
        const { data: setSongRow } = await supabase
          .from("set_songs")
          .select("service_set_id")
          .eq("id", setSongId)
          .maybeSingle();
        const serviceSetId = (setSongRow as any)?.service_set_id;
        if (serviceSetId) {
          const hasUpload = scoresToSave.some((s) => s.type === "upload");
          if (hasUpload) {
            const { data: ssRow } = await supabase
              .from("service_sets")
              .select("band_view_visibility")
              .eq("id", serviceSetId)
              .maybeSingle();
            const updates: Record<string, any> = { has_private_scores: true };
            if ((ssRow as any)?.band_view_visibility === "public") {
              updates.band_view_visibility = "team";
            }
            await supabase.from("service_sets").update(updates).eq("id", serviceSetId);
          } else {
            await supabase
              .from("service_sets")
              .update({ has_private_scores: false })
              .eq("id", serviceSetId);
          }
        }
      } catch (gateErr) {
        console.warn("Auto-gating failed (non-fatal):", gateErr);
      }

      // Sync set_songs.score_key (and possibly performance_key) with primary score
      const primary = scoresToSave.find((s) => s.isPrimary);
      const newScoreKey = primary?.musicalKey || null;

      // Read current performance_key
      const { data: existingSetSong } = await supabase
        .from("set_songs")
        .select("performance_key, key")
        .eq("id", setSongId)
        .maybeSingle();

      const existingPerformanceKey =
        (existingSetSong as any)?.performance_key || (existingSetSong as any)?.key || null;

      const updatePayload: Record<string, any> = { score_key: newScoreKey };
      let promptKeyChange = false;

      if (newScoreKey) {
        if (!existingPerformanceKey) {
          // No performance key set yet — match it to the score key
          updatePayload.performance_key = newScoreKey;
        } else if (existingPerformanceKey !== newScoreKey) {
          // Different — keep but ask the user
          promptKeyChange = true;
        }
      }

      const { error: updErr } = await supabase
        .from("set_songs")
        .update(updatePayload)
        .eq("id", setSongId);
      if (updErr) throw updErr;

      // Parallelize cache invalidations
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["set-songs"] }),
        queryClient.invalidateQueries({ queryKey: ["band-view-songs"] }),
        queryClient.invalidateQueries({ queryKey: ["set-song-scores", setSongId] }),
      ]);

      toast.success("저장되었습니다");

      if (promptKeyChange && newScoreKey) {
        toast("악보 키가 변경됐습니다. 연주 키도 동일하게 업데이트하시겠어요?", {
          duration: 10000,
          action: {
            label: "예",
            onClick: async () => {
              await supabase
                .from("set_songs")
                .update({ performance_key: newScoreKey })
                .eq("id", setSongId);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["set-songs"] }),
                queryClient.invalidateQueries({ queryKey: ["band-view-songs"] }),
              ]);
              toast.success("연주 키가 업데이트되었습니다");
            },
          },
          cancel: { label: "아니오", onClick: () => {} },
        });
      }

      onSaved?.({});
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 [&>*]:min-w-0">
        <DialogHeader className="min-w-0">
          <DialogTitle>악보 관리</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
               악보 웹 검색
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              내 악보 업로드
            </TabsTrigger>
            <TabsTrigger value="vault">
              <Music className="w-4 h-4 mr-2" />
              내 보관함
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Web Image Search */}
          <TabsContent value="search" className="space-y-4 overflow-hidden w-full min-w-0">
            {apiNotConfigured ? (
              <div className="flex items-start gap-3 p-4 rounded-md bg-muted border border-border">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                   {setupErrorMessage ?? "이미지 검색 기능을 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요."}
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

                <p className="text-xs text-muted-foreground">
                  검색 결과는 외부 웹사이트의 이미지입니다. K-Worship은 해당 콘텐츠를 저장하거나 소유하지 않으며, 저작권 이용 책임은 사용자에게 있습니다.
                </p>

                {results.length > 0 && (
                  <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3 overflow-hidden w-full min-w-0">
                    {results.map((item, i) => {
                      const selected = isSelected(item.link);
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => toggleWebSelection(item)}
                          className={`relative rounded-md overflow-hidden min-w-0 w-full border-2 transition-all hover:border-primary ${
                            selected ? "border-primary ring-2 ring-primary" : "border-border"
                          }`}
                        >
                          <img
                            src={item.thumbnailLink}
                            alt={item.title}
                            loading="lazy"
                            className="w-full max-w-full h-32 object-cover object-top bg-muted"
                          />
                          <div className="absolute top-1 right-1 bg-background/90 rounded p-0.5 pointer-events-none">
                            <Checkbox checked={selected} className="pointer-events-none" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab 2: Private Upload */}
          <TabsContent value="upload" className="space-y-4 overflow-hidden w-full min-w-0">
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
                <span className="text-xs text-muted-foreground/80">
                  PDF는 페이지별 이미지로 자동 변환됩니다
                </span>
              </label>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Scores Preview Panel */}
        {selectedScores.length > 0 && (
          <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30 mt-4 max-w-full w-full min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-muted-foreground">
              선택된 악보 ({selectedScores.length})
            </p>
            <div className="space-y-2 max-w-full w-full min-w-0 overflow-hidden">
              {selectedScores.map((score) => {
                const displayName =
                  score.type === "upload"
                    ? score.url.split("/").pop() || score.url
                    : score.url;
                return (
                  <div
                    key={score.id}
                    className="flex items-center gap-2 bg-background rounded-md p-2 border border-border overflow-hidden w-full min-w-0 max-w-full"
                  >
                    {score.thumbnail ? (
                      <img
                        src={score.thumbnail}
                        alt=""
                        className="w-12 h-12 object-cover object-top rounded border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center rounded bg-muted border border-border flex-shrink-0">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 overflow-hidden flex-1">
                      <span className="text-xs text-muted-foreground truncate block">
                        {displayName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAsPrimary(score.id)}
                      title={score.isPrimary ? "기본 악보" : "기본으로 설정"}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          score.isPrimary
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Select
                      value={score.musicalKey}
                      onValueChange={(v) => updateSelectedKey(score.id, v)}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSICAL_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSelected(score.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || !setSongId}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
