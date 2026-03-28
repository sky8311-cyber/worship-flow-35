import {
  Type, StickyNote, ListOrdered, CheckSquare, Image, Youtube,
  Music, Calendar, Link, FileText, Contact,
} from "lucide-react";
import { TitleBlock } from "./TitleBlock";
import { SubtitleBlock } from "./SubtitleBlock";
import { StickyNoteBlock } from "./StickyNoteBlock";
import { NumberedListBlock } from "./NumberedListBlock";
import { ChecklistBlock } from "./ChecklistBlock";
import { PhotoBlock } from "./PhotoBlock";
import { YoutubeBlock } from "./YoutubeBlock";
import { MusicBlock } from "./MusicBlock";
import { SpaceWorshipSetBlock } from "./SpaceWorshipSetBlock";
import { LinkButtonBlock } from "./LinkButtonBlock";
import { FileDownloadBlock } from "./FileDownloadBlock";
import { BusinessCardBlock } from "./BusinessCardBlock";

const BLOCK_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  title: { icon: Type, label: "제목", color: "#4a4a4a" },
  subtitle: { icon: Type, label: "부제목", color: "#6b6b6b" },
  sticky_note: { icon: StickyNote, label: "포스트잇", color: "#e8c840" },
  numbered_list: { icon: ListOrdered, label: "번호목록", color: "#5a7a5a" },
  checklist: { icon: CheckSquare, label: "체크리스트", color: "#4a7c6a" },
  photo: { icon: Image, label: "사진", color: "#7c6a9e" },
  youtube: { icon: Youtube, label: "유튜브", color: "#cc3333" },
  song: { icon: Music, label: "음악", color: "#7c6a9e" },
  worship_set: { icon: Calendar, label: "예배셋", color: "#b8902a" },
  link: { icon: Link, label: "링크", color: "#3a6b8a" },
  file: { icon: FileText, label: "파일", color: "#6b6560" },
  business_card: { icon: Contact, label: "명함", color: "#8b5e52" },
};

interface BlockRendererProps {
  blockType: string;
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (patch: Record<string, any>) => void;
}

export function BlockRenderer({ blockType, content, isOwner, onContentChange }: BlockRendererProps) {
  const props = { content, isOwner, onContentChange };

  switch (blockType) {
    case "title": return <TitleBlock {...props} />;
    case "subtitle": return <SubtitleBlock {...props} />;
    case "sticky_note": return <StickyNoteBlock {...props} />;
    case "numbered_list": return <NumberedListBlock {...props} />;
    case "checklist": return <ChecklistBlock {...props} />;
    case "photo": return <PhotoBlock {...props} />;
    case "youtube": return <YoutubeBlock {...props} />;
    case "song": return <MusicBlock {...props} />;
    case "worship_set": return <SpaceWorshipSetBlock {...props} />;
    case "link": return <LinkButtonBlock {...props} />;
    case "file": return <FileDownloadBlock {...props} />;
    case "business_card": return <BusinessCardBlock {...props} />;
    default: {
      const meta = BLOCK_META[blockType] || { icon: FileText, label: blockType, color: "#6b6560" };
      const Icon = meta.icon;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-3" style={{ color: meta.color }}>
          <Icon className="h-6 w-6" />
          <span className="text-xs font-medium">{meta.label}</span>
        </div>
      );
    }
  }
}
