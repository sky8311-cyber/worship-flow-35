import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface CheckItem { text: string; checked: boolean; }

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function ChecklistBlock({ content, isOwner, onContentChange }: Props) {
  const items: CheckItem[] = (content.items as CheckItem[]) || [{ text: "", checked: false }];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateItem = useCallback((idx: number, patch: Partial<CheckItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onContentChange({ items: next });
  }, [items, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...items];
      next.splice(idx + 1, 0, { text: "", checked: false });
      onContentChange({ items: next });
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    }
    if (e.key === "Backspace" && items[idx].text === "" && items.length > 1) {
      e.preventDefault();
      const next = items.filter((_, i) => i !== idx);
      onContentChange({ items: next });
      setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 0);
    }
  }, [items, onContentChange]);

  return (
    <div className="h-full p-3 space-y-1 overflow-auto">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => { e.stopPropagation(); updateItem(idx, { checked: !item.checked }); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-muted-foreground accent-primary"
          />
          {isOwner ? (
            <input
              ref={(el) => { inputRefs.current[idx] = el; }}
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-sm",
                item.checked && "line-through text-muted-foreground"
              )}
              value={item.text}
              onChange={(e) => updateItem(idx, { text: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>
              {item.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
