import { useTranslation } from "@/hooks/useTranslation";
import { useCreateBlock, useDeleteBlock } from "@/hooks/useSpaceBlocks";
import { useBlockContent } from "@/hooks/useBlockContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Type, StickyNote, ListOrdered, CheckSquare, Image, Youtube, Music, Calendar, Link, FileText, Contact } from "lucide-react";
import { BlockSettingsPanel } from "./blocks/BlockSettingsPanel";
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
  isEditMode: boolean;
  compact?: boolean;
}

function SelectedBlockPanel({ block, spaceId, onBlockDeleted }: { block: SpaceBlock; spaceId: string; onBlockDeleted: () => void }) {
  const { language } = useTranslation();
  const deleteBlock = useDeleteBlock();
  const { content, setContent } = useBlockContent(block.id, spaceId, block.content);

  const handleDelete = () => {
    if (!window.confirm(language === "ko" ? "이 블록을 삭제하시겠습니까?" : "Delete this block?")) return;
    deleteBlock.mutate({ id: block.id, spaceId });
    onBlockDeleted();
  };

  return (
    <BlockSettingsPanel
      block={block}
      content={content}
      onContentChange={setContent}
      onDelete={handleDelete}
    />
  );
}

export function SpaceBlockPicker({ spaceId, selectedBlock, onBlockDeleted, isEditMode, compact }: SpaceBlockPickerProps) {
  const { language } = useTranslation();
  const createBlock = useCreateBlock();

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

  if (compact) {
    return (
      <div className="w-full">
        {selectedBlock ? (
          <SelectedBlockPanel
            key={selectedBlock.id}
            block={selectedBlock}
            spaceId={spaceId}
            onBlockDeleted={onBlockDeleted}
          />
        ) : (
          <div className="p-3">
            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {language === "ko" ? "블록 추가" : "Add Block"}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {BLOCK_TYPES.map(({ value, icon: Icon, label, labelEn, color }) => (
                <button
                  key={value}
                  onClick={() => handleAddBlock(value)}
                  className="flex flex-col items-center justify-center gap-1 w-full py-2 rounded-lg hover:bg-accent/50 transition-all border border-transparent hover:border-border/30 group"
                >
                  <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" style={{ color }} />
                  <span className="text-[9px] text-muted-foreground font-medium leading-tight">
                    {language === "ko" ? label : labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border/40 bg-[hsl(var(--background))] flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedBlock && isEditMode ? (
            <SelectedBlockPanel
              key={selectedBlock.id}
              block={selectedBlock}
              spaceId={spaceId}
              onBlockDeleted={onBlockDeleted}
            />
          ) : (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {language === "ko" ? "블록 추가" : "Add Block"}
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {BLOCK_TYPES.map(({ value, icon: Icon, label, labelEn, color }) => (
                  <button
                    key={value}
                    onClick={() => handleAddBlock(value)}
                    disabled={!isEditMode}
                    className="flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl hover:bg-accent/50 transition-all border border-transparent hover:border-border/30 group disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Icon className="h-7 w-7 group-hover:scale-110 transition-transform" style={{ color }} />
                    <span className="text-[10px] text-muted-foreground font-medium leading-tight">
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