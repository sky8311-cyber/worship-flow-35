import { FileText, FileImage, FileAudio, FileVideo, File, Download } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  default: File,
};

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function FileDownloadBlock({ content }: Props) {
  const fileUrl = (content.file_url as string) || "";
  const filename = (content.filename as string) || "파일";
  const icon = (content.icon as string) || "default";
  const Icon = ICON_MAP[icon] || ICON_MAP.default;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-2 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Icon className="h-10 w-10 text-muted-foreground" />
      <span className="text-xs font-medium text-foreground text-center truncate max-w-full">{filename}</span>
      {fileUrl && <Download className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  );
}
