import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareText, Users, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackBoard } from "./FeedbackBoard";
import { CommunityNewsfeed } from "./CommunityNewsfeed";
import { WelcomeFeed } from "./WelcomeFeed";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardFeedTabsProps {
  isWorshipLeader: boolean;
  isAdmin: boolean;
  isCommunityLeader: boolean;
  hasCommunities: boolean;
  userName?: string;
  userStats?: {
    sets: number;
    communities: number;
    collaborations: number;
  };
}

export function DashboardFeedTabs({
  isWorshipLeader,
  isAdmin,
  isCommunityLeader,
  hasCommunities,
  userName,
  userStats,
}: DashboardFeedTabsProps) {
  const { language } = useTranslation();
  const { chatUnreadCount, markChatNotificationsAsRead } = useNotifications();
  const queryClient = useQueryClient();

  // Track last viewed feedback timestamp
  const [lastViewedFeedback, setLastViewedFeedback] = useState<string | null>(
    () => localStorage.getItem("lastViewedFeedback")
  );

  // Fetch NEW feedback count (posts since last viewed)
  const { data: newFeedbackCount = 0 } = useQuery({
    queryKey: ["new-feedback-count", lastViewedFeedback],
    queryFn: async () => {
      let query = supabase
        .from("feedback_posts")
        .select("*", { count: "exact", head: true });
      
      if (lastViewedFeedback) {
        query = query.gt("created_at", lastViewedFeedback);
      }
      
      const { count } = await query;
      return count || 0;
    },
  });

  // Determine which tabs to show
  const showFeedbackTab = isWorshipLeader || isAdmin || isCommunityLeader;
  const showCommunityTab = true; // Always show, but content depends on hasCommunities
  const showWelcomeTab = (!isWorshipLeader && !hasCommunities) || isAdmin; // Hide for worship leaders, show for new users without communities OR admins

  // Default tab: feedback for leaders, community for regular users with communities, welcome for new users
  const defaultTab = (() => {
    if (isWorshipLeader || isAdmin || isCommunityLeader) return "feedback";
    if (hasCommunities) return "community";
    return "welcome";
  })();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync activeTab when role data loads asynchronously
  useEffect(() => {
    const correctTab = (() => {
      if (isWorshipLeader || isAdmin || isCommunityLeader) return "feedback";
      if (hasCommunities) return "community";
      return "welcome";
    })();
    
    // Update tab if leader should see feedback but isn't on it
    if ((isWorshipLeader || isAdmin || isCommunityLeader) && activeTab !== "feedback") {
      setActiveTab("feedback");
    } else if (!showFeedbackTab && activeTab === "feedback") {
      // No feedback access but on feedback tab - redirect
      setActiveTab(hasCommunities ? "community" : "welcome");
    }
  }, [isWorshipLeader, isAdmin, isCommunityLeader, hasCommunities, showFeedbackTab]);

  // Mark feedback as viewed when tab is active on mount
  useEffect(() => {
    if (activeTab === "feedback" && showFeedbackTab) {
      const now = new Date().toISOString();
      localStorage.setItem("lastViewedFeedback", now);
      setLastViewedFeedback(now);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "feedback") {
      const now = new Date().toISOString();
      localStorage.setItem("lastViewedFeedback", now);
      setLastViewedFeedback(now);
      queryClient.invalidateQueries({ queryKey: ["new-feedback-count"] });
    }
    if (value === "community") {
      markChatNotificationsAsRead();
    }
  };

  // If only community tab (team member without welcome tab), don't show tab UI at all
  if (!showFeedbackTab && !showWelcomeTab) {
    return (
      <div className="h-full">
        <CommunityNewsfeed userStats={userStats} canPost={false} />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full justify-start px-4 py-2 h-auto bg-transparent rounded-none border-b shrink-0">
        {showWelcomeTab && (
          <TabsTrigger
            value="welcome"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "ko" ? "환영" : "Welcome"}
            </span>
            <span className="sm:hidden">
              {language === "ko" ? "환영" : "Welcome"}
            </span>
          </TabsTrigger>
        )}
        {showFeedbackTab && (
          <TabsTrigger
            value="feedback"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground"
          >
            <MessageSquareText className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "ko" ? "피드백 보드" : "Feedback Board"}
            </span>
            <span className="sm:hidden">
              {language === "ko" ? "피드백" : "Feedback"}
            </span>
            {newFeedbackCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium">
                {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
              </span>
            )}
          </TabsTrigger>
        )}
        {showCommunityTab && (
          <TabsTrigger
            value="community"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "ko" ? "내 예배공동체" : "My Community"}
            </span>
            <span className="sm:hidden">
              {language === "ko" ? "공동체" : "Community"}
            </span>
            {chatUnreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium">
                {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      {showWelcomeTab && (
        <TabsContent value="welcome" className="mt-0">
          <WelcomeFeed userName={userName} />
        </TabsContent>
      )}

      {showFeedbackTab && (
        <TabsContent value="feedback" className="mt-0">
          <FeedbackBoard />
        </TabsContent>
      )}

      {showCommunityTab && (
        <TabsContent value="community" className="mt-0">
          <CommunityNewsfeed 
            userStats={userStats} 
            canPost={isWorshipLeader || isAdmin || isCommunityLeader}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
