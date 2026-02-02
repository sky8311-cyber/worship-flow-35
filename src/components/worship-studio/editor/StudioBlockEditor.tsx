import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { SlashCommandMenu, SLASH_COMMANDS, type SlashCommand } from "./SlashCommandMenu";
import { SongSelectorDialog } from "./SongSelectorDialog";
import { WorshipSetSelectorDialog } from "./WorshipSetSelectorDialog";
import { SongBlock } from "./blocks/SongBlock";
import { WorshipSetBlock } from "./blocks/WorshipSetBlock";
import type { BlockContent } from "@/hooks/useStudioPosts";
import { cn } from "@/lib/utils";

interface StudioBlockEditorProps {
  initialBlocks?: BlockContent[];
  onChange?: (blocks: BlockContent[], htmlContent: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function StudioBlockEditor({ 
  initialBlocks = [], 
  onChange, 
  placeholder,
  className,
  editable = true
}: StudioBlockEditorProps) {
  const { language } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState("");
  const [slashStartPos, setSlashStartPos] = useState<number | null>(null);
  
  // Selector dialogs
  const [songSelectorOpen, setSongSelectorOpen] = useState(false);
  const [worshipSetSelectorOpen, setWorshipSetSelectorOpen] = useState(false);
  
  // Custom blocks (songs/sets stored separately)
  const [customBlocks, setCustomBlocks] = useState<BlockContent[]>(() => 
    initialBlocks.filter(b => b.type === "song" || b.type === "worship-set")
  );
  
  // Convert initial blocks to HTML for TipTap
  const getInitialContent = useCallback(() => {
    const htmlParts: string[] = [];
    for (const block of initialBlocks) {
      if (block.type === "paragraph") {
        htmlParts.push(`<p>${block.content || ""}</p>`);
      } else if (block.type === "heading") {
        const level = block.attrs?.level || 1;
        htmlParts.push(`<h${level}>${block.content || ""}</h${level}>`);
      } else if (block.type === "bullet-list") {
        htmlParts.push(`<ul><li>${block.content || ""}</li></ul>`);
      } else if (block.type === "numbered-list") {
        htmlParts.push(`<ol><li>${block.content || ""}</li></ol>`);
      } else if (block.type === "quote") {
        htmlParts.push(`<blockquote>${block.content || ""}</blockquote>`);
      } else if (block.type === "divider") {
        htmlParts.push(`<hr />`);
      }
      // song/worship-set blocks handled separately
    }
    return htmlParts.join("") || "<p></p>";
  }, [initialBlocks]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || (language === "ko" 
          ? "'/'를 입력하여 블록 추가..." 
          : "Type '/' for commands..."),
      }),
    ],
    content: getInitialContent(),
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        const blocks = parseHtmlToBlocks(html);
        // Merge with custom blocks
        const allBlocks = [...blocks, ...customBlocks];
        onChange(allBlocks, html);
      }
      
      // Check for slash command trigger
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 50), from, " ");
      const lastSlashIndex = textBefore.lastIndexOf("/");
      
      if (lastSlashIndex !== -1) {
        const afterSlash = textBefore.slice(lastSlashIndex + 1);
        // Only show menu if slash is at word boundary
        const charBeforeSlash = lastSlashIndex > 0 ? textBefore[lastSlashIndex - 1] : " ";
        if (charBeforeSlash === " " || charBeforeSlash === "\n" || lastSlashIndex === 0) {
          if (!afterSlash.includes(" ")) {
            setSlashQuery(afterSlash);
            setSlashStartPos(from - afterSlash.length - 1);
            
            // Get caret position for menu
            const coords = editor.view.coordsAtPos(from);
            setSlashMenuPosition({
              top: coords.bottom + 8,
              left: coords.left,
            });
            setSlashMenuOpen(true);
            return;
          }
        }
      }
      
      setSlashMenuOpen(false);
      setSlashQuery("");
      setSlashStartPos(null);
    },
  });
  
  // Parse HTML back to blocks
  const parseHtmlToBlocks = (html: string): BlockContent[] => {
    const blocks: BlockContent[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    doc.body.childNodes.forEach((node, idx) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();
        const content = el.textContent || "";
        const id = `block-${Date.now()}-${idx}`;
        
        if (tagName === "p") {
          blocks.push({ id, type: "paragraph", content });
        } else if (tagName === "h1") {
          blocks.push({ id, type: "heading", attrs: { level: 1 }, content });
        } else if (tagName === "h2") {
          blocks.push({ id, type: "heading", attrs: { level: 2 }, content });
        } else if (tagName === "h3") {
          blocks.push({ id, type: "heading", attrs: { level: 3 }, content });
        } else if (tagName === "ul") {
          blocks.push({ id, type: "bullet-list", content });
        } else if (tagName === "ol") {
          blocks.push({ id, type: "numbered-list", content });
        } else if (tagName === "blockquote") {
          blocks.push({ id, type: "quote", content });
        } else if (tagName === "hr") {
          blocks.push({ id, type: "divider" });
        }
      }
    });
    
    return blocks;
  };
  
  // Handle slash command selection
  const handleSlashCommand = useCallback((command: SlashCommand) => {
    if (!editor || slashStartPos === null) return;
    
    // Delete the slash and query
    const { from } = editor.state.selection;
    editor.chain()
      .focus()
      .deleteRange({ from: slashStartPos, to: from })
      .run();
    
    // Execute command
    switch (command.key) {
      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "h3":
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case "text":
        editor.chain().focus().setParagraph().run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "numbered":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "divider":
        editor.chain().focus().setHorizontalRule().run();
        break;
      case "song":
        setSongSelectorOpen(true);
        break;
      case "set":
        setWorshipSetSelectorOpen(true);
        break;
    }
    
    setSlashMenuOpen(false);
    setSlashQuery("");
    setSlashStartPos(null);
  }, [editor, slashStartPos]);
  
  // Handle song selection
  const handleSongSelect = (song: { id: string; title: string }) => {
    const newBlock: BlockContent = {
      id: `song-${Date.now()}`,
      type: "song",
      attrs: { songId: song.id },
      content: song.title,
    };
    setCustomBlocks(prev => [...prev, newBlock]);
    
    if (onChange && editor) {
      const html = editor.getHTML();
      const blocks = parseHtmlToBlocks(html);
      onChange([...blocks, ...customBlocks, newBlock], html);
    }
  };
  
  // Handle worship set selection
  const handleWorshipSetSelect = (set: { id: string; service_name: string | null }) => {
    const newBlock: BlockContent = {
      id: `set-${Date.now()}`,
      type: "worship-set",
      attrs: { setId: set.id },
      content: set.service_name || "",
    };
    setCustomBlocks(prev => [...prev, newBlock]);
    
    if (onChange && editor) {
      const html = editor.getHTML();
      const blocks = parseHtmlToBlocks(html);
      onChange([...blocks, ...customBlocks, newBlock], html);
    }
  };
  
  // Remove custom block
  const handleRemoveBlock = (blockId: string) => {
    setCustomBlocks(prev => prev.filter(b => b.id !== blockId));
    
    if (onChange && editor) {
      const html = editor.getHTML();
      const blocks = parseHtmlToBlocks(html);
      const updatedCustomBlocks = customBlocks.filter(b => b.id !== blockId);
      onChange([...blocks, ...updatedCustomBlocks], html);
    }
  };
  
  return (
    <div ref={editorRef} className={cn("relative", className)}>
      {/* TipTap Editor */}
      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
        )}
      />
      
      {/* Custom blocks (songs/sets) */}
      {customBlocks.length > 0 && (
        <div className="mt-4 space-y-2">
          {customBlocks.map(block => {
            if (block.type === "song" && block.attrs?.songId) {
              return (
                <SongBlock
                  key={block.id}
                  songId={block.attrs.songId}
                  isEditing={editable}
                  onRemove={() => handleRemoveBlock(block.id)}
                />
              );
            }
            if (block.type === "worship-set" && block.attrs?.setId) {
              return (
                <WorshipSetBlock
                  key={block.id}
                  setId={block.attrs.setId}
                  isEditing={editable}
                  onRemove={() => handleRemoveBlock(block.id)}
                />
              );
            }
            return null;
          })}
        </div>
      )}
      
      {/* Slash command menu */}
      <SlashCommandMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        searchQuery={slashQuery}
        onSelect={handleSlashCommand}
        onClose={() => {
          setSlashMenuOpen(false);
          setSlashQuery("");
          setSlashStartPos(null);
        }}
      />
      
      {/* Song selector dialog */}
      <SongSelectorDialog
        open={songSelectorOpen}
        onOpenChange={setSongSelectorOpen}
        onSelect={handleSongSelect}
      />
      
      {/* Worship set selector dialog */}
      <WorshipSetSelectorDialog
        open={worshipSetSelectorOpen}
        onOpenChange={setWorshipSetSelectorOpen}
        onSelect={handleWorshipSetSelect}
      />
    </div>
  );
}
