import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioView } from "./StudioView";
import { StudioBoardView } from "./StudioBoardView";
import { StudioArchiveView } from "./StudioArchiveView";
import { StudioDiscover } from "./StudioDiscover";
import { StudioPostEditor } from "./StudioPostEditor";
import { BlockTypeSelector } from "./BlockTypeSelector";
import { PostDetailDialog } from "./PostDetailDialog";
import { Button } from "@/components/ui/button";
import { PenSquare, Columns3, Archive, Compass, Plus } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>("worktable");
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [editorBlockType, setEditorBlockType] = useState<BlockType | null>(null);
  const [selectedPost, setSelectedPost] = useState<StudioPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudioId;
  const currentRoomId = selectedStudioId || myStudioId || undefined;
  
  const handleNewBlock = (blockType: BlockType) => {
    setEditorBlockType(blockType);
    setActiveTab("editor");
  };

  const handleEditorSuccess = () => {
    setEditorBlockType(null);
    setActiveTab("worktable");
  };

  const handlePostClick = (post: StudioPost) => {
    setSelectedPost(post);
    setDetailOpen(true);
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
              <PenSquare className="h-4 w-4 mr-1.5" />
              {language === "ko" ? "작업대" : "Worktable"}
            </TabsTrigger>
            <TabsTrigger 
              value="board" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
            >
              <Columns3 className="h-4 w-4 mr-1.5" />
              {language === "ko" ? "진행중의 벽" : "Board"}
            </TabsTrigger>
            <TabsTrigger 
              value="archive"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
            >
              <Archive className="h-4 w-4 mr-1.5" />
              {language === "ko" ? "보관함" : "Archive"}
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger 
                value="discover"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#b8902a] rounded-none px-3 text-sm"
              >
                <Compass className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "탐색" : "Discover"}
              </TabsTrigger>
            )}
          </TabsList>

          {/* New block button */}
          {isOwnStudio && myStudioId && activeTab !== "editor" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBlockSelector(true)}
              className="border-[#b8902a] text-[#b8902a] hover:bg-[#b8902a] hover:text-white h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {language === "ko" ? "새 블록" : "New Block"}
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

        {isOwnStudio && myStudioId && (
          <TabsContent value="editor" className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden">
            <StudioPostEditor 
              onBack={() => {
                setEditorBlockType(null);
                setActiveTab("worktable");
              }}
              onSuccess={handleEditorSuccess}
              initialBlockType={editorBlockType || undefined}
            />
          </TabsContent>
        )}
        
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

      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
