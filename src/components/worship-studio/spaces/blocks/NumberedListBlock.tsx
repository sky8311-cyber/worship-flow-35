import { useCallback, useRef } from "react";

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function NumberedListBlock({ content, isOwner, onContentChange }: Props) {
  const items: string[] = (content.items as string[]) || [""];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateItem = useCallback((idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onContentChange({ items: next });
  }, [items, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...items];
      next.splice(idx + 1, 0, "");
      onContentChange({ items: next });
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    }
    if (e.key === "Backspace" && items[idx] === "" && items.length > 1) {
      e.preventDefault();
      const next = items.filter((_, i) => i !== idx);
      onContentChange({ items: next });
      setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 0);
    }
  }, [items, onContentChange]);

  return (
    <ol className="h-full p-3 space-y-1 list-decimal list-inside text-sm text-foreground overflow-auto">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-1">
          <span className="text-muted-foreground select-none min-w-[1.2em]">{idx + 1}.</span>
          {isOwner ? (
            <input
              ref={(el) => { inputRefs.current[idx] = el; }}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{item}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
