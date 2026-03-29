import { ExternalLink } from "lucide-react";

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function LinkButtonBlock({ content }: Props) {
  const label = (content.label as string) || "링크";
  const url = (content.url as string) || "";
  const bgColor = (content.bgColor as string) || "hsl(var(--primary))";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-3">
      <button
        className="px-3 py-1.5 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: bgColor }}
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
