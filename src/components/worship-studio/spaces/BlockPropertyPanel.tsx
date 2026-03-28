import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpaceBlock } from "@/hooks/useSpaceBlocks";

interface BlockPropertyPanelProps {
  block: SpaceBlock;
  isMobile: boolean;
  onUpdate: (content: Record<string, any>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function BlockPropertyPanel({ block, isMobile, onUpdate, onDelete, onClose }: BlockPropertyPanelProps) {
  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerContent className="max-h-[60vh]">
          <div className="p-4">
            <PanelContent block={block} onUpdate={onUpdate} onDelete={onDelete} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="w-[260px] border-l border-border/40 bg-[#faf7f2] dark:bg-background flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Properties</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent/50"><X className="h-3.5 w-3.5" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          <PanelContent block={block} onUpdate={onUpdate} onDelete={onDelete} onClose={onClose} />
        </div>
      </ScrollArea>
    </div>
  );
}

function PanelContent({ block, onUpdate, onDelete }: { block: SpaceBlock; onUpdate: (c: Record<string, any>) => void; onDelete: () => void; onClose?: () => void }) {
  const { language } = useTranslation();
  const content = (block.content || {}) as Record<string, any>;
  const handleChange = (key: string, value: string) => onUpdate({ ...content, [key]: value });

  return (
    <div className="space-y-4">
      <BlockFields blockType={block.block_type} content={content} onChange={handleChange} language={language} />
      <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        {language === "ko" ? "블록 삭제" : "Delete Block"}
      </Button>
    </div>
  );
}

function BlockFields({ blockType, content, onChange, language }: { blockType: string; content: Record<string, any>; onChange: (k: string, v: string) => void; language: string }) {
  switch (blockType) {
    case "song":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "곡 제목" : "Title"} value={content.title || ""} onChange={v => onChange("title", v)} />
          <Field label={language === "ko" ? "키" : "Key"} value={content.key || ""} onChange={v => onChange("key", v)} placeholder="G, A, Bb..." />
          <Field label="BPM" value={content.bpm || ""} onChange={v => onChange("bpm", v)} type="number" />
          <Field label={language === "ko" ? "테마" : "Theme"} value={content.theme || ""} onChange={v => onChange("theme", v)} />
        </div>
      );
    case "scripture":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "구절" : "Reference"} value={content.reference || ""} onChange={v => onChange("reference", v)} placeholder="요 3:16" />
          <FieldArea label={language === "ko" ? "본문" : "Text"} value={content.text || ""} onChange={v => onChange("text", v)} />
        </div>
      );
    case "prayer_note":
      return (
        <div className="space-y-3">
          <FieldArea label={language === "ko" ? "내용" : "Content"} value={content.text || ""} onChange={v => onChange("text", v)} />
        </div>
      );
    case "worship_set":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "테마" : "Theme"} value={content.theme || ""} onChange={v => onChange("theme", v)} />
          <FieldArea label={language === "ko" ? "흐름" : "Flow"} value={content.flow || ""} onChange={v => onChange("flow", v)} />
        </div>
      );
    case "audio":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "제목" : "Title"} value={content.title || ""} onChange={v => onChange("title", v)} />
          <Field label="URL" value={content.url || ""} onChange={v => onChange("url", v)} placeholder="https://..." />
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <FieldArea label={language === "ko" ? "내용" : "Content"} value={content.text || ""} onChange={v => onChange("text", v)} />
        </div>
      );
  }
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} className="h-8 text-sm" />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} className="min-h-[80px] text-sm resize-none" />
    </div>
  );
}
