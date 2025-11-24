import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { PostComposer } from "./PostComposer";
import { SocialFeedPost } from "./SocialFeedPost";
import { ProfileDialog } from "./ProfileDialog";

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  ministry_role: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  location: string | null;
  instrument: string | null;
}

interface CommunityFeedProps {
  userStats?: {
    sets: number;
    communities: number;
    collaborations: number;
  };
}

export function CommunityFeed({ userStats }: CommunityFeedProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileStats, setSelectedProfileStats] = useState<any>(null);

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ["unified-community-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's communities
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const communityIds = memberData?.map((m) => m.community_id) || [];

      if (communityIds.length === 0) return [];

      // Fetch all post types in parallel with simple selects
      const [postsData, setsData, eventsData] = await Promise.all([
        // User posts
        supabase
          .from("community_posts")
          .select("*")
          .in("community_id", communityIds)
          .order("created_at", { ascending: false })
          .limit(50),

        // Worship sets (published only)
        supabase
          .from("service_sets")
          .select("*")
          .in("community_id", communityIds)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50),

        // Calendar events
        supabase
          .from("calendar_events")
          .select("*")
          .in("community_id", communityIds)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      // Explicit error checking
      if (postsData.error) {
        console.error("Error fetching posts:", postsData.error);
        throw postsData.error;
      }
      if (setsData.error) {
        console.error("Error fetching worship sets:", setsData.error);
        throw setsData.error;
      }
      if (eventsData.error) {
        console.error("Error fetching events:", eventsData.error);
        throw eventsData.error;
      }

      // Collect all unique author IDs and community IDs
      const authorIds = new Set<string>();
      const communityIdsSet = new Set<string>();

      (postsData.data || []).forEach((post) => {
        if (post.author_id) authorIds.add(post.author_id);
        if (post.community_id) communityIdsSet.add(post.community_id);
      });

      (setsData.data || []).forEach((set) => {
        if (set.created_by) authorIds.add(set.created_by);
        if (set.community_id) communityIdsSet.add(set.community_id);
      });

      (eventsData.data || []).forEach((event) => {
        if (event.created_by) authorIds.add(event.created_by);
        if (event.community_id) communityIdsSet.add(event.community_id);
      });

      // Fetch profiles and communities separately
      const [profilesData, communitiesData] = await Promise.all([
        authorIds.size > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", Array.from(authorIds))
          : { data: [], error: null },
        communityIdsSet.size > 0
          ? supabase
              .from("worship_communities")
              .select("id, name, avatar_url")
              .in("id", Array.from(communityIdsSet))
          : { data: [], error: null },
      ]);

      // Build maps
      const authorMap = new Map(
        (profilesData.data || []).map((p) => [p.id, p])
      );
      const communityMap = new Map(
        (communitiesData.data || []).map((c) => [c.id, c])
      );

      // Fallback objects for missing data
      const fallbackAuthor = {
        id: "",
        full_name: "Unknown User",
        avatar_url: null,
      };
      const fallbackCommunity = {
        id: "",
        name: "Unknown Community",
        avatar_url: null,
      };

      // Build unified feed items manually
      const allItems = [
        ...(postsData.data || []).map((post) => ({
          id: post.id,
          type: "community_post" as const,
          author: authorMap.get(post.author_id) || fallbackAuthor,
          community: communityMap.get(post.community_id) || fallbackCommunity,
          content: post.content,
          images: post.image_urls,
          created_at: post.created_at,
        })),
        ...(setsData.data || []).map((set) => ({
          id: set.id,
          type: "worship_set" as const,
          author: authorMap.get(set.created_by) || fallbackAuthor,
          community: communityMap.get(set.community_id) || fallbackCommunity,
          set: set,
          created_at: set.created_at,
        })),
        ...(eventsData.data || []).map((event) => ({
          id: event.id,
          type: "calendar_event" as const,
          author: authorMap.get(event.created_by) || fallbackAuthor,
          community: communityMap.get(event.community_id) || fallbackCommunity,
          event: event,
          created_at: event.created_at,
        })),
      ];

      // Sort by created_at descending
      allItems.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allItems;
    },
    enabled: !!user,
  });

  const openProfile = async (author: Author) => {
    // If clicking own profile, use existing userStats
    if (author.id === user?.id && userStats) {
      setSelectedProfile(null); // No override, will use auth profile
      setSelectedProfileStats(userStats);
      setProfileDialogOpen(true);
      return;
    }

    // Fetch full profile for other users
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", author.id)
      .maybeSingle();
    
    if (!error && data) {
      setSelectedProfile(data as Profile);
      setSelectedProfileStats(null); // Don't show stats for other users
      setProfileDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="space-y-4">
        <PostComposer />
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{t("dashboard.noActivity")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <PostComposer />
        {feedItems.map((item) => (
          <SocialFeedPost
            key={`${item.type}-${item.id}`}
            item={item}
            onProfileClick={openProfile}
          />
        ))}
      </div>

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profileOverride={selectedProfile || undefined}
        stats={selectedProfileStats}
      />
    </>
  );
}
