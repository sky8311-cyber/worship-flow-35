import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { SystemMessage } from "./SystemMessage";
import { ProfileDialog } from "./ProfileDialog";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dateUtils";

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

interface ChatFeedProps {
  userStats?: {
    sets: number;
    communities: number;
    collaborations: number;
  };
}

export function ChatFeed({ userStats }: ChatFeedProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileStats, setSelectedProfileStats] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  
  const { data: communitiesData, isLoading: communitiesLoading } = useUserCommunities();
  const communities = communitiesData?.communities || [];

  // Set default selected community when data loads
  useEffect(() => {
    if (communities.length > 0 && !selectedCommunityId) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities, selectedCommunityId]);

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ["community-feed", user?.id, selectedCommunityId],
    queryFn: async () => {
      if (!user || !selectedCommunityId) return [];

      // Calculate date range for birthdays this week
      const today = new Date();

      // Fetch community member user IDs (needed for birthday query)
      const { data: communityMemberIds } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", selectedCommunityId);
      
      const memberUserIds = communityMemberIds?.map(m => m.user_id) || [];

      // Fetch all post types in parallel for selected community
      const [postsData, setsData, eventsData, birthdayData] = await Promise.all([
        // User posts
        supabase
          .from("community_posts")
          .select("*")
          .eq("community_id", selectedCommunityId)
          .order("created_at", { ascending: false })
          .limit(50),

        // Worship sets (published only)
        supabase
          .from("service_sets")
          .select("*")
          .eq("community_id", selectedCommunityId)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50),

        // Calendar events
        supabase
          .from("calendar_events")
          .select("*")
          .eq("community_id", selectedCommunityId)
          .order("created_at", { ascending: false })
          .limit(50),

        // Birthday profiles - members with birthdays this week
        memberUserIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, avatar_url, birth_date")
              .not("birth_date", "is", null)
              .in("id", memberUserIds)
          : { data: [], error: null },
      ]);

      // Explicit error checking
      if (postsData.error) throw postsData.error;
      if (setsData.error) throw setsData.error;
      if (eventsData.error) throw eventsData.error;
      if (birthdayData.error) throw birthdayData.error;

      // Filter birthdays to this week only
      const birthdaysThisWeek = (birthdayData.data || []).filter((profile) => {
        if (!profile.birth_date) return false;
        const birthDate = parseLocalDate(profile.birth_date);
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();
        
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          if (checkDate.getMonth() === birthMonth && checkDate.getDate() === birthDay) {
            return true;
          }
        }
        return false;
      });

      // Collect all unique author IDs
      const authorIds = new Set<string>();

      (postsData.data || []).forEach((post) => {
        if (post.author_id) authorIds.add(post.author_id);
      });

      (setsData.data || []).forEach((set) => {
        if (set.created_by) authorIds.add(set.created_by);
      });

      (eventsData.data || []).forEach((event) => {
        if (event.created_by) authorIds.add(event.created_by);
      });

      // Fetch profiles and community info
      const [profilesData, communityData] = await Promise.all([
        authorIds.size > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", Array.from(authorIds))
          : { data: [], error: null },
        supabase
          .from("worship_communities")
          .select("id, name, avatar_url")
          .eq("id", selectedCommunityId)
          .single(),
      ]);

      // Build maps
      const authorMap = new Map(
        (profilesData.data || []).map((p) => [p.id, p])
      );
      const community = communityData.data || { id: selectedCommunityId, name: "Unknown", avatar_url: null };

      // Fallback objects
      const fallbackAuthor = {
        id: "",
        full_name: "Unknown User",
        avatar_url: null,
      };

      // Build birthday items
      const birthdayItems = birthdaysThisWeek.map((profile) => ({
        id: `birthday-${profile.id}`,
        type: "birthday" as const,
        profile: profile,
        community: community,
        created_at: profile.birth_date || new Date().toISOString(),
      }));

      // Build unified feed items
      const allItems = [
        ...(postsData.data || []).map((post) => ({
          id: post.id,
          type: "community_post" as const,
          author: authorMap.get(post.author_id) || fallbackAuthor,
          community: community,
          content: post.content,
          images: post.image_urls,
          created_at: post.created_at,
        })),
        ...(setsData.data || []).map((set) => ({
          id: set.id,
          type: "worship_set" as const,
          author: authorMap.get(set.created_by) || fallbackAuthor,
          community: community,
          set: set,
          created_at: set.created_at,
        })),
        ...(eventsData.data || []).map((event) => ({
          id: event.id,
          type: "calendar_event" as const,
          author: authorMap.get(event.created_by) || fallbackAuthor,
          community: community,
          event: event,
          created_at: event.created_at,
        })),
        ...birthdayItems,
      ];

      // Sort by created_at ascending (oldest at top, newest at bottom - chat style)
      allItems.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return allItems;
    },
    enabled: !!user && !!selectedCommunityId,
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

  // Auto-scroll to bottom on community change or new messages (chat style)
  useEffect(() => {
    if (scrollContainerRef.current && feedItems?.length) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [feedItems?.length, selectedCommunityId]);

  const showTabs = communities.length > 1;

  if (communitiesLoading || isLoading) {
    return (
      <div className="flex flex-col h-full">
        {showTabs && (
          <div className="flex gap-2 px-3 py-2 border-b overflow-x-auto shrink-0">
            {communities.map((c: any) => (
              <div key={c.id} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <ChatInput selectedCommunityId={selectedCommunityId} />
      </div>
    );
  }

  if (!communities || communities.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Community Tabs - only show if multiple communities */}
        {showTabs && (
          <div className="flex gap-2 px-3 py-2 border-b overflow-x-auto shrink-0 bg-background/95 backdrop-blur-sm">
            {communities.map((community: any) => (
              <button
                key={community.id}
                onClick={() => setSelectedCommunityId(community.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0",
                  selectedCommunityId === community.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={community.avatar_url || ""} />
                  <AvatarFallback className="text-[10px]">
                    {community.name?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate">{community.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages area (scrollable) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-4"
        >
          {(!feedItems || feedItems.length === 0) ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</p>
            </div>
          ) : (
            feedItems.map((item) => {
              // System messages for worship sets, events, birthdays
              if (item.type === "worship_set") {
                return (
                  <SystemMessage
                    key={`${item.type}-${item.id}`}
                    type="worship_set"
                    data={item.set}
                    community={item.community}
                    createdAt={item.created_at}
                  />
                );
              }

              if (item.type === "calendar_event") {
                return (
                  <SystemMessage
                    key={`${item.type}-${item.id}`}
                    type="calendar_event"
                    data={item.event}
                    community={item.community}
                    createdAt={item.created_at}
                  />
                );
              }

              if (item.type === "birthday") {
                return (
                  <SystemMessage
                    key={`${item.type}-${item.id}`}
                    type="birthday"
                    data={item.profile}
                    community={item.community}
                    createdAt={item.created_at}
                  />
                );
              }

              // Chat bubbles for community posts
              return (
                <ChatBubble
                  key={`${item.type}-${item.id}`}
                  id={item.id}
                  author={item.author}
                  community={item.community}
                  content={item.content || ""}
                  images={item.images}
                  createdAt={item.created_at}
                  isOwn={item.author?.id === user?.id}
                  onProfileClick={openProfile}
                />
              );
            })
          )}
        </div>

        {/* Sticky bottom input */}
        <ChatInput selectedCommunityId={selectedCommunityId} />
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
