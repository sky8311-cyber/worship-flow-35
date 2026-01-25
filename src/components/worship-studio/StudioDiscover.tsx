import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePublicRooms, useAmbassadorRooms, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Crown, Music, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioDiscoverProps {
  onStudioSelect?: (roomId: string) => void;
}

interface StudioCardProps {
  room: WorshipRoom;
  onClick: () => void;
}

function StudioCard({ room, onClick }: StudioCardProps) {
  const isAmbassador = room.owner?.is_ambassador;
  
  return (
    <Card 
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
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
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Ambassador
                </Badge>
              )}
            </div>
            {room.bgm_song && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Music className="h-3 w-3" />
                <span className="truncate">{room.bgm_song.title}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudioDiscover({ onStudioSelect }: StudioDiscoverProps) {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: ambassadorRooms, isLoading: ambassadorsLoading } = useAmbassadorRooms();
  const { data: publicRooms, isLoading: publicLoading } = usePublicRooms(searchQuery);
  
  // Filter out ambassadors from public rooms
  const ambassadorIds = new Set(ambassadorRooms?.map(r => r.owner_user_id) || []);
  const filteredPublicRooms = publicRooms?.filter(r => !ambassadorIds.has(r.owner_user_id)) || [];
  
  const searchedPublicRooms = searchQuery
    ? filteredPublicRooms.filter(r => 
        r.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPublicRooms;
  
  const isLoading = ambassadorsLoading || publicLoading;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-1">
          {language === "ko" ? "스튜디오 탐색" : "Discover Studios"}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {language === "ko" 
            ? "스튜디오를 탐색하세요—배우고, 격려받고, 함께 성장하세요."
            : "Explore Studios—learn, be encouraged, and build together."}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "ko" ? "스튜디오 검색..." : "Search studios..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Ambassadors */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm">
                {language === "ko" ? "앰버서더" : "Ambassadors"}
              </h3>
            </div>
            {ambassadorsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : ambassadorRooms?.length ? (
              <div className="space-y-3">
                {ambassadorRooms.map(room => (
                  <StudioCard 
                    key={room.id}
                    room={room}
                    onClick={() => onStudioSelect?.(room.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {language === "ko" ? "앰버서더가 없습니다" : "No ambassadors yet"}
              </p>
            )}
          </section>
          
          {/* Public Studios */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                {language === "ko" ? "공개 스튜디오" : "Public Studios"}
              </h3>
            </div>
            {publicLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : searchedPublicRooms?.length ? (
              <div className="space-y-3">
                {searchedPublicRooms.slice(0, 20).map(room => (
                  <StudioCard 
                    key={room.id}
                    room={room}
                    onClick={() => onStudioSelect?.(room.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {searchQuery 
                  ? (language === "ko" ? "검색 결과 없음" : "No results")
                  : (language === "ko" ? "공개 스튜디오가 없습니다" : "No public studios yet")}
              </p>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
