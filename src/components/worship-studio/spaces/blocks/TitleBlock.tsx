import { cn } from "@/lib/utils";

const FONT_MAP = { xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl" };
const ALIGN_MAP = { left: "text-left", center: "text-center", right: "text-right" };

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function TitleBlock({ content, isOwner, onContentChange }: Props) {
  const text = (content.text as string) || "";
  const fontSize = (content.fontSize as string) || "2xl";
  const align = (content.align as string) || "left";

  return (
    <div className={cn("h-full flex items-center p-3", ALIGN_MAP[align] || "text-left")}>
      {isOwner ? (
        <input
          className={cn(
            "w-full bg-transparent border-none outline-none font-bold text-foreground",
            FONT_MAP[fontSize] || "text-2xl"
          )}
          value={text}
          placeholder="제목을 입력하세요"
          onChange={(e) => onContentChange({ text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <h1 className={cn("w-full font-bold text-foreground", FONT_MAP[fontSize] || "text-2xl")}>
          {text || "제목"}
        </h1>
      )}
    </div>
  );
}
