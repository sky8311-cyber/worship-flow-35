import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioView } from "./StudioView";
import { StudioBoardView } from "./StudioBoardView";
import { StudioArchiveView } from "./StudioArchiveView";
import { StudioDiscover } from "./StudioDiscover";
import { BlockTypeSelector } from "./BlockTypeSelector";
import { Button } from "@/components/ui/button";
import { PenSquare, Columns3, Archive, Compass, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/hooks/useCanvas";
import type { StudioPost, BlockType } from "@/hooks/useStudioPosts";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("worktable");
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  
  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudioId;
  const currentRoomId = selectedStudioId || myStudioId || undefined;

  const { createCanvas, isCreating } = useCanvas();

  const handleNewBlock = (blockType: BlockType) => {
    if (!myStudioId) return;
    createCanvas({ roomId: myStudioId, blockType });
  };

  const handlePostClick = (post: StudioPost) => {
    navigate(`/studio/canvas/${post.id}`);
  };
  
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#faf7f2] dark:bg-background relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border-b border-border/40 px-4 bg-[#faf7f2] dark:bg-background flex items-center justify-between">
          <TabsList className="h-11 bg-transparent gap-1">
            <TabsTrigger 
              value="worktable"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
            >
              <PenSquare className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">{language === "ko" ? "작업대" : "Worktable"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="board" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
            >
              <Columns3 className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">{language === "ko" ? "진행중의 벽" : "Board"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="archive"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
            >
              <Archive className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">{language === "ko" ? "보관함" : "Archive"}</span>
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger 
                value="discover"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
              >
                <Compass className="h-4 w-4" />
              </TabsTrigger>
            )}
          </TabsList>

          {/* New block button */}
          {isOwnStudio && myStudioId && (
            <Button
              size={isMobile ? "icon" : "sm"}
              variant="outline"
              onClick={() => setShowBlockSelector(true)}
              disabled={isCreating}
              className={cn(
                "border-[#b8902a] text-[#b8902a] hover:bg-[#b8902a] hover:text-white",
                isMobile ? "h-8 w-8 rounded-full" : "h-8 gap-1.5"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {!isMobile && (language === "ko" ? "새 블록" : "New Block")}
            </Button>
          )}
        </div>
        
        <TabsContent value="worktable" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
          <StudioView 
            roomId={currentRoomId}
            isOwnRoom={isOwnStudio}
          />
        </TabsContent>
        
        <TabsContent value="board" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
          <StudioBoardView 
            roomId={currentRoomId}
            onPostClick={handlePostClick}
          />
        </TabsContent>

        <TabsContent value="archive" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
          <StudioArchiveView 
            roomId={currentRoomId}
            onPostClick={handlePostClick}
          />
        </TabsContent>
        
        {isMobile && (
          <TabsContent value="discover" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
            <StudioDiscover onStudioSelect={onStudioSelect} />
          </TabsContent>
        )}
      </Tabs>

      {/* Block Type Selector Dialog */}
      <BlockTypeSelector
        open={showBlockSelector}
        onOpenChange={setShowBlockSelector}
        onSelect={handleNewBlock}
      />
    </div>
  );
}
