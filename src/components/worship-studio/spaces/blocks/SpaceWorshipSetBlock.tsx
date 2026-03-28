import { Calendar } from "lucide-react";

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function SpaceWorshipSetBlock({ content }: Props) {
  const setId = (content.set_id as string) || "";

  if (!setId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Calendar className="h-8 w-8 text-[#b8902a]" />
        <span className="text-xs">예배 세트를 선택하세요</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-3">
      <Calendar className="h-6 w-6 text-[#b8902a]" />
      <span className="text-xs font-medium text-foreground">예배 세트</span>
      <span className="text-[10px] text-muted-foreground truncate max-w-full">{setId.slice(0, 8)}...</span>
    </div>
  );
}
