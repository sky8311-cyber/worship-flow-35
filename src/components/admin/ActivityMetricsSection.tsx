import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  FileText, 
  Music, 
  MessageSquare, 
  Building2, 
  Activity,
  Heart,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { PeriodSelector, Period, getPeriodRange } from "./PeriodSelector";
import { StatCardWithChange } from "./StatCardWithChange";

export function ActivityMetricsSection() {
  const { language } = useTranslation();
  const [period, setPeriod] = useState<Period>("7days");

  const { data: metrics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-activity-metrics", period],
    queryFn: async () => {
      const { current, previous } = getPeriodRange(period);
      
      const currentStart = current.start.toISOString();
      const currentEnd = current.end.toISOString();
      const previousStart = previous.start.toISOString();
      const previousEnd = previous.end.toISOString();

      // Execute all queries in parallel
      const [
        currentUsers, previousUsers,
        currentSets, previousSets,
        currentSongs, previousSongs,
        currentPosts, previousPosts,
        currentCommunities, previousCommunities,
        currentActiveUsers, previousActiveUsers,
        currentLikes, previousLikes,
        currentComments, previousComments,
      ] = await Promise.all([
        // New users
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Worship sets
        supabase.from("service_sets")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("service_sets")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Songs
        supabase.from("songs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("songs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Community posts
        supabase.from("community_posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("community_posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Communities
        supabase.from("worship_communities")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("worship_communities")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Active users (from profiles.last_active_at)
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("last_active_at", currentStart)
          .lt("last_active_at", currentEnd),
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("last_active_at", previousStart)
          .lt("last_active_at", previousEnd),
        
        // Likes
        supabase.from("post_likes")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("post_likes")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
        
        // Comments
        supabase.from("post_comments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentStart)
          .lt("created_at", currentEnd),
        supabase.from("post_comments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", previousEnd),
      ]);

      // Get active users count directly from profiles
      const currentUniqueUsers = currentActiveUsers.count || 0;
      const previousUniqueUsers = previousActiveUsers.count || 0;

      return {
        newUsers: { 
          current: currentUsers.count || 0, 
          previous: previousUsers.count || 0 
        },
        newSets: { 
          current: currentSets.count || 0, 
          previous: previousSets.count || 0 
        },
        newSongs: { 
          current: currentSongs.count || 0, 
          previous: previousSongs.count || 0 
        },
        newPosts: { 
          current: currentPosts.count || 0, 
          previous: previousPosts.count || 0 
        },
        newCommunities: { 
          current: currentCommunities.count || 0, 
          previous: previousCommunities.count || 0 
        },
        activeUsers: { 
          current: currentUniqueUsers, 
          previous: previousUniqueUsers 
        },
        likes: { 
          current: currentLikes.count || 0, 
          previous: previousLikes.count || 0 
        },
        comments: { 
          current: currentComments.count || 0, 
          previous: previousComments.count || 0 
        },
      };
    },
    staleTime: period === "today" || period === "7days" ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min for short periods, 1 hour for long
  });

  const { compareLabel } = getPeriodRange(period);

  const statCards = [
    {
      title: language === "ko" ? "신규 가입" : "New Users",
      current: metrics?.newUsers.current || 0,
      previous: metrics?.newUsers.previous || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: language === "ko" ? "워십세트" : "Worship Sets",
      current: metrics?.newSets.current || 0,
      previous: metrics?.newSets.previous || 0,
      icon: FileText,
      color: "text-purple-500",
    },
    {
      title: language === "ko" ? "신규 곡" : "New Songs",
      current: metrics?.newSongs.current || 0,
      previous: metrics?.newSongs.previous || 0,
      icon: Music,
      color: "text-pink-500",
    },
    {
      title: language === "ko" ? "포스트" : "Posts",
      current: metrics?.newPosts.current || 0,
      previous: metrics?.newPosts.previous || 0,
      icon: MessageSquare,
      color: "text-cyan-500",
    },
    {
      title: language === "ko" ? "커뮤니티" : "Communities",
      current: metrics?.newCommunities.current || 0,
      previous: metrics?.newCommunities.previous || 0,
      icon: Building2,
      color: "text-orange-500",
    },
    {
      title: language === "ko" ? "활성 사용자" : "Active Users",
      current: metrics?.activeUsers.current || 0,
      previous: metrics?.activeUsers.previous || 0,
      icon: Activity,
      color: "text-emerald-500",
    },
    {
      title: language === "ko" ? "좋아요" : "Likes",
      current: metrics?.likes.current || 0,
      previous: metrics?.likes.previous || 0,
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: language === "ko" ? "댓글" : "Comments",
      current: metrics?.comments.current || 0,
      previous: metrics?.comments.previous || 0,
      icon: MessageCircle,
      color: "text-indigo-500",
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {language === "ko" ? "📊 활동 지표" : "📊 Activity Metrics"}
        </h2>
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCardWithChange
            key={card.title}
            title={card.title}
            currentValue={card.current}
            previousValue={card.previous}
            icon={card.icon}
            color={card.color}
            compareLabel={language === "ko" ? compareLabel : compareLabel.replace("대비", "vs")}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
