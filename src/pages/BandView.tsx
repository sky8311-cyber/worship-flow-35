import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { SignedScoreImage } from "@/components/score/SignedScoreImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Calendar, Printer, Edit, Lock, Globe, Eye, Maximize2, Share2, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { getSignedScoreUrls } from "@/utils/scoreUrl";
import { PrintOptionsDialog } from "@/components/band-view/PrintOptionsDialog";
import { FullscreenScoreViewer } from "@/components/band-view/FullscreenScoreViewer";
import { useMusicPlayer, PlaylistItem } from "@/contexts/MusicPlayerContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import DOMPurify from "dompurify";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { 
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle, Clock
} from "lucide-react";
import { WorshipComponentType, getComponentLabel } from "@/lib/worshipComponents";
import { PositionSignupCard } from "@/components/worship-set/PositionSignupCard";
import { parseLocalDate } from "@/lib/countdownHelper";
import { creditBandViewOpenedReward } from "@/lib/rewardsHelper";
import { SEOHead } from "@/components/seo/SEOHead";
import { openYouTubeUrl } from "@/lib/youtubeHelper";
import { ExternalLink } from "lucide-react";
import { NativeSafeYouTubeEmbed } from "@/components/ui/NativeSafeYouTubeEmbed";

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle,
};

const getIconForType = (type: WorshipComponentType): React.ComponentType<any> => {
  const iconNames: Record<string, string> = {
    countdown: "Timer",
    welcome: "HandMetal",
    prayer: "HandHeart",
    bible_reading: "BookOpen",
    sermon: "Mic",
    offering: "Heart",
    announcement: "Megaphone",
    lords_prayer: "ScrollText",
    apostles_creed: "ScrollText",
    benediction: "Sparkles",
    special_song: "Music2",
    testimony: "MessageCircle",
    communion: "Wine",
    baptism: "Droplets",
    small_group: "Users",
    responsive_reading: "MessagesSquare",
    custom: "Circle",
  };
  return iconMap[iconNames[type]] || Circle;
};

// Union type for items
type SetItem = 
  | { type: "song"; data: any; position: number; canView: boolean; isPrivate: boolean }
  | { type: "component"; data: any; position: number; canView: boolean; isPrivate: boolean };

