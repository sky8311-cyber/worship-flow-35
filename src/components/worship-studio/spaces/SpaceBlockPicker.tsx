import { useTranslation } from "@/hooks/useTranslation";
import { useCreateBlock, useDeleteBlock } from "@/hooks/useSpaceBlocks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Type, StickyNote, ListOrdered, CheckSquare, Image, Youtube, Music, Calendar, Link, FileText, Contact } from "lucide-react";
import type { SpaceBlock } from "@/hooks/useSpaceBlocks";

const BLOCK_TYPES = [
  { value: "title", icon: Type, label: "제목", labelEn: "Title", color: "#4a4a4a" },
  { value: "subtitle", icon: Type, label: "부제목", labelEn: "Subtitle", color: "#6b6b6b" },
  { value: "sticky_note", icon: StickyNote, label: "포스트잇", labelEn: "Sticky", color: "#e8c840" },
  { value: "numbered_list", icon: ListOrdered, label: "번호목록", labelEn: "List", color: "#5a7a5a" },
  { value: "checklist", icon: CheckSquare, label: "체크리스트", labelEn: "Check", color: "#4a7c6a" },
  { value: "photo", icon: Image, label: "사진", labelEn: "Photo", color: "#7c6a9e" },
  { value: "youtube", icon: Youtube, label: "유튜브", labelEn: "YouTube", color: "#cc3333" },
  { value: "song", icon: Music, label: "음악", labelEn: "Song", color: "#7c6a9e" },
  { value: "worship_set", icon: Calendar, label: "예배셋", labelEn: "Set", color: "#b8902a" },
  { value: "link", icon: Link, label: "링크", labelEn: "Link", color: "#3a6b8a" },
  { value: "file", icon: FileText, label: "파일", labelEn: "File", color: "#6b6560" },
  { value: "business_card", icon: Contact, label: "명함", labelEn: "Card", color: "#8b5e52" },
];

interface SpaceBlockPickerProps {
  spaceId: string;
  selectedBlock: SpaceBlock | null;
  onBlockDeleted: () => void;
}

export function SpaceBlockPicker({ spaceId, selectedBlock, onBlockDeleted }: SpaceBlockPickerProps) {
  const { language } = useTranslation();
  const createBlock = useCreateBlock();
  const deleteBlock = useDeleteBlock();

  const handleAddBlock = (blockType: string) => {
    createBlock.mutate({
      space_id: spaceId,
      block_type: blockType,
      pos_x: 100,
      pos_y: 100,
      size_w: 200,
      size_h: 150,
    });
  };

  const handleDelete = () => {
    if (!selectedBlock) return;
    if (!window.confirm(language === "ko" ? "이 블록을 삭제하시겠습니까?" : "Delete this block?")) return;
    deleteBlock.mutate({ id: selectedBlock.id, spaceId });
    onBlockDeleted();
  };

  return (
    <div className="w-72 border-l border-border/40 bg-[hsl(var(--background))] flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedBlock ? (
            <div className="space-y-6">
              {/* Position/size readout */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {language === "ko" ? "블록 정보" : "Block Info"}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <span className="text-muted-foreground">X:</span> {selectedBlock.pos_x}
                  </div>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <span className="text-muted-foreground">Y:</span> {selectedBlock.pos_y}
                  </div>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <span className="text-muted-foreground">W:</span> {selectedBlock.size_w}
                  </div>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <span className="text-muted-foreground">H:</span> {selectedBlock.size_h}
                  </div>
                </div>
              </div>

              {/* Placeholder for Phase D */}
              <div className="text-xs text-muted-foreground italic text-center py-6 border border-dashed border-border/50 rounded-lg">
                Phase D에서 settings 구현 예정
              </div>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {language === "ko" ? "블록 삭제" : "Delete Block"}
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {language === "ko" ? "블록 추가" : "Add Block"}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {BLOCK_TYPES.map(({ value, icon: Icon, label, labelEn, color }) => (
                  <button
                    key={value}
                    onClick={() => handleAddBlock(value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/30"
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {language === "ko" ? label : labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
