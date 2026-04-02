import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  avatar_url?: string | null;
  memberCount?: number;
  userRole?: string;
  leader_id?: string;
  is_active?: boolean | null;
}

interface CommunitiesSidebarListProps {
  communities: Community[];
  maxVisible?: number;
  currentCommunityId?: string;
}

export function CommunitiesSidebarList({ communities, maxVisible = 5, currentCommunityId }: CommunitiesSidebarListProps) {
  const { t, language } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);

  if (!communities || communities.length === 0) {
    return null;
  }

  const visibleCommunities = expanded ? communities : communities.slice(0, maxVisible);
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
            const isInactive = community.is_active === false;
            
            const cardContent = (
              <>
                <Avatar className={`w-10 h-10 shrink-0 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                  <AvatarImage src={community.avatar_url || undefined} />
                  <AvatarFallback>{community.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isInactive ? 'text-muted-foreground' : ''}`}>
                    {community.name}
                    {isInactive && (
                      <span className="ml-2 text-xs text-destructive">(비활성)</span>
                    )}
                  </p>
                  {community.memberCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {community.memberCount} {t("community.members")}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            );
            
            return (
              <Link
                key={community.id}
                to={`/community/${community.id}`}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                  community.id === currentCommunityId
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-accent",
                  isInactive && "opacity-70"
                )}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                {language === "ko" ? "접기" : "Show less"}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                {t("common.seeAll")} ({communities.length})
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
