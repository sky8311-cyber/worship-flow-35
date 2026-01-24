import { CommunityNewsfeed } from "./CommunityNewsfeed";

interface DashboardFeedTabsProps {
  isWorshipLeader: boolean;
  isAdmin: boolean;
  isCommunityLeader: boolean;
  hasCommunities: boolean | null;
  communitiesLoading?: boolean;
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
  userStats,
}: DashboardFeedTabsProps) {
  return (
    <div className="h-full">
      <CommunityNewsfeed 
        userStats={userStats} 
        canPost={isWorshipLeader || isAdmin || isCommunityLeader} 
      />
    </div>
  );
}
