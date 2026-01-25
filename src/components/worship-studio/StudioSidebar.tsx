import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFriendStudios } from "@/hooks/useFriendStudios";
import { usePublicRooms, useAmbassadorRooms } from "@/hooks/useWorshipRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Crown, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface StudioSidebarProps {
  onStudioSelect: (roomId: string) => void;
  selectedStudioId?: string | null;
}

interface StudioListItemProps {
  room: any;
  isSelected?: boolean;
  onClick: () => void;
  language: string;
}

function StudioListItem({ room, isSelected, onClick, language }: StudioListItemProps) {
  const isAmbassador = room.owner?.is_ambassador;
  
  const timeAgo = room.latestPostAt 
    ? formatDistanceToNow(new Date(room.latestPostAt), {
        addSuffix: false,
        locale: language === "ko" ? ko : enUS,
      })
    : null;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        isSelected 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={room.owner?.avatar_url || undefined} />
          <AvatarFallback>
            {room.owner?.full_name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        {room.hasNewPosts && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate text-sm">
            {room.owner?.full_name || "Unknown"}
          </span>
          {isAmbassador && (
            <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          )}
        </div>
        {timeAgo && (
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
        )}
      </div>
    </button>
  );
}

export function StudioSidebar({ 
  onStudioSelect, 
  selectedStudioId,
}: StudioSidebarProps) {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: friendStudios, isLoading: friendsLoading } = useFriendStudios();
  const { data: ambassadorRooms, isLoading: ambassadorsLoading } = useAmbassadorRooms();
  const { data: publicRooms, isLoading: publicLoading } = usePublicRooms(searchQuery);
  
  const ambassadorIds = new Set(ambassadorRooms?.map(r => r.owner_user_id) || []);
  const friendIds = new Set(friendStudios?.map(r => r.owner_user_id) || []);
  const filteredPublicRooms = publicRooms?.filter(r => 
    !ambassadorIds.has(r.owner_user_id) && !friendIds.has(r.owner_user_id)
  ) || [];
  
  const searchedPublicRooms = searchQuery
    ? filteredPublicRooms.filter(r => 
        r.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPublicRooms;
  
  return (
    <div className="h-full flex flex-col w-72 border-r border-border bg-muted/30">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "ko" ? "스튜디오 검색..." : "Search studios..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              {language === "ko" ? "내 친구" : "My Network"}
            </h3>
            {friendsLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : friendStudios?.length ? (
              <div className="space-y-1">
                {friendStudios.map((room) => (
                  <StudioListItem key={room.id} room={room} isSelected={selectedStudioId === room.id} onClick={() => onStudioSelect(room.id)} language={language} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 px-1">{language === "ko" ? "아직 친구가 없습니다" : "No friends yet"}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              {language === "ko" ? "앰버서더" : "Ambassadors"}
            </h3>
            {ambassadorsLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : ambassadorRooms?.length ? (
              <div className="space-y-1">
                {ambassadorRooms.map((room) => (
                  <StudioListItem key={room.id} room={room} isSelected={selectedStudioId === room.id} onClick={() => onStudioSelect(room.id)} language={language} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 px-1">{language === "ko" ? "앰버서더가 없습니다" : "No ambassadors yet"}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              {language === "ko" ? "탐색" : "Discover"}
            </h3>
            {publicLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : searchedPublicRooms?.length ? (
              <div className="space-y-1">
                {searchedPublicRooms.slice(0, 10).map((room) => (
                  <StudioListItem key={room.id} room={room} isSelected={selectedStudioId === room.id} onClick={() => onStudioSelect(room.id)} language={language} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 px-1">{searchQuery ? (language === "ko" ? "검색 결과 없음" : "No results") : (language === "ko" ? "공개 스튜디오가 없습니다" : "No public studios")}</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
