import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanvas } from "@/hooks/useCanvas";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { CanvasHeader } from "@/components/worship-studio/canvas/CanvasHeader";
import { CanvasBlockList } from "@/components/worship-studio/canvas/CanvasBlockList";
import { CanvasRightPanel } from "@/components/worship-studio/canvas/CanvasRightPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Plus } from "lucide-react";
import type { CanvasBlock } from "@/hooks/useCanvas";

export default function CanvasEditor() {
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const {
    canvas,
    blocks,
    isLoading,
    updateTitle,
    updateStage,
    addBlock,
    updateBlock,
    removeBlock,
    reorderBlocks,
    publishCanvas,
  } = useCanvas(canvasId);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#faf7f2] dark:bg-background z-50 flex flex-col">
        <Skeleton className="h-14 w-full" />
        <div className="flex-1 flex p-4 gap-4">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="w-[280px] h-full rounded-xl hidden md:block" />
        </div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="fixed inset-0 bg-[#faf7f2] dark:bg-background z-50 flex items-center justify-center">
        <p className="text-muted-foreground">
          {language === "ko" ? "캔버스를 찾을 수 없습니다" : "Canvas not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#faf7f2] dark:bg-background z-50 flex flex-col overflow-hidden">
      {/* Paper grain */}
      <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.025] z-0" />
      
      <CanvasHeader
        title={canvas.title}
        stage={canvas.workflow_stage}
        onTitleChange={(t) => updateTitle(t)}
        onStageChange={(s) => updateStage(s)}
        onPublish={() => publishCanvas()}
        onBack={() => navigate("/atelier")}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative z-10">
        {/* Block list */}
        <div className="flex-1 overflow-y-auto">
          <CanvasBlockList
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onReorder={reorderBlocks}
            onUpdateBlock={(id, content) => updateBlock({ blockId: id, content })}
            onRemoveBlock={(id) => removeBlock(id)}
          />
        </div>

        {/* Right panel — desktop only */}
        {!isMobile && (
          <CanvasRightPanel
            selectedBlock={selectedBlock}
            onAddBlock={addBlock}
            onUpdateBlock={(id, content, blockType) => updateBlock({ blockId: id, content, blockType })}
          />
        )}
      </div>

      {/* Mobile FAB + Bottom Sheet */}
      {isMobile && (
        <Drawer>
          <DrawerTrigger asChild>
            <button className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#b8902a] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="h-6 w-6" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <div className="overflow-y-auto">
              <CanvasRightPanel
                selectedBlock={selectedBlock}
                onAddBlock={addBlock}
                onUpdateBlock={(id, content, blockType) => updateBlock({ blockId: id, content, blockType })}
                isMobile
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
