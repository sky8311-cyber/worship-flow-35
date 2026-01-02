import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Upload, Music, Eye, LayoutGrid, LayoutList, Share2, XCircle, ArrowUpCircle, Download, FileText, ChevronDown } from "lucide-react";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { SetImportDialog } from "@/components/SetImportDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/countdownHelper";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorshipSetCard } from "@/components/WorshipSetCard";
import { WorshipSetFilters, MainFilterType } from "@/components/worship-set/WorshipSetFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLastEditedDraftId, clearLastEditedDraft } from "@/hooks/useAutoSaveDraft";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Papa from "papaparse";

// Type for set with songs
interface SetWithSongs {
  id: string;
  date: string;
  service_name: string;
  worship_leader: string | null;
  status: "draft" | "published";
  public_share_token?: string | null;
  public_share_enabled?: boolean;
  created_by: string | null;
  set_songs?: {
    position: number;
    songs: {
      title: string;
    } | null;
  }[];
  [key: string]: any;
}

export default function WorshipSets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const { user, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const [mainFilter, setMainFilter] = useState<MainFilterType>("all");
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [shareLinkDialogOpen, setShareLinkDialogOpen] = useState(false);
  const [selectedSetForShare, setSelectedSetForShare] = useState<any>(null);
  const [hasCheckedLastDraft, setHasCheckedLastDraft] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Column filters
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([]);
  
  // Unpublish confirmation states
  const [showUnpublishWarning, setShowUnpublishWarning] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [pendingSetId, setPendingSetId] = useState<string | null>(null);
  
  // Check if we should continue to last draft (only when ?continue=true)
  const shouldContinueDraft = searchParams.get("continue") === "true";
  
  // Auto-switch to card view on mobile
  useEffect(() => {
    if (isMobile) {
      setViewMode("card");
    }
  }, [isMobile]);

  // Check for last edited draft and redirect (only when ?continue=true)
  useEffect(() => {
    if (hasCheckedLastDraft || !user?.id || !shouldContinueDraft) return;
    
    const checkLastEditedDraft = async () => {
      const lastEditedDraftId = getLastEditedDraftId();
      
      if (lastEditedDraftId) {
        // Verify the draft still exists and belongs to user
        const { data, error } = await supabase
          .from("service_sets")
          .select("id, status, service_name")
          .eq("id", lastEditedDraftId)
          .eq("status", "draft")
          .eq("created_by", user.id)
          .maybeSingle();
        
        if (data && !error) {
          // Redirect to the last edited draft
          toast.info(
            language === "ko" 
              ? `"${data.service_name || '새 워십세트'}" 작성 중인 드래프트로 이동합니다` 
              : `Returning to draft "${data.service_name || 'New Worship Set'}"`
          );
          navigate(`/set-builder/${lastEditedDraftId}`, { replace: true });
          return;
        } else {
          // Draft no longer exists, clear localStorage
          clearLastEditedDraft();
        }
      }
      
      // No draft found or draft invalid, show history list (remove ?continue param)
      navigate("/worship-sets", { replace: true });
      setHasCheckedLastDraft(true);
    };
    
    checkLastEditedDraft();
  }, [user?.id, hasCheckedLastDraft, navigate, language, shouldContinueDraft]);

  // Check if user can manage a specific set
  const canManage = (set: any) => {
    if (isAdmin) return true;
    if (isWorshipLeader && set.created_by === user?.id) return true;
    if (isCommunityLeaderInAnyCommunity && set.created_by === user?.id) return true;
    return false;
  };
  
  // Check if user can create new sets
  const canCreateSets = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;
  
  // History page shows ALL worship sets with songs (no date filtering)
  const { data: allSets, isLoading } = useQuery({
    queryKey: ["worship-sets-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select(`
          *,
          set_songs(
            position,
            songs(title)
          )
        `)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as SetWithSongs[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    if (!allSets) return { years: [], months: [], leaders: [], serviceNames: [] };
    
    const years = new Set<number>();
    const months = new Set<number>();
    const leaders = new Set<string>();
    const serviceNames = new Set<string>();
    
    allSets.forEach(set => {
      const date = parseLocalDate(set.date);
      years.add(date.getFullYear());
      months.add(date.getMonth() + 1);
      if (set.worship_leader) leaders.add(set.worship_leader);
      if (set.service_name) serviceNames.add(set.service_name);
    });
    
    return {
      years: Array.from(years).sort((a, b) => b - a),
      months: Array.from(months).sort((a, b) => a - b),
      leaders: Array.from(leaders).sort(),
      serviceNames: Array.from(serviceNames).sort(),
    };
  }, [allSets]);

  // Apply filters
  const filteredSets = useMemo(() => {
    if (!allSets) return [];
    
    let result = allSets;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Main filter
    switch (mainFilter) {
      case "mySets":
        result = result.filter(set => set.created_by === user?.id);
        break;
      case "upcoming":
        result = result.filter(set => parseLocalDate(set.date) >= today);
        break;
      case "draft":
        result = result.filter(set => set.status === "draft");
        break;
      case "published":
        result = result.filter(set => set.status === "published");
        break;
    }
    
    // Column filters
    if (selectedYears.length > 0) {
      result = result.filter(set => selectedYears.includes(parseLocalDate(set.date).getFullYear()));
    }
    if (selectedMonths.length > 0) {
      result = result.filter(set => selectedMonths.includes(parseLocalDate(set.date).getMonth() + 1));
    }
    if (selectedLeaders.length > 0) {
      result = result.filter(set => set.worship_leader && selectedLeaders.includes(set.worship_leader));
    }
    if (selectedServiceNames.length > 0) {
      result = result.filter(set => selectedServiceNames.includes(set.service_name));
    }
    
    return result;
  }, [allSets, mainFilter, user?.id, selectedYears, selectedMonths, selectedLeaders, selectedServiceNames]);

  // Helper to get song titles from a set
  const getSongTitles = (set: SetWithSongs): string[] => {
    if (!set.set_songs || set.set_songs.length === 0) return [];
    return set.set_songs
      .sort((a, b) => a.position - b.position)
      .map(ss => ss.songs?.title)
      .filter((title): title is string => !!title);
  };
  
  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      await supabase.from("set_songs").delete().eq("service_set_id", setId);
      const { error } = await supabase.from("service_sets").delete().eq("id", setId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("worshipSets.deleted"));
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
  });
  
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus, serviceName }: { id: string; currentStatus: string; serviceName?: string }) => {
      const newStatus = currentStatus === "draft" ? "published" : "draft";
      const { error } = await supabase
        .from("service_sets")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      return { id, newStatus, serviceName };
    },
    onSuccess: ({ id: setId, newStatus, serviceName }) => {
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success(t("worshipSets.statusChanged"));
      
      // Credit K-Seed reward when publishing (fire-and-forget)
      if (newStatus === "published" && user?.id) {
        import("@/lib/rewardsHelper").then(({ creditSetPublishedReward }) => {
          creditSetPublishedReward(user.id, setId, serviceName);
        });
      }
    },
  });
  
  const handleDelete = (setId: string) => {
    if (confirm(t("worshipSets.confirmDelete"))) {
      deleteMutation.mutate(setId);
    }
  };
  
  const handleTogglePublish = (id: string, currentStatus: string, serviceName?: string) => {
    togglePublishMutation.mutate({ id, currentStatus, serviceName });
  };
  
  const handleShare = (set: any) => {
    setSelectedSetForShare(set);
    setShareLinkDialogOpen(true);
  };
  
  // Download CSV template with all fields
  const handleDownloadTemplate = () => {
    const template = `Date,ServiceName,WorshipLeader,BandName,Theme,ScriptureReference,TargetAudience,ServiceTime,WorshipDuration,Notes,Songs,SongKeys,SongBPMs,SongNotes,WorshipOrder
2024-12-25,성탄 연합예배,최광은,하기오스,성탄의 기쁨,누가복음 2:1-20,장년,12:00,18,,예배합니다 / 주 예수 내 맘에 들어와 / 시선 / 왕이신 나의 하나님,F / G / E / F,120 / 85 / 72 / 90,후렴만 / / / 1-2절만,카운트다운::10 | 환영:담당자:3 | 찬양::18 | 대표기도::5 | 설교:담임목사:45 | 축도::3
2024-04-07,주일 3부예배 찬양,,,,,,,,,우리 보좌앞에 모였네 / 내가 매일기쁘게 / 주만바라볼찌라,D / G / G→A,,,`;
    
    const blob = new Blob(["\uFEFF" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "worship_set_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(language === "ko" ? "템플릿 다운로드 완료" : "Template downloaded");
  };
  
  // Export filtered sets to CSV with full details
  const handleExportCSV = async () => {
    if (!filteredSets || filteredSets.length === 0) {
      toast.error(language === "ko" ? "내보낼 데이터가 없습니다" : "No data to export");
      return;
    }

    const loadingToast = toast.loading(language === "ko" ? "데이터 내보내기 중..." : "Exporting data...");

    try {
      // Fetch songs and components for all sets
      const setIds = filteredSets.map(s => s.id);
      
      const [songsResult, componentsResult] = await Promise.all([
        supabase
          .from("set_songs")
          .select(`
            service_set_id, position, key, key_change_to, custom_notes, bpm,
            songs(title, artist, default_key)
          `)
          .in("service_set_id", setIds)
          .order("position"),
        supabase
          .from("set_components")
          .select("*")
          .in("service_set_id", setIds)
          .order("position")
      ]);

      const songsData = songsResult.data || [];
      const componentsData = componentsResult.data || [];

      // Group by set ID
      const songsBySet = new Map<string, any[]>();
      const componentsBySet = new Map<string, any[]>();

      songsData.forEach(s => {
        const list = songsBySet.get(s.service_set_id) || [];
        list.push(s);
        songsBySet.set(s.service_set_id, list);
      });

      componentsData.forEach(c => {
        const list = componentsBySet.get(c.service_set_id) || [];
        list.push(c);
        componentsBySet.set(c.service_set_id, list);
      });

      const csvData = filteredSets.map(set => {
        const setSongs = songsBySet.get(set.id) || [];
        const setComponents = componentsBySet.get(set.id) || [];

        // Build songs columns
        const songTitles = setSongs.map(s => s.songs?.title || '').join(' / ');
        const songKeys = setSongs.map(s => {
          if (s.key_change_to) return `${s.key || s.songs?.default_key || ''}→${s.key_change_to}`;
          return s.key || s.songs?.default_key || '';
        }).join(' / ');
        const songBPMs = setSongs.map(s => s.bpm || '').join(' / ');
        const songNotes = setSongs.map(s => s.custom_notes || '').join(' / ');

        // Build worship order: "label:assignedTo:duration | ..."
        const worshipOrder = setComponents.map(c => 
          `${c.label}:${c.assigned_to || ''}:${c.duration_minutes || ''}`
        ).join(' | ');

        return {
          Date: set.date,
          ServiceName: set.service_name,
          WorshipLeader: set.worship_leader || '',
          BandName: set.band_name || '',
          Theme: set.theme || '',
          ScriptureReference: set.scripture_reference || '',
          TargetAudience: set.target_audience || '',
          ServiceTime: set.service_time || '',
          WorshipDuration: set.worship_duration || '',
          Notes: set.notes || '',
          Songs: songTitles,
          SongKeys: songKeys,
          SongBPMs: songBPMs,
          SongNotes: songNotes,
          WorshipOrder: worshipOrder,
        };
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worship_sets_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(
        language === "ko" 
          ? `${filteredSets.length}개 워십세트 내보내기 완료` 
          : `${filteredSets.length} worship sets exported`
      );
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(language === "ko" ? "내보내기 중 오류가 발생했습니다" : "Error exporting data");
    }
  };
  
  // Handle edit click with unpublish confirmation for published sets
  const handleEditClick = (set: any) => {
    if (set.status === "published") {
      setPendingSetId(set.id);
      setShowUnpublishWarning(true);
    } else {
      navigate(`/set-builder/${set.id}`);
    }
  };
  
  // Confirm unpublish and navigate to edit
  const handleConfirmUnpublish = async () => {
    if (!pendingSetId) return;
    
    try {
      const { error } = await supabase
        .from("service_sets")
        .update({ status: "draft" })
        .eq("id", pendingSetId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      
      toast.info(
        language === "ko" 
          ? "워십세트가 게시 취소되었습니다. 수정 후 다시 게시해주세요." 
          : "Worship set unpublished. Please republish after editing."
      );
      
      navigate(`/set-builder/${pendingSetId}`);
    } catch (error) {
      toast.error(language === "ko" ? "게시 취소 중 오류가 발생했습니다." : "Error unpublishing worship set.");
    } finally {
      setShowUnpublishConfirm(false);
      setPendingSetId(null);
    }
  };
  
  // Handle row click - published sets go to band-view
  const handleRowClick = (set: any) => {
    if (set.status === "published") {
      navigate(`/band-view/${set.id}`);
    } else {
      navigate(canManage(set) ? `/set-builder/${set.id}` : `/band-view/${set.id}`);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {canCreateSets && (
            <div className="flex gap-2">
              {/* Import Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4" />
                    {t("worshipSets.import")}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    {language === "ko" ? "CSV에서 가져오기" : "Import from CSV"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadTemplate}>
                    <FileText className="w-4 h-4 mr-2" />
                    {language === "ko" ? "템플릿 다운로드" : "Download Template"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Export Button */}
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                {language === "ko" ? "내보내기" : "Export"}
              </Button>
              
              <Button onClick={() => navigate("/set-builder")}>
                <Plus className="w-4 h-4" />
                {t("worshipSets.createNew")}
              </Button>
            </div>
          )}
        </div>
        
        <Card className="shadow-md">
          <CardHeader className="relative">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("worshipSets.title")}
            </CardTitle>
            
            {/* View mode toggle */}
            <div className="absolute top-4 right-4 flex gap-1 bg-muted rounded-md p-1">
              <Button
                size="icon"
                variant={viewMode === "card" ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("card")}
                title={t("worshipSets.viewMode.card")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "table" ? "default" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
                title={t("worshipSets.viewMode.table")}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6">
              <WorshipSetFilters
                mainFilter={mainFilter}
                onMainFilterChange={setMainFilter}
                availableYears={filterOptions.years}
                availableMonths={filterOptions.months}
                availableLeaders={filterOptions.leaders}
                availableServiceNames={filterOptions.serviceNames}
                selectedYears={selectedYears}
                selectedMonths={selectedMonths}
                selectedLeaders={selectedLeaders}
                selectedServiceNames={selectedServiceNames}
                onYearsChange={setSelectedYears}
                onMonthsChange={setSelectedMonths}
                onLeadersChange={setSelectedLeaders}
                onServiceNamesChange={setSelectedServiceNames}
                isMobile={isMobile}
              />
            </div>
          
          {isLoading ? (
            <p>{t("common.loading")}</p>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSets?.map((set) => (
                <WorshipSetCard
                  key={set.id}
                  set={set}
                  songs={getSongTitles(set)}
                  canManage={canManage(set)}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  onShare={handleShare}
                  onEdit={handleEditClick}
                />
              ))}
              {filteredSets?.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  {language === "ko" ? "조건에 맞는 워십세트가 없습니다." : "No worship sets match the filters."}
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("worshipSets.tableHeaders.date")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.serviceName")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.worshipLeader")}</TableHead>
                  <TableHead>{language === "ko" ? "선곡" : "Songs"}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.status")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSets?.map((set) => {
                  const songTitles = getSongTitles(set);
                  
                  return (
                    <TableRow 
                      key={set.id} 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleRowClick(set)}
                    >
                      <TableCell>{format(parseLocalDate(set.date), "yyyy-MM-dd")}</TableCell>
                      <TableCell className="font-medium">{set.service_name}</TableCell>
                      <TableCell>{set.worship_leader || "-"}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {songTitles.length > 0 ? (
                          <div className="space-y-0.5">
                            {songTitles.map((title, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground truncate">
                                {title}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={set.status === "published" ? "default" : "secondary"}>
                          {set.status === "draft" ? t("worshipSets.filterDraft") : t("worshipSets.filterPublished")}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {/* View button - always visible */}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => navigate(`/band-view/${set.id}`)}
                            title={t("worshipSets.view")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {canManage(set) && (
                            <>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleShare(set)}
                                title={language === "ko" ? "공유" : "Share"}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleEditClick(set)}
                                title={t("worshipSets.edit")}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleTogglePublish(set.id, set.status)}
                                title={set.status === "draft" ? t("worshipSets.publish") : t("worshipSets.unpublish")}
                              >
                                {set.status === "draft" ? <ArrowUpCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDelete(set.id)}
                                title={t("worshipSets.delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSets?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {language === "ko" ? "조건에 맞는 워십세트가 없습니다." : "No worship sets match the filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
        <ShareLinkDialog
          open={shareLinkDialogOpen}
          onOpenChange={setShareLinkDialogOpen}
          setId={selectedSetForShare?.id || ""}
          publicShareToken={selectedSetForShare?.public_share_token || null}
          publicShareEnabled={selectedSetForShare?.public_share_enabled || false}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] })}
        />
        
        <SetImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
          }}
        />
        
        {/* First warning dialog */}
        <AlertDialog open={showUnpublishWarning} onOpenChange={setShowUnpublishWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "ko" ? "수정 모드로 전환" : "Switch to Edit Mode"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ko" 
                  ? "수정 모드로 전환하면 게시가 자동으로 취소됩니다. 수정 완료 후 다시 저장하고 게시해야 합니다." 
                  : "Switching to edit mode will automatically unpublish the worship set. You will need to save and republish after editing."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingSetId(null)}>
                {language === "ko" ? "취소" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowUnpublishWarning(false);
                setShowUnpublishConfirm(true);
              }}>
                {language === "ko" ? "확인" : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Second confirmation dialog */}
        <AlertDialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "ko" ? "정말 수정하시겠습니까?" : "Are you sure you want to edit?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ko" 
                  ? "게시된 콘티는 수정 시 밴드 멤버들에게 더 이상 보이지 않게 됩니다. 수정을 완료하고 다시 게시해 주세요." 
                  : "The published setlist will no longer be visible to band members. Complete your edits and republish when ready."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingSetId(null);
              }}>
                {language === "ko" ? "취소" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUnpublish}>
                {language === "ko" ? "수정하기" : "Edit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
