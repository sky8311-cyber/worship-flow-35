import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendStudios } from "@/hooks/useFriendStudios";
import { usePublicRooms, useAmbassadorRooms } from "@/hooks/useWorshipRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Crown, 
  ChevronsRight, 
  ChevronsLeft,
  Home,
  Users,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface CollapsibleSidebarProps {
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onStudioSelect: (roomId: string) => void;
  onMyStudioSelect: () => void;
  selectedStudioId?: string | null;
  myStudioId?: string | null;
}

interface AvatarItemProps {
  room: any;
  isSelected?: boolean;
  onClick: () => void;
  language: string;
  isExpanded: boolean;
}

function AvatarItem({ room, isSelected, onClick, language, isExpanded }: AvatarItemProps) {
  const isAmbassador = room.owner?.is_ambassador;
  const name = room.owner?.full_name || "Unknown";
  
  const timeAgo = room.latestPostAt 
    ? formatDistanceToNow(new Date(room.latestPostAt), {
        addSuffix: false,
        locale: language === "ko" ? ko : enUS,
      })
    : null;
  
  const content = isExpanded ? (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
        isSelected 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={room.owner?.avatar_url || undefined} />
          <AvatarFallback className="text-sm">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        {room.hasNewPosts && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate text-sm">{name}</span>
          {isAmbassador && <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />}
        </div>
        {timeAgo && (
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        )}
      </div>
    </button>
  ) : (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative p-1 rounded-lg transition-colors",
              isSelected ? "bg-primary/10" : "hover:bg-muted/50"
            )}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={room.owner?.avatar_url || undefined} />
              <AvatarFallback className="text-sm">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            {room.hasNewPosts && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            )}
            {isAmbassador && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <Crown className="h-3 w-3 text-amber-500" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  
  return content;
}

export function CollapsibleSidebar({ 
  isExpanded,
  onExpandedChange,
  onStudioSelect, 
  onMyStudioSelect,
  selectedStudioId,
  myStudioId,
}: CollapsibleSidebarProps) {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: friendStudios, isLoading: friendsLoading } = useFriendStudios();
  const { data: ambassadorRooms, isLoading: ambassadorsLoading } = useAmbassadorRooms();
  const { data: publicRooms, isLoading: publicLoading } = usePublicRooms(searchQuery);
  
  const ambassadorIds = new Set(ambassadorRooms?.map(r => r.owner_user_id) || []);
  const friendIds = new Set(friendStudios?.map(r => r.owner_user_id) || []);
  const filteredPublicRooms = publicRooms?.filter(r => 
    !ambassadorIds.has(r.owner_user_id) && !friendIds.has(r.owner_user_id)
  ) || [];
  
  const isMyStudioSelected = !selectedStudioId || selectedStudioId === myStudioId;
  
  return (
    <div 
      className={cn(
        "h-full flex flex-col border-r border-border bg-muted/30 transition-all duration-300",
        isExpanded ? "w-64" : "w-14"
      )}
    >
      {/* My Atelier Button */}
      <div className={cn("p-2", isExpanded && "px-3")}>
        {isExpanded ? (
          <button
            onClick={onMyStudioSelect}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
              isMyStudioSelected 
                ? "bg-primary/10 border border-primary/20" 
                : "hover:bg-muted/50"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm">
              {language === "ko" ? "내 아틀리에" : "My Atelier"}
            </span>
          </button>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMyStudioSelect}
                  className={cn(
                    "w-full p-1 rounded-lg transition-colors flex items-center justify-center",
                    isMyStudioSelected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Home className="h-4 w-4 text-primary" />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {language === "ko" ? "내 아틀리에" : "My Atelier"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Separator className="mx-2" />
      
      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className={cn("p-2 space-y-4", isExpanded && "px-3")}>
          {/* Friends Section */}
          {isExpanded && (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <Users className="h-3 w-3" />
              {language === "ko" ? "친구" : "Friends"}
            </div>
          )}
          
          {friendsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <Skeleton key={i} className={isExpanded ? "h-12 w-full" : "h-9 w-9"} />
              ))}
            </div>
          ) : friendStudios?.length ? (
            <div className={cn("space-y-1", !isExpanded && "flex flex-col items-center")}>
              {friendStudios.slice(0, isExpanded ? 10 : 5).map(room => (
                <AvatarItem
                  key={room.id}
                  room={room}
                  isSelected={selectedStudioId === room.id}
                  onClick={() => onStudioSelect(room.id)}
                  language={language}
                  isExpanded={isExpanded}
                />
              ))}
            </div>
          ) : null}
          
          {!isExpanded && friendStudios?.length ? <Separator className="my-2" /> : null}
          
          {/* Ambassadors Section */}
          {isExpanded && ambassadorRooms?.length ? (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                <Crown className="h-3 w-3 text-amber-500" />
                {language === "ko" ? "앰버서더" : "Ambassadors"}
              </div>
            </>
          ) : null}
          
          {ambassadorsLoading ? null : ambassadorRooms?.length ? (
            <div className={cn("space-y-1", !isExpanded && "flex flex-col items-center")}>
              {ambassadorRooms.slice(0, isExpanded ? 5 : 3).map(room => (
                <AvatarItem
                  key={room.id}
                  room={room}
                  isSelected={selectedStudioId === room.id}
                  onClick={() => onStudioSelect(room.id)}
                  language={language}
                  isExpanded={isExpanded}
                />
              ))}
            </div>
          ) : null}
          
          {/* Discover Section (only in expanded mode) */}
          {isExpanded && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                <Globe className="h-3 w-3" />
                {language === "ko" ? "탐색" : "Discover"}
              </div>
              
              {filteredPublicRooms.slice(0, 5).map(room => (
                <AvatarItem
                  key={room.id}
                  room={room}
                  isSelected={selectedStudioId === room.id}
                  onClick={() => onStudioSelect(room.id)}
                  language={language}
                  isExpanded={isExpanded}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* Search / Expand Toggle */}
      <div className={cn("p-2 border-t border-border", isExpanded && "px-3")}>
        {isExpanded ? (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "ko" ? "검색..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExpandedChange(false)}
              className="w-full justify-center gap-2"
            >
              <ChevronsLeft className="h-4 w-4" />
              {language === "ko" ? "접기" : "Collapse"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onExpandedChange(true);
                      setShowSearch(true);
                    }}
                    className="h-9 w-9"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {language === "ko" ? "검색" : "Search"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onExpandedChange(true)}
                    className="h-9 w-9"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {language === "ko" ? "펼치기" : "Expand"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}
