import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePublicRooms, useAmbassadorRooms, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomSidebarProps {
  onRoomSelect: (roomId: string) => void;
  selectedRoomId?: string | null;
  showAmbassadors?: boolean;
  showPublicRooms?: boolean;
}

interface RoomListItemProps {
  room: WorshipRoom;
  isSelected?: boolean;
  onClick: () => void;
}

function RoomListItem({ room, isSelected, onClick }: RoomListItemProps) {
  const isAmbassador = room.owner?.is_ambassador;
  
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
      <Avatar className="h-10 w-10">
        <AvatarImage src={room.owner?.avatar_url || undefined} />
        <AvatarFallback>
          {room.owner?.full_name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {room.owner?.full_name || "Unknown"}
          </span>
          {isAmbassador && (
            <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
        {room.bgm_song && (
          <span className="text-xs text-muted-foreground truncate block">
            🎵 {room.bgm_song.title}
          </span>
        )}
      </div>
    </button>
  );
}

export function RoomSidebar({ 
  onRoomSelect, 
  selectedRoomId,
  showAmbassadors = true,
  showPublicRooms = true,
}: RoomSidebarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: ambassadorRooms, isLoading: ambassadorsLoading } = useAmbassadorRooms();
  const { data: publicRooms, isLoading: publicLoading } = usePublicRooms(searchQuery);
  
  // Filter out ambassador rooms from public rooms to avoid duplicates
  const ambassadorIds = new Set(ambassadorRooms?.map(r => r.owner_user_id) || []);
  const filteredPublicRooms = publicRooms?.filter(r => !ambassadorIds.has(r.owner_user_id)) || [];
  
  // Apply search filter to public rooms
  const searchedPublicRooms = searchQuery
    ? filteredPublicRooms.filter(r => 
        r.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPublicRooms;
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">{t("rooms.title")}</h2>
        {showPublicRooms && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("rooms.searchRooms")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Ambassadors Section */}
          {showAmbassadors && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                {t("rooms.brandAmbassadors")}
              </h3>
              {ambassadorsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ambassadorRooms?.length ? (
                <div className="space-y-1">
                  {ambassadorRooms.map((room) => (
                    <RoomListItem
                      key={room.id}
                      room={room}
                      isSelected={selectedRoomId === room.id}
                      onClick={() => onRoomSelect(room.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {t("rooms.noAmbassadors")}
                </p>
              )}
            </div>
          )}
          
          {/* Public Rooms Section */}
          {showPublicRooms && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {t("rooms.publicRooms")}
              </h3>
              {publicLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : searchedPublicRooms?.length ? (
                <div className="space-y-1">
                  {searchedPublicRooms.map((room) => (
                    <RoomListItem
                      key={room.id}
                      room={room}
                      isSelected={selectedRoomId === room.id}
                      onClick={() => onRoomSelect(room.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {searchQuery ? t("common.noResults") : t("rooms.noPublicRooms")}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
