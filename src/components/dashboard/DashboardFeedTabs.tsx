import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CommunityNewsfeed } from "./CommunityNewsfeed";
import { WelcomeFeed } from "./WelcomeFeed";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardFeedTabsProps {
  isWorshipLeader: boolean;
  isAdmin: boolean;
  isCommunityLeader: boolean;
  hasCommunities: boolean | null; // null = still loading
  communitiesLoading?: boolean;
  userName?: string;
  userStats?: {
    sets: number;
    communities: number;
    songs: number;
  };
}

export function DashboardFeedTabs({
  isWorshipLeader,
  isAdmin,
  isCommunityLeader,
  hasCommunities,
  communitiesLoading,
  userName,
  userStats,
}: DashboardFeedTabsProps) {
  const { language } = useTranslation();
  const { chatUnreadCount, markChatNotificationsAsRead } = useNotifications();

  // Parent (Dashboard) now guarantees hasCommunities is never null on mount
  // because isDashboardReady gate waits for community data
  const showWelcomeTab = (!isWorshipLeader && hasCommunities === false) || isAdmin;

  // Default tab is now stable - no switching needed since data is ready
  const defaultTab = hasCommunities ? "community" : "welcome";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // No useEffect for tab switching needed - parent guarantees data is loaded

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "community") {
      markChatNotificationsAsRead();
    }
  };

  // If only community tab (no welcome tab needed), don't show tab UI at all
  if (!showWelcomeTab) {
    return (
      <div className="h-full">
        <CommunityNewsfeed userStats={userStats} canPost={isWorshipLeader || isAdmin || isCommunityLeader} />
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
      </TabsList>

      {showWelcomeTab && (
        <TabsContent value="welcome" className="mt-0">
          <WelcomeFeed userName={userName} />
        </TabsContent>
      )}

      <TabsContent value="community" className="mt-0">
        <CommunityNewsfeed 
          userStats={userStats} 
          canPost={isWorshipLeader || isAdmin || isCommunityLeader}
        />
      </TabsContent>
    </Tabs>
  );
}