const BandView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // State for browsing different score keys per song
  const [browsingKeyIndex, setBrowsingKeyIndex] = useState<Record<string, number>>({});
  
  // Unpublish confirmation states
  const [showUnpublishWarning, setShowUnpublishWarning] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  
  // Use global music player context
  const { startPlaylist } = useMusicPlayer();

  // Redirect non-authenticated users to login with redirect URL
  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = `/band-view/${id}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [authLoading, user, id, navigate]);

  // Check if user is viewing from a different community
  const { data: userCommunities } = useQuery({
    queryKey: ["user-communities", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user?.id || "");
      return data?.map(c => c.community_id) || [];
    },
    enabled: !!user,
  });

  const { data: serviceSet, isLoading } = useQuery({
    queryKey: ["band-view", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
    staleTime: 60_000,
  });

  const { data: setSongs } = useQuery({
    queryKey: ["band-view-songs", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_songs")
        .select(`
          *,
          songs(*)
        `)
        .eq("service_set_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Separate query for song scores to avoid nested alias issues with multi-page scores
  const songIds = setSongs?.map((s: any) => s.song_id) || [];
  const { data: allSongScores } = useQuery({
    queryKey: ["band-view-song-scores", id, songIds],
    enabled: !!setSongs && songIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_scores")
        .select("*")
        .in("song_id", songIds)
        .order("page_number", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Fetch per-set-song scores (set_song_scores) — used to pick the score that
  // matches the band's performance_key
  const setSongIds = setSongs?.map((s: any) => s.id) || [];
  const { data: allSetSongScores } = useQuery({
    queryKey: ["band-view-set-song-scores", id, setSongIds.join(",")],
    enabled: !!setSongs && setSongIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_song_scores")
        .select("*")
        .in("set_song_id", setSongIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Resolve the best score URL/thumbnail for a given set_song based on:
  //   1. set_song_scores row whose musical_key === performance_key
  //   2. set_song_scores row where is_primary = true
  //   3. legacy fallback (score_ref_url / private_score_file_url)
  const resolveSetSongScore = (setSong: any) => {
    const rows = (allSetSongScores || []).filter(
      (r: any) => r.set_song_id === setSong.id
    );
    const performanceKey = setSong.performance_key || setSong.key;
    const exact = rows.find((r: any) => r.musical_key === performanceKey);
    if (exact) return exact;
    const primary = rows.find((r: any) => r.is_primary);
    if (primary) return primary;
    if (setSong.score_ref_url) {
      return { score_url: setSong.score_ref_url, score_thumbnail: setSong.score_ref_thumbnail };
    }
    if (setSong.private_score_file_url) {
      return { score_url: setSong.private_score_file_url, score_thumbnail: null };
    }
    return null;
  };

  // Fetch YouTube links for all songs
  const { data: allYoutubeLinks } = useQuery({
    queryKey: ["band-view-youtube-links", id, songIds.join(",")],
    enabled: !!setSongs && songIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_youtube_links")
        .select("*")
        .in("song_id", songIds)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Batch-prefetch all signed score URLs to warm the cache
  useEffect(() => {
    if (!allSongScores || allSongScores.length === 0) return;
    const allUrls: string[] = [];
    for (const score of allSongScores) {
      if ((score as any).file_url) allUrls.push((score as any).file_url);
    }
    // Also include override/default score URLs from setSongs
    for (const ss of (setSongs || [])) {
      if ((ss as any).override_score_file_url) allUrls.push((ss as any).override_score_file_url);
      if ((ss as any).songs?.score_file_url) allUrls.push((ss as any).songs.score_file_url);
    }
    if (allUrls.length > 0) {
      getSignedScoreUrls(allUrls).then((map) => {
        for (const url of map.values()) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [allSongScores, setSongs]);

  const getYoutubeLinksForSong = (songId: string) => {
    return (allYoutubeLinks || [])
      .filter(link => link.song_id === songId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const { data: setComponents } = useQuery({
    queryKey: ["band-view-components", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_components")
        .select("*")
        .eq("service_set_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Check if user can edit this worship set
  const { data: canEditData } = useQuery({
    queryKey: ["can-edit-set", id, user?.id, serviceSet?.created_by, serviceSet?.community_id],
    enabled: !!id && !!user && !!serviceSet,
    queryFn: async () => {
      if (!id || !user || !serviceSet) return { canEdit: false };
      
      // Admin can always edit
      if (isAdmin) return { canEdit: true };
      
      // Check if user is creator (worship leader who created the set)
      if (serviceSet.created_by === user.id) return { canEdit: true };
      
      // Check if user is collaborator
      const { data: collaborator } = await supabase
        .from("set_collaborators")
        .select("id")
        .eq("service_set_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (collaborator) return { canEdit: true };
      
      // Check if user is community leader
      if (serviceSet.community_id) {
        const { data: member } = await supabase
          .from("community_members")
          .select("role")
          .eq("community_id", serviceSet.community_id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (member?.role === "community_leader") return { canEdit: true };
      }
      
      return { canEdit: false };
    },
    staleTime: 0,
  });

  const canEdit = canEditData?.canEdit || false;

  // Handle edit button click with unpublish confirmation for published sets
  const handleEditClick = () => {
    if (serviceSet?.status === "published") {
      setShowUnpublishWarning(true);
    } else {
      navigate(`/set-builder/${id}`);
    }
  };
  
  // Confirm unpublish and navigate to edit
  const handleConfirmUnpublish = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from("service_sets")
        .update({ status: "draft" })
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["band-view", id] });
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      
      toast.info(
        language === "ko" 
          ? "워십세트가 게시 취소되었습니다. 수정 후 다시 게시해주세요." 
          : "Worship set unpublished. Please republish after editing."
      );
      
      navigate(`/set-builder/${id}?unpublished=true`);
    } catch (error) {
      toast.error(language === "ko" ? "게시 취소 중 오류가 발생했습니다." : "Error unpublishing worship set.");
    } finally {
      setShowUnpublishConfirm(false);
    }
  };

  // Check if this is a cross-community view
  const isCrossCommunity = serviceSet?.community_id && 
    userCommunities && 
    !userCommunities.includes(serviceSet.community_id);

  // Increment view count for cross-community published sets (once per session)
  // Also credit K-Seed reward for viewing band view
  useEffect(() => {
    if (id && serviceSet && user) {
      // Credit K-Seed for Band View opened (fire-and-forget, per-set cooldown handled server-side)
      const rewardKey = `bandview_reward_${id}`;
      if (!sessionStorage.getItem(rewardKey)) {
        creditBandViewOpenedReward(user.id, id);
        sessionStorage.setItem(rewardKey, 'true');
      }
      
      // Increment view count for cross-community published sets
      if (isCrossCommunity && serviceSet.status === 'published') {
        const viewKey = `viewed_set_${id}`;
        if (!sessionStorage.getItem(viewKey)) {
          supabase.rpc('increment_set_view_count', { set_id: id }).then(() => {
            sessionStorage.setItem(viewKey, 'true');
          });
        }
      }
    }
  }, [id, serviceSet, isCrossCommunity, user]);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Check if current user can view a private song in this set
  const canViewPrivateSong = (song: any) => {
    if (!song) return false;
    // Public songs are always visible
    if (!song.is_private) return true;
    // Song owner can always see their own private songs
    if (song.created_by === user?.id) return true;
    // Check if both viewer and song owner are in the same community (the set's community)
    if (!serviceSet?.community_id) return false;
    // User must be a member of the set's community
    if (!userCommunities?.includes(serviceSet.community_id)) return false;
    // At this point, user is a member of the set's community
    // The song owner must also be a member (checked by the fact they could add it to this community's set)
    return true;
  };

  // Merge songs and components by position, with private song filtering
  const mergedItems: SetItem[] = [
    ...(setSongs || [])
      .map((song: any) => ({ 
        type: "song" as const, 
        data: song, 
        position: song.position,
        canView: canViewPrivateSong(song.songs),
        isPrivate: song.songs?.is_private || false,
      })),
    ...(setComponents || []).map((comp: any) => ({ 
      type: "component" as const, 
      data: comp, 
      position: comp.position,
      canView: true,
      isPrivate: false,
    })),
  ].sort((a, b) => a.position - b.position);

  // Helper function to get score files with fallback to any available key
  // Uses the separate allSongScores query for reliable multi-page score access
  const getScoreFilesWithFallback = (songId: string, selectedKey: string) => {
    // Filter scores for this specific song from the separate query
    const songScores = allSongScores?.filter((s: any) => s.song_id === songId) || [];
    
    // First try exact key match
    let scoreFiles = songScores
      .filter((score: any) => score.key === selectedKey)
      .sort((a: any, b: any) => (a.page_number || 1) - (b.page_number || 1));
    
    let scoreKeyUsed = selectedKey;
    
    // If no exact match, fallback to first available key's scores
    if (scoreFiles.length === 0 && songScores.length > 0) {
      scoreKeyUsed = songScores[0]?.key;
      scoreFiles = songScores
        .filter((s: any) => s.key === scoreKeyUsed)
        .sort((a: any, b: any) => (a.page_number || 1) - (b.page_number || 1));
    }
    
    return { scoreFiles, scoreKeyUsed, isUsingFallback: scoreKeyUsed !== selectedKey && scoreFiles.length > 0 };
  };

  // Helper function to get all available keys for a song
  const getAvailableKeysForSong = (songId: string) => {
    const keys = (allSongScores || [])
      .filter((s: any) => s.song_id === songId)
      .map((s: any) => s.key)
      .filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i);
    return keys;
  };

  // Collect all scores for fullscreen viewer
  // Priority: browsingKeyIndex (currently viewed key) > score_key (leader's saved choice) > key (performance key)
  const allScores = useMemo(() => {
    const scores: Array<{
      songTitle: string;
      songKey: string;
      imageUrl: string;
      position: number;
      pageNumber: number;
    }> = [];

    setSongs?.forEach((setSong: any) => {
      const song = setSong.songs;
      
      // Get available keys for this song
      const availableKeys = getAvailableKeysForSong(setSong.song_id);
      const currentBrowsingIdx = browsingKeyIndex[setSong.id];
      
      // Priority: browsing key > saved score_key > performance key
      const leaderScoreKey = 
        (currentBrowsingIdx !== undefined && availableKeys[currentBrowsingIdx])
        || setSong.score_key 
        || setSong.key;
      
      const { scoreFiles, scoreKeyUsed } = getScoreFilesWithFallback(setSong.song_id, leaderScoreKey);

      if (scoreFiles.length > 0) {
        scoreFiles.forEach((score: any, idx: number) => {
          scores.push({
            songTitle: song?.title || "",
            songKey: scoreKeyUsed || "",
            imageUrl: score.file_url,
            position: setSong.position,
            pageNumber: idx + 1,
          });
        });
      } else {
        const defaultScoreUrl = setSong.override_score_file_url || song?.score_file_url;
        if (defaultScoreUrl) {
          scores.push({
            songTitle: song?.title || "",
            songKey: setSong.key || "",
            imageUrl: defaultScoreUrl,
            position: setSong.position,
            pageNumber: 1,
          });
        }
      }
    });

    return scores;
  }, [setSongs, allSongScores, browsingKeyIndex]);

  // Build music playlist from songs with YouTube links
  const musicPlaylist: PlaylistItem[] = useMemo(() => {
    if (!setSongs || !allYoutubeLinks) return [];
    
    return setSongs
      .map((setSong: any) => {
        const song = setSong.songs;
        // Get YouTube links for this song (from song_youtube_links table)
        const songYoutubeLinks = (allYoutubeLinks || [])
          .filter((link: any) => link.song_id === setSong.song_id)
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        
        // Use first link from song_youtube_links, or fallback to override/legacy URL
        const youtubeUrl = songYoutubeLinks[0]?.url || setSong.override_youtube_url || song?.youtube_url;
        const videoId = getYouTubeVideoId(youtubeUrl);
        
        if (!videoId) return null;
        
        return {
          videoId,
          title: song?.title || t("bandView.noTitle"),
          artist: song?.artist || "",
          position: setSong.position,
          lyrics: setSong.lyrics || song?.lyrics || undefined,
        };
      })
      .filter((item: PlaylistItem | null): item is PlaylistItem => item !== null)
      .sort((a: PlaylistItem, b: PlaylistItem) => a.position - b.position);
  }, [setSongs, allYoutubeLinks, t]);

  // Handler to start music playback using global context
  const handleStartMusicPlayer = () => {
    if (musicPlaylist.length > 0) {
      // Format: "2025-01-07 금요 찬양 예배"
      const formattedDate = serviceSet?.date 
        ? format(parseLocalDate(serviceSet.date), 'yyyy-MM-dd')
        : '';
      const displayTitle = formattedDate 
        ? `${formattedDate} ${serviceSet?.service_name || ""}`.trim()
        : serviceSet?.service_name || "Worship Set";
      
      startPlaylist(
        musicPlaylist, 
        displayTitle, 
        id || ""
      );
    }
  };

  // Show loading while checking auth or fetching data
  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t("bandView.loading")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!user) {
    return null;
  }

  if (!serviceSet) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {t("bandView.accessDenied")}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("bandView.notMemberOrNotExists")}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbNav = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/worship-sets">{t("worshipSets.title")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{serviceSet?.service_name || t("bandView.pageTitle")}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  // Dynamic page title for browser tab
  const pageTitle = serviceSet?.service_name 
    || (language === "ko" ? "예배 세트" : "Worship Set");
  const pageDescription = serviceSet?.date 
    ? `${serviceSet.service_name || ""} - ${format(parseLocalDate(serviceSet.date), language === "ko" ? "yyyy년 M월 d일" : "MMMM d, yyyy", { locale: language === "ko" ? ko : undefined })}`
    : (language === "ko" ? "예배 세트 상세 보기" : "Worship set details");

  return (
    <>
    <SEOHead 
      title={pageTitle}
      titleKo={serviceSet?.service_name || "예배 세트"}
      description={pageDescription}
      descriptionKo={pageDescription}
      noIndex={true}
    />
    <AppLayout breadcrumb={breadcrumbNav}>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {searchParams.get('preview') === 'true' && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ 미리보기 모드 — 아직 게시되지 않은 워십세트입니다
          </div>
        )}
        {/* Cross-community read-only banner */}
        {isCrossCommunity && serviceSet?.status === 'published' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/30 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-semibold text-foreground">
                  {t("songUsage.crossCommunityTitle")}
                </p>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {t("songUsage.readOnly")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("songUsage.crossCommunitySubtext")}
              </p>
              {serviceSet.view_count > 0 && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-background/80 rounded-full text-xs text-muted-foreground border border-border/50">
                    <Eye className="w-3.5 h-3.5" />
                    {t("songUsage.viewCount")} {serviceSet.view_count}{t("songUsage.times")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("bandView.pageTitle")}</h1>
              {!canEdit && <Badge variant="secondary" className="text-xs">{t("bandView.readOnly")}</Badge>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === "ko" ? "공유" : "Share"}</span>
                </Button>
                <Button
                  variant="default"
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("common.edit")}</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setPrintDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t("bandView.print")}</span>
            </Button>
            {allScores.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setFullscreenOpen(true)}
                className="flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t("bandView.fullscreenScores")}</span>
              </Button>
            )}
            {musicPlaylist.length > 0 && (
              <Button
                variant="outline"
                onClick={handleStartMusicPlayer}
                className="flex items-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                <span className="hidden sm:inline">{t("bandView.musicPlayer.title")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Service Set Header */}
        <Card className="shadow-lg mb-6 print:shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1 print:hidden" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {serviceSet.service_name}
                  </h2>
                  <Badge variant={serviceSet.status === "published" ? "default" : "secondary"}>
                    {serviceSet.status === "published" ? t("bandView.published") : t("bandView.draft")}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-3">
                  {format(parseLocalDate(serviceSet.date), "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {serviceSet.worship_leader && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">{t("bandView.labels.leader")}:</span> {serviceSet.worship_leader}
                    </p>
                  )}
                  {serviceSet.band_name && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">{t("bandView.labels.team")}:</span> {serviceSet.band_name}
                    </p>
                  )}
                  {serviceSet.target_audience && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">{t("bandView.labels.audience")}:</span> {serviceSet.target_audience}
                    </p>
                  )}
                  {serviceSet.worship_duration && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">{t("bandView.labels.duration")}:</span> {serviceSet.worship_duration}{t("bandView.minutes")}
                    </p>
                  )}
                </div>

                {serviceSet.theme && (
                  <p className="text-sm text-foreground mt-3">
                    <span className="font-semibold">{t("bandView.labels.theme")}:</span> {serviceSet.theme}
                  </p>
                )}
                {serviceSet.scripture_reference && (
                  <p className="text-sm text-foreground mt-2">
                    <span className="font-semibold">{t("bandView.labels.scripture")}:</span> {serviceSet.scripture_reference}
                  </p>
                )}
                {serviceSet.notes && (
                  <p className="text-sm text-muted-foreground mt-3 p-3 bg-accent/30 rounded-lg">
                    {serviceSet.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Positions Sign-up */}
        {id && <PositionSignupCard serviceSetId={id} />}

        {/* Items List (Songs + Components) */}
        <div className="space-y-6">
          {mergedItems.map((item) => {
            if (item.type === "component") {
              const component = item.data;
              const IconComponent = getIconForType(component.component_type);
              
              return (
                <Card key={`component-${component.id}`} className="shadow-md border-l-4 border-l-accent print:shadow-none print:break-inside-avoid">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center print:bg-gray-200">
                          <span className="text-xl font-bold text-accent">
                            {item.position}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="gap-1.5">
                            <IconComponent className="w-3.5 h-3.5" />
                            {component.component_type !== "custom" 
                              ? getComponentLabel(component.component_type, language as "en" | "ko")
                              : null
                            }
                          </Badge>
                          {component.component_type === "custom" && (
                            <span className="font-semibold text-foreground">{component.label}</span>
                          )}
                          {component.duration_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {component.duration_minutes}{language === "ko" ? "분" : "min"}
                            </span>
                          )}
                        </div>
                        
                        {component.label && component.component_type !== "custom" && (
                          <p className="text-sm text-foreground">{component.label}</p>
                        )}
                        
                        {/* Rich content rendering */}
                        {component.content && (
                          <div 
                            className="prose prose-sm max-w-none mt-3 p-3 bg-background rounded-lg border"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(component.content) }}
                          />
                        )}

                        {component.notes && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-accent/10 rounded">
                            {component.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Song item
            const setSong = item.data;
            const song = setSong.songs;
            
            // Render hidden placeholder for private songs the user cannot view
            if (!item.canView) {
              return (
                <Card key={`song-${setSong.id}`} className="shadow-md print:shadow-none print:break-inside-avoid bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-center">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          {t("songDialog.privateSongInSet")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("songDialog.privateSongHidden")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            // Get multiple YouTube links for this song
            const youtubeLinks = getYoutubeLinksForSong(setSong.song_id);
            // Fallback to legacy single URL if no links in new table
            const fallbackYoutubeUrl = setSong.override_youtube_url || song?.youtube_url;
            const fallbackVideoId = getYouTubeVideoId(fallbackYoutubeUrl);
            
            // Get available keys for this song
            const availableKeys = getAvailableKeysForSong(setSong.song_id);
            // Priority: score_key (leader's chosen score key) > key (performance key)
            const leaderSelectedScoreKey = setSong.score_key || setSong.key;
            const defaultKeyIndex = availableKeys.indexOf(leaderSelectedScoreKey);
            const currentKeyIndex = browsingKeyIndex[setSong.id] ?? (defaultKeyIndex >= 0 ? defaultKeyIndex : 0);
            const currentBrowsingKey = availableKeys[currentKeyIndex] || leaderSelectedScoreKey;
            
            // Get score files for the currently browsing key
            const { scoreFiles, scoreKeyUsed, isUsingFallback } = getScoreFilesWithFallback(setSong.song_id, currentBrowsingKey);

            // Fallback to default score_file_url if no key-specific scores at all
            const defaultScoreUrl = setSong.override_score_file_url || song?.score_file_url;

            return (
              <Card key={`song-${setSong.id}`} className="shadow-md print:shadow-none print:break-inside-avoid">
                <CardContent className="p-6">
                  {/* Song Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center print:bg-gray-800">
                        <span className="text-3xl font-bold text-white">
                          {setSong.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-foreground">
                          {song?.title || t("bandView.noTitle")}
                        </h3>
                        {item.isPrivate && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Lock className="w-3 h-3" />
                            {t("songDialog.private")}
                          </Badge>
                        )}
                      </div>
                      {song?.subtitle && (
                        <p className="text-sm italic text-muted-foreground mb-2">
                          {song.subtitle}
                        </p>
                      )}
                      {song?.artist && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {song.artist}
                        </p>
                      )}

                      {/* Song Metadata Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {setSong.key && (
                          <Badge variant="default" className="text-sm">
                            {t("bandView.labels.key")}: {setSong.key}
                            {setSong.key_change_to && ` → ${setSong.key_change_to}`}
                          </Badge>
                        )}
                        {setSong.bpm && (
                          <Badge variant="secondary" className="text-sm">
                            BPM: {setSong.bpm}
                          </Badge>
                        )}
                        {setSong.time_signature && (
                          <Badge variant="secondary" className="text-sm">
                            {setSong.time_signature}
                          </Badge>
                        )}
                        {setSong.energy_level && (
                          <Badge variant="secondary" className="text-sm">
                            {t("bandView.labels.energy")}: {setSong.energy_level}/5
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Notes */}
                  {setSong.custom_notes && (
                    <div className="mb-4 p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{t("bandView.labels.performanceNotes")}:</span> {setSong.custom_notes}
                      </p>
                    </div>
                  )}

                  {/* Lyrics Section */}
                  {setSong.lyrics && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">{t("bandView.labels.lyrics")}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(setSong.lyrics);
                            toast.success(t("bandView.lyricsCopied"));
                          }}
                          className="print:hidden"
                        >
                          {t("bandView.copyLyrics")}
                        </Button>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">{setSong.lyrics}</pre>
                      </div>
                    </div>
                  )}

                  {/* Embedded YouTube Player(s) */}
                  {youtubeLinks.length > 0 ? (
                    <div className="mb-4 print:hidden">
                      {youtubeLinks.length === 1 ? (
                        // Single link: show directly
                        (() => {
                          const videoId = getYouTubeVideoId(youtubeLinks[0].url);
                          return videoId ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                {youtubeLinks[0].label && (
                                  <p className="text-sm font-semibold text-foreground">{youtubeLinks[0].label}</p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs ml-auto"
                                  onClick={() => openYouTubeUrl(youtubeLinks[0].url)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {language === "ko" ? "YouTube 앱" : "YouTube App"}
                                </Button>
                              </div>
                              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                <NativeSafeYouTubeEmbed
                                  videoId={videoId}
                                  title={youtubeLinks[0].label || song?.title || "YouTube video"}
                                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                                />
                              </div>
                            </div>
                          ) : null;
                        })()
                      ) : (
                        // Multiple links: show as tabs
                        <Tabs defaultValue="0" className="w-full">
                          <TabsList className="mb-2 flex-wrap h-auto">
                            {youtubeLinks.map((link, idx) => (
                              <TabsTrigger key={link.id} value={String(idx)} className="text-xs">
                                {link.label || `${language === "ko" ? "영상" : "Video"} ${idx + 1}`}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {youtubeLinks.map((link, idx) => {
                            const videoId = getYouTubeVideoId(link.url);
                            return (
                              <TabsContent key={link.id} value={String(idx)}>
                                {videoId && (
                                  <div>
                                    <div className="flex justify-end mb-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                        onClick={() => openYouTubeUrl(link.url)}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        {language === "ko" ? "YouTube 앱" : "YouTube App"}
                                      </Button>
                                    </div>
                                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                      <NativeSafeYouTubeEmbed
                                        videoId={videoId}
                                        title={link.label || song?.title || "YouTube video"}
                                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                                      />
                                    </div>
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      )}
                    </div>
                  ) : fallbackVideoId ? (
                    // Fallback to legacy single youtube_url field
                    <div className="mb-4 print:hidden">
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => openYouTubeUrl(fallbackYoutubeUrl)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {language === "ko" ? "YouTube 앱" : "YouTube App"}
                        </Button>
                      </div>
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <NativeSafeYouTubeEmbed
                          videoId={fallbackVideoId}
                          title={song?.title || "YouTube video"}
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Embedded Score Images */}
                  {scoreFiles.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Key navigation for multiple score keys */}
                        {availableKeys.length > 1 && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              disabled={currentKeyIndex <= 0}
                              onClick={() => setBrowsingKeyIndex(prev => ({ ...prev, [setSong.id]: currentKeyIndex - 1 }))}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        <Badge variant="default" className="px-3">
                          {scoreKeyUsed}
                          {scoreKeyUsed !== leaderSelectedScoreKey && (
                            <span className="ml-1.5 text-xs opacity-70">
                              ({language === "ko" ? "인도자 선택" : "Leader"}: {leaderSelectedScoreKey})
                            </span>
                          )}
                        </Badge>
                        
                        {availableKeys.length > 1 && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              disabled={currentKeyIndex >= availableKeys.length - 1}
                              onClick={() => setBrowsingKeyIndex(prev => ({ ...prev, [setSong.id]: currentKeyIndex + 1 }))}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              ({currentKeyIndex + 1}/{availableKeys.length})
                            </span>
                          </>
                        )}
                        
                        {isUsingFallback && availableKeys.length <= 1 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
                            {language === "ko" ? `선택된 키: ${setSong.key}` : `Selected: ${setSong.key}`}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {scoreFiles.map((score: any, idx: number) => (
                          <div key={score.id} className="border rounded-lg overflow-hidden bg-white">
                            <SignedScoreImage
                              src={score.file_url}
                              alt={`${song?.title} - Page ${idx + 1}`}
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : defaultScoreUrl ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">{t("bandView.score")}</p>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <SignedScoreImage
                          src={defaultScoreUrl}
                          alt={song?.title || "Score"}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mergedItems.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("bandView.noSongsAdded")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Print Options Dialog */}
        <PrintOptionsDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          serviceSet={serviceSet}
          setSongs={setSongs || []}
          setComponents={setComponents || []}
          allSongScores={allSongScores || []}
          browsingKeyIndex={browsingKeyIndex}
        />

        {/* Fullscreen Score Viewer */}
        <FullscreenScoreViewer
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          scores={allScores}
        />

        <ShareLinkDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          setId={id || ""}
          publicShareToken={serviceSet?.public_share_token || null}
          publicShareEnabled={serviceSet?.public_share_enabled || false}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["band-view", id] })}
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
              <AlertDialogCancel>
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
                {language === "ko" ? "게시 취소 확인" : "Confirm Unpublish"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ko" 
                  ? "정말 게시를 취소하시겠습니까? 게시 취소 후 워십세트가 수정 가능 상태가 됩니다." 
                  : "Are you sure you want to unpublish? The worship set will become editable after unpublishing."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "ko" ? "취소" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUnpublish}>
                {language === "ko" ? "게시 취소" : "Unpublish"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  </>
  );
};

export default BandView;
