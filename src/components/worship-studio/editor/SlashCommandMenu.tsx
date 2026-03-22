import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Text, 
  List, 
  ListOrdered, 
  Quote, 
  Minus, 
  Image, 
  Music, 
  FileStack 
} from "lucide-react";

export interface SlashCommand {
  key: string;
  label_en: string;
  label_ko: string;
  description_en: string;
  description_ko: string;
  icon: React.ReactNode;
  category: "basic" | "kworship";
}

const SLASH_COMMANDS: SlashCommand[] = [
  // Basic blocks
  { 
    key: "h1", 
    label_en: "Heading 1", 
    label_ko: "제목 1",
    description_en: "Big section heading",
    description_ko: "큰 섹션 제목",
    icon: <Heading1 className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "h2", 
    label_en: "Heading 2", 
    label_ko: "제목 2",
    description_en: "Medium section heading",
    description_ko: "중간 섹션 제목",
    icon: <Heading2 className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "h3", 
    label_en: "Heading 3", 
    label_ko: "제목 3",
    description_en: "Small section heading",
    description_ko: "작은 섹션 제목",
    icon: <Heading3 className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "text", 
    label_en: "Text", 
    label_ko: "본문",
    description_en: "Plain text paragraph",
    description_ko: "일반 텍스트 단락",
    icon: <Text className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "bullet", 
    label_en: "Bullet List", 
    label_ko: "글머리 기호",
    description_en: "Create a bullet list",
    description_ko: "글머리 기호 목록 생성",
    icon: <List className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "numbered", 
    label_en: "Numbered List", 
    label_ko: "번호 목록",
    description_en: "Create a numbered list",
    description_ko: "번호 목록 생성",
    icon: <ListOrdered className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "quote", 
    label_en: "Quote", 
    label_ko: "인용구",
    description_en: "Add a quote block",
    description_ko: "인용구 블록 추가",
    icon: <Quote className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "divider", 
    label_en: "Divider", 
    label_ko: "구분선",
    description_en: "Add a horizontal line",
    description_ko: "가로선 추가",
    icon: <Minus className="h-4 w-4" />,
    category: "basic"
  },
  { 
    key: "image", 
    label_en: "Image", 
    label_ko: "이미지",
    description_en: "Upload an image",
    description_ko: "이미지 업로드",
    icon: <Image className="h-4 w-4" />,
    category: "basic"
  },
  // K-Worship blocks
  { 
    key: "song", 
    label_en: "Song", 
    label_ko: "찬양곡",
    description_en: "Embed a song from library",
    description_ko: "라이브러리에서 찬양곡 삽입",
    icon: <Music className="h-4 w-4" />,
    category: "kworship"
  },
  { 
    key: "set", 
    label_en: "Worship Set", 
    label_ko: "예배셋",
    description_en: "Embed a worship set",
    description_ko: "예배셋 삽입",
    icon: <FileStack className="h-4 w-4" />,
    category: "kworship"
  },
];

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  searchQuery: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ 
  isOpen, 
  position, 
  searchQuery, 
  onSelect, 
  onClose 
}: SlashCommandMenuProps) {
  const { language } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(320);
  
  const filteredCommands = SLASH_COMMANDS.filter(cmd => {
    const query = searchQuery.toLowerCase();
    return (
      cmd.key.includes(query) ||
      cmd.label_en.toLowerCase().includes(query) ||
      cmd.label_ko.includes(query)
    );
  });
  
  const basicCommands = filteredCommands.filter(c => c.category === "basic");
  const kworshipCommands = filteredCommands.filter(c => c.category === "kworship");
  
  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Measure menu height
  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.offsetHeight);
    }
  }, [filteredCommands.length, isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);
  
  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);
  
  if (!isOpen || filteredCommands.length === 0) return null;

  // If menu would be cut off at bottom, open upward
  const spaceBelow = window.innerHeight - position.top;
  const shouldOpenUpward = spaceBelow < menuHeight + 100;
  const finalTop = shouldOpenUpward ? position.top - menuHeight : position.top;
  
  return (
    <div
      ref={menuRef}
      className="fixed z-[60] w-72 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ top: finalTop, left: position.left }}
    >
      <div className="max-h-80 overflow-y-auto">
        {basicCommands.length > 0 && (
          <div className="p-1">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {language === "ko" ? "기본 블록" : "Basic Blocks"}
            </div>
            {basicCommands.map((cmd, idx) => (
              <button
                key={cmd.key}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors",
                  selectedIndex === idx
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="flex-shrink-0 p-1.5 rounded-md bg-muted">
                  {cmd.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {language === "ko" ? cmd.label_ko : cmd.label_en}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {language === "ko" ? cmd.description_ko : cmd.description_en}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {kworshipCommands.length > 0 && (
          <div className="p-1 border-t border-border">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {language === "ko" ? "K-Worship" : "K-Worship"}
            </div>
            {kworshipCommands.map((cmd, idx) => {
              const actualIndex = basicCommands.length + idx;
              return (
                <button
                  key={cmd.key}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors",
                    selectedIndex === actualIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => onSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(actualIndex)}
                >
                  <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10 text-primary">
                    {cmd.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {language === "ko" ? cmd.label_ko : cmd.label_en}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {language === "ko" ? cmd.description_ko : cmd.description_en}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { SLASH_COMMANDS };
