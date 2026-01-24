import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { Loader2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostComposer } from "./PostComposer";
import { SocialFeedPost } from "./SocialFeedPost";
import { ProfileDialog } from "./ProfileDialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnnouncementsSection } from "./AnnouncementsSection";

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

interface CommunityNewsfeedProps {
  userStats?: {
    sets: number;
    communities: number;
    songs: number;
  };
  canPost?: boolean;
}

export function CommunityNewsfeed({ userStats, canPost = false }: CommunityNewsfeedProps) {
  const { user, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const { t, language } = useTranslation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileStats, setSelectedProfileStats] = useState<any>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const { data: communitiesData, isLoading: communitiesLoading } = useUserCommunities();
  const communities = communitiesData?.communities || [];

  // Set default selected community
  const activeCommunityId = selectedCommunityId || communities[0]?.id;

  // Fetch welcome posts (announcements)
  const { data: welcomePosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["welcome-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("welcome_posts")
        .select(`
          *,
          author:profiles!welcome_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: feedItems, isLoading: feedLoading } = useQuery({
    queryKey: ["community-newsfeed", activeCommunityId],
    queryFn: async () => {
      if (!user || !activeCommunityId) return [];

      // Fetch only community posts
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("community_id", activeCommunityId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Collect author IDs
      const authorIds = new Set<string>();
      (postsData || []).forEach((post) => {
        if (post.author_id) authorIds.add(post.author_id);
      });

      // Fetch profiles
      const { data: profilesData } = authorIds.size > 0
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", Array.from(authorIds))
        : { data: [] };

      const authorMap = new Map((profilesData || []).map((p) => [p.id, p]));
      
      // Get community info
      const community = communities.find(c => c.id === activeCommunityId) || {
        id: activeCommunityId,
        name: "Unknown Community",
        avatar_url: null,
      };

      const fallbackAuthor = { id: "", full_name: "Unknown User", avatar_url: null };

      // Build feed with only community posts
      const allItems = (postsData || []).map((post) => ({
        id: post.id,
        type: "community_post" as const,
        author: authorMap.get(post.author_id) || fallbackAuthor,
        community,
        content: post.content,
        images: post.image_urls,
        created_at: post.created_at,
      }));

      return allItems;
    },
    enabled: !!user && !!activeCommunityId,
  });

  const openProfile = async (author: Author) => {
    if (author.id === user?.id && userStats) {
      setSelectedProfile(null);
      setSelectedProfileStats(userStats);
      setProfileDialogOpen(true);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", author.id)
      .maybeSingle();

    if (!error && data) {
      setSelectedProfile(data as Profile);
      setSelectedProfileStats(null);
      setProfileDialogOpen(true);
    }
  };

  // Admin, Worship Leader, Community Leader can post
  const canPostInCommunity = canPost || isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;

  // Show announcements if admin or posts exist
  const showAnnouncements = isAdmin || welcomePosts.length > 0;

  if (communitiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No communities - show find community prompt
  if (communities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
        {/* Announcements at top even when no communities */}
        {showAnnouncements && (
          <div className="w-full mb-6">
            <AnnouncementsSection
              posts={welcomePosts}
              isLoading={postsLoading}
              isAdmin={isAdmin}
            />
          </div>
        )}
        
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {language === "ko" ? "아직 예배공동체에 가입하지 않았어요" : "You haven't joined a community yet"}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {language === "ko" 
            ? "예배공동체에 가입하면 팀원들과 소통하고, 워십세트와 일정을 함께 확인할 수 있어요."
            : "Join a community to connect with your team, share worship sets, and stay updated on events."}
        </p>
        <Button asChild>
          <Link to="/communities">
            {language === "ko" ? "예배공동체 찾기" : "Find Community"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Announcements Section (top of feed) */}
        {showAnnouncements && (
          <AnnouncementsSection
            posts={welcomePosts}
            isLoading={postsLoading}
            isAdmin={isAdmin}
          />
        )}

        {/* Community Tabs (only show if multiple communities) */}
        {communities.length > 1 ? (
          <Tabs value={activeCommunityId} onValueChange={setSelectedCommunityId}>
            <TabsList className="w-full justify-start px-4 py-3 h-auto flex-wrap gap-2 bg-muted/30 rounded-none border-b">
              {communities.map((community) => (
                <TabsTrigger
                  key={community.id}
                  value={community.id}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-border bg-background/80 text-muted-foreground transition-all
                    hover:bg-muted hover:text-foreground
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm"
                >
                  {community.avatar_url && (
                    <img 
                      src={community.avatar_url} 
                      alt="" 
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  {community.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {communities.map((community) => (
              <TabsContent
                key={community.id}
                value={community.id}
                className="p-4 space-y-4 mt-0"
              >
                <FeedContent
                  feedItems={feedItems}
                  feedLoading={feedLoading}
                  canPostInCommunity={canPostInCommunity}
                  openProfile={openProfile}
                  language={language}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="p-4 space-y-4">
            <FeedContent
              feedItems={feedItems}
              feedLoading={feedLoading}
              canPostInCommunity={canPostInCommunity}
              openProfile={openProfile}
              language={language}
            />
          </div>
        )}
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

// Extracted feed content component
function FeedContent({
  feedItems,
  feedLoading,
  canPostInCommunity,
  openProfile,
  language,
}: {
  feedItems: any[] | undefined;
  feedLoading: boolean;
  canPostInCommunity: boolean;
  openProfile: (author: Author) => void;
  language: string;
}) {
  if (feedLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {canPostInCommunity && <PostComposer />}

      {feedItems && feedItems.length > 0 ? (
        feedItems.map((item) => (
          <SocialFeedPost
            key={`${item.type}-${item.id}`}
            item={item}
            onProfileClick={openProfile}
          />
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            {language === "ko" ? "아직 게시물이 없습니다." : "No posts yet."}
          </p>
        </div>
      )}
    </>
  );
}
