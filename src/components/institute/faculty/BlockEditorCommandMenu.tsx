import { useState, useEffect, useRef } from "react";
import { Heading1, Heading2, Heading3, Type, Image, Youtube, Quote, BookOpen, AlertCircle, Minus } from "lucide-react";
import type { ContentBlock } from "../BlockRenderer";

interface Props {
  onSelect: (type: ContentBlock["type"], data?: Record<string, any>) => void;
  onClose: () => void;
}

const commands = [
  { type: "heading" as const, data: { level: 1 }, label: "Heading 1", labelKo: "제목 1", icon: Heading1, shortcut: "/h1" },
  { type: "heading" as const, data: { level: 2 }, label: "Heading 2", labelKo: "제목 2", icon: Heading2, shortcut: "/h2" },
  { type: "heading" as const, data: { level: 3 }, label: "Heading 3", labelKo: "제목 3", icon: Heading3, shortcut: "/h3" },
  { type: "paragraph" as const, data: {}, label: "Text", labelKo: "본문", icon: Type, shortcut: "/text" },
  { type: "image" as const, data: {}, label: "Image", labelKo: "이미지", icon: Image, shortcut: "/image" },
  { type: "video" as const, data: {}, label: "Video", labelKo: "비디오", icon: Youtube, shortcut: "/video" },
  { type: "quote" as const, data: {}, label: "Quote", labelKo: "인용문", icon: Quote, shortcut: "/quote" },
  { type: "verse" as const, data: {}, label: "Bible Verse", labelKo: "성경 구절", icon: BookOpen, shortcut: "/verse" },
  { type: "callout" as const, data: {}, label: "Callout", labelKo: "강조 박스", icon: AlertCircle, shortcut: "/callout" },
  { type: "divider" as const, data: {}, label: "Divider", labelKo: "구분선", icon: Minus, shortcut: "/divider" },
];

export const BlockEditorCommandMenu = ({ onSelect, onClose }: Props) => {
  const [filter, setFilter] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(filter.toLowerCase()) ||
      c.labelKo.includes(filter) ||
      c.shortcut.includes(filter.toLowerCase()),
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[activeIdx]) {
        e.preventDefault();
        onSelect(filtered[activeIdx].type, filtered[activeIdx].data);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, activeIdx, onSelect, onClose]);

  useEffect(() => { setActiveIdx(0); }, [filter]);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        ref={ref}
        className="fixed left-1/2 top-1/3 -translate-x-1/2 z-50 w-[280px] bg-card border border-border rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-sm outline-none px-2 py-1"
            placeholder="Filter..."
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.shortcut}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  idx === activeIdx ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
                onClick={() => onSelect(cmd.type, cmd.data)}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{cmd.labelKo}</span>
                <span className="text-[10px] text-muted-foreground">{cmd.shortcut}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">No results</div>
          )}
        </div>
      </div>
    </>
  );
};
