import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendStudios } from "@/hooks/useFriendStudios";
import { useAmbassadorRooms } from "@/hooks/useWorshipRoom";

export interface StoryStudio {
  id: string; // room id
  ownerUserId: string;
  ownerName: string | null;
  avatarUrl: string | null;
  isAmbassador: boolean;
  isSelf: boolean;
  bgmSongTitle: string | null;
  bgmSongArtist: string | null;
  bgmYoutubeUrl: string | null;
  statusEmoji: string | null;
  statusText: string | null;
  coverImageUrl: string | null;
  latestPostTitle: string | null;
  latestPostContent: string | null;
  latestPostAt: string | null;
  hasNewPosts: boolean;
  updatedAt: string;
}

function getVisitCounts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("studio-visit-counts") || "{}");
  } catch {
    return {};
  }
}

export function incrementVisitCount(roomId: string) {
  const counts = getVisitCounts();
  counts[roomId] = (counts[roomId] || 0) + 1;
  localStorage.setItem("studio-visit-counts", JSON.stringify(counts));
}

function extractTextFromBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  const texts: string[] = [];
  for (const block of blocks) {
    if (typeof block === "object" && block !== null) {
      const b = block as Record<string, unknown>;
      if (typeof b.content === "string") texts.push(b.content);
      if (typeof b.text === "string") texts.push(b.text);
    }
    if (texts.join(" ").length > 120) break;
  }
  return texts.join(" ").slice(0, 150);
}

export function useStoryBarStudios(myStudioId?: string) {
  const { user } = useAuth();
  const { data: friendStudios } = useFriendStudios();
  const { data: ambassadorRooms } = useAmbassadorRooms();

  // Collect all room IDs we need latest posts for
  const allRoomIds = useMemo(() => {
    const ids = new Set<string>();
    if (myStudioId) ids.add(myStudioId);
    friendStudios?.forEach(s => ids.add(s.id));
    ambassadorRooms?.forEach(r => ids.add(r.id));
    return Array.from(ids);
  }, [myStudioId, friendStudios, ambassadorRooms]);

  // Fetch latest published post per room
  const { data: latestPosts } = useQuery({
    queryKey: ["story-bar-latest-posts", allRoomIds],
    queryFn: async () => {
      if (allRoomIds.length === 0) return [];
      const { data } = await supabase
        .from("room_posts")
        .select("room_id, title, blocks, created_at")
        .in("room_id", allRoomIds)
        .eq("is_draft", false)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: allRoomIds.length > 0,
    staleTime: 1000 * 60 * 3,
  });

  // Fetch status fields for all rooms
  const { data: roomStatuses } = useQuery({
    queryKey: ["story-bar-statuses", allRoomIds],
    queryFn: async () => {
      if (allRoomIds.length === 0) return [];
      const { data } = await supabase
        .from("worship_rooms")
        .select("id, status_emoji, status_text, cover_image_url, updated_at")
        .in("id", allRoomIds);
      return data || [];
    },
    enabled: allRoomIds.length > 0,
    staleTime: 1000 * 60 * 3,
  });

  const studios = useMemo<StoryStudio[]>(() => {
    if (!user) return [];

    // Build maps
    const latestPostMap = new Map<string, { title: string | null; blocks: unknown; created_at: string }>();
    latestPosts?.forEach(p => {
      if (!latestPostMap.has(p.room_id)) {
        latestPostMap.set(p.room_id, p);
      }
    });

    const statusMap = new Map<string, { status_emoji: string | null; status_text: string | null; cover_image_url: string | null; updated_at: string }>();
    roomStatuses?.forEach(r => statusMap.set(r.id, r));

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const visitCounts = getVisitCounts();
    const seenIds = new Set<string>();

    const buildStudio = (
      roomId: string,
      ownerUserId: string,
      ownerName: string | null,
      avatarUrl: string | null,
      isAmbassador: boolean,
      isSelf: boolean,
      bgmTitle: string | null,
      bgmArtist: string | null,
      bgmYoutubeUrl: string | null,
      friendLatestPostAt: string | null,
      friendHasNewPosts: boolean,
    ): StoryStudio | null => {
      if (seenIds.has(roomId)) return null;
      seenIds.add(roomId);

      const post = latestPostMap.get(roomId);
      const status = statusMap.get(roomId);

      return {
        id: roomId,
        ownerUserId,
        ownerName,
        avatarUrl,
        isAmbassador,
        isSelf,
        bgmSongTitle: bgmTitle,
        bgmSongArtist: bgmArtist,
        bgmYoutubeUrl: bgmYoutubeUrl,
        statusEmoji: status?.status_emoji || null,
        statusText: status?.status_text || null,
        coverImageUrl: status?.cover_image_url || null,
        latestPostTitle: post?.title || null,
        latestPostContent: post ? extractTextFromBlocks(post.blocks) : null,
        latestPostAt: post?.created_at || friendLatestPostAt || null,
        hasNewPosts: friendHasNewPosts || (post ? new Date(post.created_at) > oneDayAgo : false),
        updatedAt: status?.updated_at || "",
      };
    };

    const result: StoryStudio[] = [];

    // Own studio first — we need the room status data to exist
    if (myStudioId) {
      const s = buildStudio(myStudioId, user.id, null, null, false, true, null, null, null, null, false);
      if (s) result.push(s);
    }

    // Friend studios
    const friendEntries: StoryStudio[] = [];
    friendStudios?.forEach(fs => {
      const s = buildStudio(
        fs.id, fs.owner_user_id,
        fs.owner?.full_name || null, fs.owner?.avatar_url || null,
        fs.owner?.is_ambassador || false, false,
        fs.bgm_song?.title || null, fs.bgm_song?.artist || null, fs.bgm_song?.youtube_url || null,
        fs.latestPostAt || null, fs.hasNewPosts || false,
      );
      if (s) friendEntries.push(s);
    });

    // Sort friends: active first, then by visit count
    friendEntries.sort((a, b) => {
      const aActive = a.hasNewPosts ? 1 : 0;
      const bActive = b.hasNewPosts ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0);
    });
    result.push(...friendEntries);

    // Ambassador studios (after friends)
    const ambassadorEntries: StoryStudio[] = [];
    ambassadorRooms?.forEach(ar => {
      const s = buildStudio(
        ar.id, ar.owner_user_id,
        ar.owner?.full_name || null, ar.owner?.avatar_url || null,
        true, false,
        null, null, null, null, false,
      );
      if (s) ambassadorEntries.push(s);
    });
    result.push(...ambassadorEntries);

    return result;
  }, [user, myStudioId, friendStudios, ambassadorRooms, latestPosts, roomStatuses]);

  return studios;
}
