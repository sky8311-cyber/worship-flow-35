import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, Image as ImageIcon, List, ListOrdered,
  Heading1, Heading2, Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const { t } = useTranslation();
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-2",
        },
      }),
      Underline,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("component-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("component-images")
        .getPublicUrl(filePath);

      editor?.chain().focus().setImage({ src: publicUrl }).run();
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setLinkOpen(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title={t("setBuilder.richEditor.bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title={t("setBuilder.richEditor.italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title={t("setBuilder.richEditor.underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title={t("setBuilder.richEditor.strikethrough")}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title={t("setBuilder.richEditor.heading1")}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title={t("setBuilder.richEditor.heading2")}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title={t("setBuilder.richEditor.bulletList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title={t("setBuilder.richEditor.orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("link") ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title={t("setBuilder.richEditor.link")}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={handleLinkSubmit}>
                {t("common.add")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title={t("setBuilder.richEditor.image")}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};