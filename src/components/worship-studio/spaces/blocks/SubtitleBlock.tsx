import { cn } from "@/lib/utils";

const FONT_MAP = { sm: "text-sm", md: "text-base", lg: "text-lg" };

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function SubtitleBlock({ content, isOwner, onContentChange }: Props) {
  const text = (content.text as string) || "";
  const fontSize = (content.fontSize as string) || "md";

  return (
    <div className="h-full flex items-center p-3">
      {isOwner ? (
        <input
          className={cn(
            "w-full bg-transparent border-none outline-none font-medium text-muted-foreground",
            FONT_MAP[fontSize] || "text-base"
          )}
          value={text}
          placeholder="부제목을 입력하세요"
          onChange={(e) => onContentChange({ text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <h2 className={cn("w-full font-medium text-muted-foreground", FONT_MAP[fontSize] || "text-base")}>
          {text || "부제목"}
        </h2>
      )}
    </div>
  );
}
