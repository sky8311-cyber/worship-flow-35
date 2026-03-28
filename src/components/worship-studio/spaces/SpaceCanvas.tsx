import { useState, useRef, useCallback, useEffect } from "react";
import { useSpaceBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { BlockAddMenu } from "./BlockAddMenu";
import { BlockPropertyPanel } from "./BlockPropertyPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

interface SpaceCanvasProps {
  spaceId: string;
  isOwner: boolean;
}

export function SpaceCanvas({ spaceId, isOwner }: SpaceCanvasProps) {
  const isMobile = useIsMobile();
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();

  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Pan state
  const panRef = useRef<{ active: boolean; startX: number; startY: number; startOx: number; startOy: number }>({
    active: false, startX: 0, startY: 0, startOx: 0, startOy: 0,
  });
  const spaceHeld = useRef(false);

  // Reset on space switch
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setZoom(1.0);
    setSelectedBlockId(null);
    setMenuPos(null);
  }, [spaceId]);

  // Space key for pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) spaceHeld.current = true; };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeld.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.min(2.0, Math.max(0.25, z + delta)));
  }, []);

  // Pan handlers on background
  const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || spaceHeld.current) {
      panRef.current = { active: true, startX: e.clientX, startY: e.clientY, startOx: offset.x, startOy: offset.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // Left click on empty area
    if (e.button === 0) {
      setSelectedBlockId(null);
      setMenuPos(null);
    }
  }, [offset]);

  const handleBgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current.active) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setOffset({ x: panRef.current.startOx + dx / zoom, y: panRef.current.startOy + dy / zoom });
  }, [zoom]);

  const handleBgPointerUp = useCallback(() => {
    panRef.current.active = false;
  }, []);

  // Right-click / double-click to add
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / zoom - offset.x;
    const cy = (e.clientY - rect.top) / zoom - offset.y;
    setMenuPos({ x: cx, y: cy });
  }, [isOwner, zoom, offset]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isOwner) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / zoom - offset.x;
    const cy = (e.clientY - rect.top) / zoom - offset.y;
    setMenuPos({ x: cx, y: cy });
  }, [isOwner, zoom, offset]);

  const handleAddBlock = useCallback((blockType: string, posX: number, posY: number) => {
    createBlock.mutate({
      space_id: spaceId,
      block_type: blockType,
      pos_x: Math.round(posX),
      pos_y: Math.round(posY),
      size_w: 200,
      size_h: 150,
    });
    setMenuPos(null);
  }, [spaceId, createBlock]);

  const handleUpdateBlock = useCallback((id: string, updates: Partial<SpaceBlockType>) => {
    updateBlock.mutate({ id, spaceId, ...updates });
  }, [spaceId, updateBlock]);

  const handleDeleteBlock = useCallback((id: string) => {
    deleteBlock.mutate({ id, spaceId });
    setSelectedBlockId(null);
  }, [spaceId, deleteBlock]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: "#faf7f2",
          backgroundImage: "radial-gradient(circle, #c8bfb0 1px, transparent 1px)",
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${offset.x * zoom}px ${offset.y * zoom}px`,
        }}
        onPointerDown={handleBgPointerDown}
        onPointerMove={handleBgPointerMove}
        onPointerUp={handleBgPointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      >
        {/* Transform layer */}
        <div
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
            width: "1px",
            height: "1px",
            overflow: "visible",
          }}
        >
          {blocks.map(block => (
            <SpaceBlock
              key={block.id}
              block={block}
              isOwner={isOwner}
              isSelected={block.id === selectedBlockId}
              zoom={zoom}
              onSelect={() => { setSelectedBlockId(block.id); setMenuPos(null); }}
              onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
            />
          ))}
        </div>

        {/* Add menu */}
        {menuPos && (
          <BlockAddMenu
            position={{ x: menuPos.x * zoom + offset.x * zoom, y: menuPos.y * zoom + offset.y * zoom }}
            onAdd={(type) => handleAddBlock(type, menuPos.x, menuPos.y)}
            onClose={() => setMenuPos(null)}
          />
        )}
      </div>

      {/* Property panel */}
      {selectedBlock && (
        <BlockPropertyPanel
          block={selectedBlock}
          isMobile={isMobile}
          onUpdate={(content) => handleUpdateBlock(selectedBlock.id, { content })}
          onDelete={() => handleDeleteBlock(selectedBlock.id)}
          onClose={() => setSelectedBlockId(null)}
        />
      )}
    </div>
  );
}
