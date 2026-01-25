import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioFeed } from "./StudioFeed";
import { StudioView } from "./StudioView";
import { StudioDiscover } from "./StudioDiscover";
import { StudioDraftsTab } from "./StudioDraftsTab";
import { Newspaper, User, Compass, FileEdit } from "lucide-react";

interface StudioMainPanelProps {
  myStudioId?: string | null;
  selectedStudioId?: string | null;
  onStudioSelect?: (roomId: string) => void;
}

export function StudioMainPanel({ 
  myStudioId, 
  selectedStudioId,
  onStudioSelect,
}: StudioMainPanelProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("studio");
  
  // Determine if viewing own studio
  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudioId;
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-4">
          <TabsList className="h-11 bg-transparent gap-1">
            <TabsTrigger 
              value="studio"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 text-sm"
            >
              <User className="h-4 w-4 mr-1.5" />
              {language === "ko" ? "스튜디오" : "Studio"}
            </TabsTrigger>
            <TabsTrigger 
              value="feed" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 text-sm"
            >
              <Newspaper className="h-4 w-4 mr-1.5" />
              {language === "ko" ? "피드" : "Feed"}
            </TabsTrigger>
            {isOwnStudio && (
              <TabsTrigger 
                value="drafts"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 text-sm"
              >
                <FileEdit className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "초안함" : "Drafts"}
              </TabsTrigger>
            )}
            {isMobile && (
              <TabsTrigger 
                value="discover"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 text-sm"
              >
                <Compass className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "탐색" : "Discover"}
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="studio" className="flex-1 h-0 overflow-hidden mt-0 p-0">
          <StudioView 
            roomId={selectedStudioId || myStudioId || undefined} 
            isOwnRoom={isOwnStudio}
          />
        </TabsContent>
        
        <TabsContent value="feed" className="flex-1 h-0 overflow-hidden mt-0 p-0">
          <StudioFeed onStudioClick={onStudioSelect} />
        </TabsContent>
        
        {isOwnStudio && myStudioId && (
          <TabsContent value="drafts" className="flex-1 h-0 overflow-hidden mt-0 p-0">
            <StudioDraftsTab roomId={myStudioId} />
          </TabsContent>
        )}
        
        {isMobile && (
          <TabsContent value="discover" className="flex-1 h-0 overflow-hidden mt-0 p-0">
            <StudioDiscover onStudioSelect={onStudioSelect} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
