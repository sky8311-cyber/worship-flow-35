import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioFeed } from "./StudioFeed";
import { StudioView } from "./StudioView";
import { StudioDiscover } from "./StudioDiscover";
import { StudioPostEditor } from "./StudioPostEditor";
import { Newspaper, User, Compass, PenLine } from "lucide-react";

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
  
  const handleEditorSuccess = () => {
    setActiveTab("studio");
  };
  
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
            {isOwnStudio && myStudioId && (
              <TabsTrigger 
                value="newpost"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 text-sm"
              >
                <PenLine className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "새 글" : "New Post"}
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
        
        <TabsContent value="studio" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
          <StudioView 
            roomId={selectedStudioId || myStudioId || undefined} 
            isOwnRoom={isOwnStudio}
          />
        </TabsContent>
        
        <TabsContent value="feed" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
          <StudioFeed onStudioClick={onStudioSelect} />
        </TabsContent>
        
        {isOwnStudio && myStudioId && (
          <TabsContent value="newpost" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
            <StudioPostEditor 
              onBack={() => setActiveTab("studio")}
              onSuccess={handleEditorSuccess}
            />
          </TabsContent>
        )}
        
        {isMobile && (
          <TabsContent value="discover" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
            <StudioDiscover onStudioSelect={onStudioSelect} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
