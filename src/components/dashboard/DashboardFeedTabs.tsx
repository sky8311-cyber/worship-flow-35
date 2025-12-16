import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareText, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { FeedbackBoard } from "./FeedbackBoard";
import { CommunityNewsfeed } from "./CommunityNewsfeed";

interface DashboardFeedTabsProps {
  isWorshipLeader: boolean;
  isAdmin: boolean;
  isCommunityLeader: boolean;
  hasCommunities: boolean;
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
  userStats,
}: DashboardFeedTabsProps) {
  const { language } = useTranslation();

  // Determine which tabs to show
  const showFeedbackTab = isWorshipLeader || isAdmin || isCommunityLeader;
  const showCommunityTab = true; // Always show, but content depends on hasCommunities

  // If only community tab (team member), don't show tab UI at all
  if (!showFeedbackTab) {
    return (
      <div className="h-full">
        <CommunityNewsfeed userStats={userStats} canPost={false} />
      </div>
    );
  }

  // Default to feedback tab for leaders
  const defaultTab = "feedback";

  return (
    <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
      <TabsList className="w-full justify-start px-4 py-2 h-auto bg-muted/50 rounded-none border-b shrink-0">
        {showFeedbackTab && (
          <TabsTrigger
            value="feedback"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <MessageSquareText className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "ko" ? "피드백 보드" : "Feedback Board"}
            </span>
            <span className="sm:hidden">
              {language === "ko" ? "피드백" : "Feedback"}
            </span>
          </TabsTrigger>
        )}
        {showCommunityTab && (
          <TabsTrigger
            value="community"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "ko" ? "내 예배공동체" : "My Community"}
            </span>
            <span className="sm:hidden">
              {language === "ko" ? "공동체" : "Community"}
            </span>
          </TabsTrigger>
        )}
      </TabsList>

      {showFeedbackTab && (
        <TabsContent value="feedback" className="flex-1 overflow-hidden mt-0">
          <FeedbackBoard />
        </TabsContent>
      )}

      {showCommunityTab && (
        <TabsContent value="community" className="flex-1 overflow-hidden mt-0">
          <CommunityNewsfeed 
            userStats={userStats} 
            canPost={isWorshipLeader || isAdmin || isCommunityLeader}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
