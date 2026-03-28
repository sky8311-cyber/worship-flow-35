import { Image } from "lucide-react";

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function PhotoBlock({ content }: Props) {
  const url = (content.image_url as string) || "";
  const fit = (content.object_fit as string) || "cover";

  if (!url) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Image className="h-8 w-8" />
        <span className="text-xs">이미지 URL을 설정하세요</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-full h-full"
      style={{ objectFit: fit as any }}
      draggable={false}
    />
  );
}
