import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, ChevronRight, Settings } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Community {
  id: string;
  name: string;
  avatar_url?: string | null;
  memberCount?: number;
  userRole?: string;
}

interface CommunitiesSidebarListProps {
  communities: Community[];
  maxVisible?: number;
}

export function CommunitiesSidebarList({ communities, maxVisible = 5 }: CommunitiesSidebarListProps) {
  const { t } = useTranslation();

  if (!communities || communities.length === 0) {
    return null;
  }

  const visibleCommunities = communities.slice(0, maxVisible);
  const hasMore = communities.length > maxVisible;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t("community.joined")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleCommunities.map((community) => {
            const isLeader = community.userRole === 'community_leader';
            
            return (
              <div
                key={community.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={community.avatar_url || undefined} />
                  <AvatarFallback>{community.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{community.name}</p>
                  {community.memberCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {community.memberCount} {t("community.members")}
                    </p>
                  )}
                </div>
                {isLeader && (
                  <Link
                    to={`/community/${community.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>

        {hasMore && (
          <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
            <Link to="/communities">
              {t("common.seeAll")} ({communities.length})
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
