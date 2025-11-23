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

export function CommunityFeed() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Author | null>(null);

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

      // Fetch all post types in parallel
      const [postsData, setsData, eventsData] = await Promise.all([
        // User posts
        supabase
          .from("community_posts")
          .select(`
            *,
            profiles!community_posts_author_id_fkey(id, full_name, avatar_url),
            worship_communities!inner(id, name, avatar_url)
          `)
          .in("community_id", communityIds)
          .order("created_at", { ascending: false })
          .limit(50),

        // Worship sets (published only)
        supabase
          .from("service_sets")
          .select(`
            *,
            profiles!service_sets_created_by_fkey(id, full_name, avatar_url),
            worship_communities!inner(id, name, avatar_url)
          `)
          .in("community_id", communityIds)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50),

        // Calendar events
        supabase
          .from("calendar_events")
          .select(`
            *,
            profiles!calendar_events_created_by_fkey(id, full_name, avatar_url),
            worship_communities!inner(id, name, avatar_url)
          `)
          .in("community_id", communityIds)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      // Normalize all items into unified feed format
      const allItems = [
        ...(postsData.data || []).map((post) => ({
          id: post.id,
          type: "community_post" as const,
          author: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
          community: Array.isArray(post.worship_communities) ? post.worship_communities[0] : post.worship_communities,
          content: post.content,
          images: post.image_urls,
          created_at: post.created_at,
        })),
        ...(setsData.data || []).map((set) => ({
          id: set.id,
          type: "worship_set" as const,
          author: Array.isArray(set.profiles) ? set.profiles[0] : set.profiles,
          community: Array.isArray(set.worship_communities) ? set.worship_communities[0] : set.worship_communities,
          set: set,
          created_at: set.created_at,
        })),
        ...(eventsData.data || []).map((event) => ({
          id: event.id,
          type: "calendar_event" as const,
          author: Array.isArray(event.profiles) ? event.profiles[0] : event.profiles,
          community: Array.isArray(event.worship_communities) ? event.worship_communities[0] : event.worship_communities,
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

  const openProfile = (author: Author) => {
    setSelectedProfile(author);
    setProfileDialogOpen(true);
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
      />
    </>
  );
}
