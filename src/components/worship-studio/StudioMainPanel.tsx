import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioFeed } from "./StudioFeed";
import { StudioView } from "./StudioView";
import { StudioDiscover } from "./StudioDiscover";
import { Newspaper, User, Compass } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("feed");
  
  // Auto-switch to studio tab when a studio is selected from sidebar
  useEffect(() => {
    if (selectedStudioId && selectedStudioId !== myStudioId) {
      setActiveTab("studio");
    }
  }, [selectedStudioId, myStudioId]);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-4">
          <TabsList className="h-12 bg-transparent gap-4">
            <TabsTrigger 
              value="feed" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
            >
              <Newspaper className="h-4 w-4 mr-2" />
              {language === "ko" ? "피드" : "Feed"}
            </TabsTrigger>
            <TabsTrigger 
              value="studio"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
            >
              <User className="h-4 w-4 mr-2" />
              {language === "ko" ? "내 스튜디오" : "My Studio"}
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger 
                value="discover"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
              >
                <Compass className="h-4 w-4 mr-2" />
                {language === "ko" ? "탐색" : "Discover"}
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="feed" className="flex-1 overflow-auto mt-0 p-0">
          <StudioFeed onStudioClick={onStudioSelect} />
        </TabsContent>
        
        <TabsContent value="studio" className="flex-1 overflow-auto mt-0 p-0">
          <StudioView 
            roomId={selectedStudioId || myStudioId || undefined} 
            isOwnRoom={!selectedStudioId || selectedStudioId === myStudioId}
          />
        </TabsContent>
        
        {isMobile && (
          <TabsContent value="discover" className="flex-1 overflow-auto mt-0 p-0">
            <StudioDiscover onStudioSelect={onStudioSelect} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
