import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Sparkles, 
  Check, 
  X, 
  RefreshCw, 
  Music, 
  FileText, 
  Tag, 
  Key,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface EnrichmentSuggestion {
  id: string;
  song_id: string;
  suggested_lyrics: string | null;
  suggested_key: string | null;
  suggested_topics: string[] | null;
  lyrics_source: string | null;
  confidence: string;
  ai_notes: string | null;
  status: string;
  applied_fields: string[] | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  songs: {
    id: string;
    title: string;
    artist: string;
    lyrics: string | null;
    default_key: string | null;
    topics: string | null;
  };
}

const AdminSongEnrichment = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnrichmentSuggestion | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [expandedLyrics, setExpandedLyrics] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  // Fetch suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["enrichment-suggestions", selectedTab],
    queryFn: async () => {
      const query = supabase
        .from("song_enrichment_suggestions")
        .select(`
          *,
          songs (
            id,
            title,
            artist,
            lyrics,
            default_key,
            topics
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedTab !== "all") {
        query.eq("status", selectedTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EnrichmentSuggestion[];
    },
  });

  // Fetch counts for tabs
  const { data: counts } = useQuery({
    queryKey: ["enrichment-counts"],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        supabase.from("song_enrichment_suggestions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("song_enrichment_suggestions").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("song_enrichment_suggestions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
      };
    },
  });

  // Fetch songs needing processing
  const { data: needsProcessingCount } = useQuery({
    queryKey: ["needs-processing-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("enrichment_status", "needs_processing");
      return count || 0;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("enrichment-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "song_enrichment_suggestions",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["enrichment-suggestions"] });
          queryClient.invalidateQueries({ queryKey: ["enrichment-counts"] });
          
          if (payload.eventType === "INSERT") {
            toast.info(language === "ko" ? "새로운 추천이 도착했습니다" : "New suggestion arrived");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, language]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ suggestionId, fields }: { suggestionId: string; fields: string[] }) => {
      const suggestion = suggestions?.find(s => s.id === suggestionId);
      if (!suggestion) throw new Error("Suggestion not found");

      // Update song with selected fields
      const updateData: Record<string, unknown> = {};
      if (fields.includes("lyrics") && suggestion.suggested_lyrics) {
        updateData.lyrics = suggestion.suggested_lyrics;
      }
      if (fields.includes("key") && suggestion.suggested_key) {
        updateData.default_key = suggestion.suggested_key;
      }
      if (fields.includes("topics") && suggestion.suggested_topics?.length) {
        updateData.topics = suggestion.suggested_topics.join(", ");
      }
      updateData.enrichment_status = "enriched";

      const { error: songError } = await supabase
        .from("songs")
        .update(updateData)
        .eq("id", suggestion.song_id);

      if (songError) throw songError;

      // Update suggestion status
      const { error: suggestionError } = await supabase
        .from("song_enrichment_suggestions")
        .update({
          status: fields.length === 3 ? "approved" : "partial",
          applied_fields: fields,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", suggestionId);

      if (suggestionError) throw suggestionError;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "승인 완료" : "Approved successfully");
      queryClient.invalidateQueries({ queryKey: ["enrichment-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-counts"] });
      setSelectedSuggestion(null);
      setSelectedFields(new Set());
    },
    onError: (error) => {
      toast.error(language === "ko" ? "승인 실패" : "Approval failed");
      console.error(error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const suggestion = suggestions?.find(s => s.id === suggestionId);
      if (!suggestion) throw new Error("Suggestion not found");

      // Update suggestion status
      const { error: suggestionError } = await supabase
        .from("song_enrichment_suggestions")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", suggestionId);

      if (suggestionError) throw suggestionError;

      // Reset song enrichment status
      const { error: songError } = await supabase
        .from("songs")
        .update({ enrichment_status: "none" })
        .eq("id", suggestion.song_id);

      if (songError) throw songError;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "거절 완료" : "Rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["enrichment-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-counts"] });
      setConfirmRejectId(null);
    },
    onError: (error) => {
      toast.error(language === "ko" ? "거절 실패" : "Rejection failed");
      console.error(error);
    },
  });

  // Process queue mutation
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke("process-enrichment-queue", {
        body: { batch_size: 5 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        language === "ko" 
          ? `${data.processed}개 곡 처리 완료` 
          : `Processed ${data.processed} songs`
      );
      queryClient.invalidateQueries({ queryKey: ["enrichment-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-counts"] });
      queryClient.invalidateQueries({ queryKey: ["needs-processing-count"] });
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(language === "ko" ? "처리 실패" : "Processing failed");
      console.error(error);
      setIsProcessing(false);
    },
  });

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-green-500/20 text-green-600">{language === "ko" ? "높음" : "High"}</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-600">{language === "ko" ? "중간" : "Medium"}</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-600">{language === "ko" ? "낮음" : "Low"}</Badge>;
    }
  };

  const getSourceBadge = (source: string | null) => {
    if (!source || source === "none") {
      return <Badge variant="outline">{language === "ko" ? "AI 추천" : "AI Suggested"}</Badge>;
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-600">
        {source === "bugs" ? "Bugs Music" : source === "melon" ? "Melon" : source}
      </Badge>
    );
  };

  const openReviewDialog = (suggestion: EnrichmentSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Pre-select all available fields
    const fields = new Set<string>();
    if (suggestion.suggested_lyrics) fields.add("lyrics");
    if (suggestion.suggested_key) fields.add("key");
    if (suggestion.suggested_topics?.length) fields.add("topics");
    setSelectedFields(fields);
  };

  const handleApprove = () => {
    if (!selectedSuggestion || selectedFields.size === 0) return;
    approveMutation.mutate({
      suggestionId: selectedSuggestion.id,
      fields: Array.from(selectedFields),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {language === "ko" ? "AI 곡 추천 관리" : "AI Song Enrichment"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "ko" 
                ? "AI가 추천한 가사, 키, 주제를 검토하고 승인하세요" 
                : "Review and approve AI-suggested lyrics, keys, and topics"}
            </p>
          </div>

          <Button
            onClick={() => processQueueMutation.mutate()}
            disabled={isProcessing || needsProcessingCount === 0}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {language === "ko" ? "대기열 처리" : "Process Queue"}
            {needsProcessingCount ? ` (${needsProcessingCount})` : ""}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "대기 중" : "Pending"}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{counts?.pending || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "승인됨" : "Approved"}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{counts?.approved || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "거절됨" : "Rejected"}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{counts?.rejected || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "처리 대기" : "Needs Processing"}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{needsProcessingCount || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              {language === "ko" ? "대기 중" : "Pending"}
              {counts?.pending ? <Badge variant="secondary">{counts.pending}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="approved">
              {language === "ko" ? "승인됨" : "Approved"}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {language === "ko" ? "거절됨" : "Rejected"}
            </TabsTrigger>
            <TabsTrigger value="all">
              {language === "ko" ? "전체" : "All"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suggestions?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {language === "ko" ? "표시할 추천이 없습니다" : "No suggestions to display"}
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {suggestions?.map((suggestion) => (
                    <Card key={suggestion.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-medium truncate">{suggestion.songs?.title}</h3>
                              <span className="text-sm text-muted-foreground">-</span>
                              <span className="text-sm text-muted-foreground truncate">
                                {suggestion.songs?.artist || "Unknown"}
                              </span>
                            </div>

                            {/* Suggested Fields */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {suggestion.suggested_lyrics && (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  {language === "ko" ? "가사" : "Lyrics"}
                                </Badge>
                              )}
                              {suggestion.suggested_key && (
                                <Badge variant="outline" className="gap-1">
                                  <Key className="h-3 w-3" />
                                  {suggestion.suggested_key}
                                </Badge>
                              )}
                              {suggestion.suggested_topics?.length ? (
                                <Badge variant="outline" className="gap-1">
                                  <Tag className="h-3 w-3" />
                                  {suggestion.suggested_topics.length}{" "}
                                  {language === "ko" ? "주제" : "topics"}
                                </Badge>
                              ) : null}
                            </div>

                            {/* Confidence & Source */}
                            <div className="flex items-center gap-2 mt-2">
                              {getConfidenceBadge(suggestion.confidence)}
                              {getSourceBadge(suggestion.lyrics_source)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(suggestion.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Lyrics Preview */}
                            {suggestion.suggested_lyrics && (
                              <div className="mt-3">
                                <button
                                  onClick={() => setExpandedLyrics(
                                    expandedLyrics === suggestion.id ? null : suggestion.id
                                  )}
                                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  {expandedLyrics === suggestion.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  {language === "ko" ? "가사 미리보기" : "Preview lyrics"}
                                </button>
                                {expandedLyrics === suggestion.id && (
                                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-40 overflow-auto">
                                    {suggestion.suggested_lyrics.slice(0, 500)}
                                    {suggestion.suggested_lyrics.length > 500 && "..."}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            {suggestion.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openReviewDialog(suggestion)}
                                  className="gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  {language === "ko" ? "검토" : "Review"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmRejectId(suggestion.id)}
                                  className="gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  {language === "ko" ? "거절" : "Reject"}
                                </Button>
                              </>
                            )}
                            {suggestion.status === "approved" && (
                              <Badge className="bg-green-500/20 text-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                {language === "ko" ? "승인됨" : "Approved"}
                              </Badge>
                            )}
                            {suggestion.status === "partial" && (
                              <Badge className="bg-blue-500/20 text-blue-600">
                                {language === "ko" ? "부분 승인" : "Partial"}
                              </Badge>
                            )}
                            {suggestion.status === "rejected" && (
                              <Badge className="bg-red-500/20 text-red-600">
                                <X className="h-3 w-3 mr-1" />
                                {language === "ko" ? "거절됨" : "Rejected"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {language === "ko" ? "AI 추천 검토" : "Review AI Suggestion"}
            </DialogTitle>
            <DialogDescription>
              {selectedSuggestion?.songs?.title} - {selectedSuggestion?.songs?.artist}
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4">
              {/* Confidence & Source */}
              <div className="flex items-center gap-2">
                {getConfidenceBadge(selectedSuggestion.confidence)}
                {getSourceBadge(selectedSuggestion.lyrics_source)}
              </div>

              {/* AI Notes */}
              {selectedSuggestion.ai_notes && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">{language === "ko" ? "AI 분석 노트" : "AI Analysis Notes"}</p>
                  <p className="text-muted-foreground">{selectedSuggestion.ai_notes}</p>
                </div>
              )}

              {/* Field Selection */}
              <div className="space-y-3">
                {/* Lyrics */}
                {selectedSuggestion.suggested_lyrics && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={selectedFields.has("lyrics")}
                        onCheckedChange={(checked) => {
                          const newFields = new Set(selectedFields);
                          if (checked) newFields.add("lyrics");
                          else newFields.delete("lyrics");
                          setSelectedFields(newFields);
                        }}
                      />
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{language === "ko" ? "가사" : "Lyrics"}</span>
                      {selectedSuggestion.songs?.lyrics && (
                        <Badge variant="destructive" className="text-xs">
                          {language === "ko" ? "⚠️ 기존 가사 덮어쓰기" : "⚠️ Will overwrite existing"}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Side-by-side comparison when existing lyrics exist */}
                    {selectedSuggestion.songs?.lyrics ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {language === "ko" ? "기존 가사" : "Current Lyrics"}
                          </p>
                          <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded max-h-40 overflow-auto border border-dashed">
                            {selectedSuggestion.songs.lyrics.slice(0, 400)}
                            {selectedSuggestion.songs.lyrics.length > 400 && "..."}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-primary mb-1">
                            {language === "ko" ? "새 가사" : "New Lyrics"}
                          </p>
                          <pre className="text-xs whitespace-pre-wrap bg-primary/5 p-3 rounded max-h-40 overflow-auto border border-primary/20">
                            {selectedSuggestion.suggested_lyrics.slice(0, 400)}
                            {selectedSuggestion.suggested_lyrics.length > 400 && "..."}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded max-h-40 overflow-auto">
                        {selectedSuggestion.suggested_lyrics.slice(0, 800)}
                        {selectedSuggestion.suggested_lyrics.length > 800 && "..."}
                      </pre>
                    )}
                  </div>
                )}

                {/* Key */}
                {selectedSuggestion.suggested_key && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedFields.has("key")}
                        onCheckedChange={(checked) => {
                          const newFields = new Set(selectedFields);
                          if (checked) newFields.add("key");
                          else newFields.delete("key");
                          setSelectedFields(newFields);
                        }}
                      />
                      <Key className="h-4 w-4" />
                      <span className="font-medium">{language === "ko" ? "키" : "Key"}</span>
                      <Badge>{selectedSuggestion.suggested_key}</Badge>
                      {selectedSuggestion.songs?.default_key && (
                        <span className="text-sm text-muted-foreground">
                          (현재: {selectedSuggestion.songs.default_key})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {selectedSuggestion.suggested_topics?.length ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={selectedFields.has("topics")}
                        onCheckedChange={(checked) => {
                          const newFields = new Set(selectedFields);
                          if (checked) newFields.add("topics");
                          else newFields.delete("topics");
                          setSelectedFields(newFields);
                        }}
                      />
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">{language === "ko" ? "주제" : "Topics"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuggestion.suggested_topics.map((topic, i) => (
                        <Badge key={i} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                    {selectedSuggestion.songs?.topics && (
                      <p className="text-sm text-muted-foreground mt-2">
                        현재: {selectedSuggestion.songs.topics}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={selectedFields.size === 0 || approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {language === "ko" ? "선택 항목 적용" : "Apply Selected"} ({selectedFields.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!confirmRejectId} onOpenChange={() => setConfirmRejectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "추천 거절" : "Reject Suggestion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? "이 추천을 거절하시겠습니까? 나중에 다시 처리할 수 있습니다." 
                : "Are you sure you want to reject this suggestion? It can be reprocessed later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRejectId && rejectMutation.mutate(confirmRejectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {language === "ko" ? "거절" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSongEnrichment;
