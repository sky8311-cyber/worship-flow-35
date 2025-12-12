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
  
  const { data: communitiesData } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ["unified-community-feed", user?.id, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];

      // Calculate date range for birthdays this week
      const today = new Date();

      // First, fetch community member user IDs (needed for birthday query)
      const { data: communityMemberIds } = await supabase
        .from("community_members")
        .select("user_id")
        .in("community_id", communityIds);
      
      const memberUserIds = communityMemberIds?.map(m => m.user_id) || [];

      // Fetch all post types in parallel with simple selects
      const [postsData, setsData, eventsData, birthdayData] = await Promise.all([
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
        const birthDate = new Date(profile.birth_date);
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

      // Fallback objects
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

      // Batch fetch birthday memberships to avoid N+1
      const birthdayUserIds = birthdaysThisWeek.map(p => p.id);
      const { data: birthdayMemberships } = birthdayUserIds.length > 0
        ? await supabase
            .from("community_members")
            .select("user_id, community_id")
            .in("user_id", birthdayUserIds)
            .in("community_id", communityIds)
        : { data: [] };

      // Create a map for O(1) lookup
      const birthdayMembershipMap = new Map(
        (birthdayMemberships || []).map(m => [m.user_id, m.community_id])
      );

      // Build birthday items without N+1 queries
      const birthdayItems = birthdaysThisWeek.map((profile) => ({
        id: `birthday-${profile.id}`,
        type: "birthday" as const,
        profile: profile,
        community: communityMap.get(birthdayMembershipMap.get(profile.id) || "") || fallbackCommunity,
        created_at: profile.birth_date || new Date().toISOString(),
      }));

      // Build unified feed items
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
        ...birthdayItems,
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

  // Auto-scroll to bottom on new messages (reversed order, so actually scroll to top)
  useEffect(() => {
    if (scrollContainerRef.current && feedItems?.length) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [feedItems?.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <ChatInput />
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</p>
        </div>
        <ChatInput />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Messages area (scrollable) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-4"
        >
          {feedItems.map((item) => {
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
          })}
        </div>

        {/* Sticky bottom input */}
        <ChatInput />
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
