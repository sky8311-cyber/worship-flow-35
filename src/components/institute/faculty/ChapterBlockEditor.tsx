import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, GripVertical, Trash2, Plus, Image as ImageIcon, Youtube, Type, Heading1, Heading2, Heading3, Quote, BookOpen, AlertCircle, Minus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContentBlock } from "../BlockRenderer";
import { BlockEditorCommandMenu } from "./BlockEditorCommandMenu";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const genId = () => crypto.randomUUID();

interface Props {
  chapterId: string;
  onClose: () => void;
}

/* ─── Sortable Block Wrapper ─── */
const SortableBlock = ({
  block, children, onDelete,
}: {
  block: ContentBlock; children: React.ReactNode; onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="group relative flex gap-1 items-start py-1">
      <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

/* ─── Block Editors ─── */
const HeadingEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => (
  <input
    value={block.data.text || ""}
    onChange={(e) => onChange({ ...block, data: { ...block.data, text: e.target.value } })}
    className={`w-full bg-transparent border-none outline-none font-bold ${
      block.data.level === 1 ? "text-2xl" : block.data.level === 2 ? "text-xl" : "text-lg"
    }`}
    placeholder={`Heading ${block.data.level || 1}`}
  />
);

const ParagraphEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => (
  <textarea
    value={block.data.text || ""}
    onChange={(e) => onChange({ ...block, data: { ...block.data, text: e.target.value } })}
    className="w-full bg-transparent border-none outline-none text-[15px] leading-relaxed resize-none min-h-[28px]"
    placeholder="Type something..."
    rows={1}
    onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
  />
);

const ImageEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `pages/${genId()}.${ext}`;
      const { error } = await supabase.storage.from("institute-assets").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("institute-assets").getPublicUrl(path);
      onChange({ ...block, data: { ...block.data, url: urlData.publicUrl } });
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {block.data.url ? (
        <img src={block.data.url} alt={block.data.alt || ""} className="w-full rounded-lg max-h-[400px] object-cover" />
      ) : (
        <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:border-primary/40 transition-colors">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">{uploading ? "Uploading..." : "Click to upload"}</span>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
      <Input
        value={block.data.url || ""}
        onChange={(e) => onChange({ ...block, data: { ...block.data, url: e.target.value } })}
        placeholder="Image URL"
        className="text-xs h-7"
      />
      <Input
        value={block.data.caption || ""}
        onChange={(e) => onChange({ ...block, data: { ...block.data, caption: e.target.value } })}
        placeholder="Caption (optional)"
        className="text-xs h-7"
      />
    </div>
  );
};

const VideoEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => {
  const getEmbed = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  const embedUrl = getEmbed(block.data.url || "");

  return (
    <div className="space-y-2">
      <Input
        value={block.data.url || ""}
        onChange={(e) => onChange({ ...block, data: { ...block.data, url: e.target.value } })}
        placeholder="YouTube URL"
        className="text-sm"
      />
      {embedUrl && (
        <div className="relative rounded-lg overflow-hidden" style={{ paddingTop: "56.25%" }}>
          <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen />
        </div>
      )}
    </div>
  );
};

const QuoteEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => (
  <div className="border-l-4 border-amber-400/60 pl-3 space-y-1">
    <textarea
      value={block.data.text || ""}
      onChange={(e) => onChange({ ...block, data: { ...block.data, text: e.target.value } })}
      className="w-full bg-transparent border-none outline-none italic text-[15px] resize-none min-h-[28px]"
      placeholder="Quote text..."
      rows={1}
      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
    />
    <Input
      value={block.data.source || ""}
      onChange={(e) => onChange({ ...block, data: { ...block.data, source: e.target.value } })}
      placeholder="Source (optional)"
      className="text-xs h-7 border-none shadow-none px-0"
    />
  </div>
);

const VerseEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => (
  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 p-3 space-y-1">
    <textarea
      value={block.data.text || ""}
      onChange={(e) => onChange({ ...block, data: { ...block.data, text: e.target.value } })}
      className="w-full bg-transparent border-none outline-none italic text-[15px] resize-none min-h-[28px]"
      placeholder="Bible verse..."
      rows={1}
      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
    />
    <Input
      value={block.data.reference || ""}
      onChange={(e) => onChange({ ...block, data: { ...block.data, reference: e.target.value } })}
      placeholder="e.g. John 3:16"
      className="text-xs h-7 bg-transparent border-none shadow-none px-0 font-medium"
    />
  </div>
);

const CalloutEditor = ({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) => (
  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex gap-2">
    <Input
      value={block.data.icon || "💡"}
      onChange={(e) => onChange({ ...block, data: { ...block.data, icon: e.target.value } })}
      className="w-10 h-8 text-center p-0 border-none shadow-none text-lg"
    />
    <textarea
      value={block.data.text || ""}
      onChange={(e) => onChange({ ...block, data: { ...block.data, text: e.target.value } })}
      className="flex-1 bg-transparent border-none outline-none text-[15px] resize-none min-h-[28px]"
      placeholder="Callout text..."
      rows={1}
      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
    />
  </div>
);

const DividerEditor = () => <hr className="my-2 border-border" />;

const blockEditors: Record<string, React.FC<{ block: ContentBlock; onChange: (b: ContentBlock) => void }>> = {
  heading: HeadingEditor,
  paragraph: ParagraphEditor,
  image: ImageEditor,
  video: VideoEditor,
  quote: QuoteEditor,
  verse: VerseEditor,
  callout: CalloutEditor,
  divider: DividerEditor as any,
};

/* ─── Main Editor ─── */
export const ChapterBlockEditor = ({ chapterId, onClose }: Props) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [titleKo, setTitleKo] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showCommand, setShowCommand] = useState(false);
  const [commandInsertIdx, setCommandInsertIdx] = useState(-1);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: chapter } = useQuery({
    queryKey: ["faculty-chapter-edit", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_chapters").select("*").eq("id", chapterId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!chapterId,
  });

  useEffect(() => {
    if (chapter && !hasLoaded.current) {
      hasLoaded.current = true;
      setTitleKo(chapter.title_ko || "");
      const cb = (chapter as any).content_blocks;
      if (Array.isArray(cb) && cb.length > 0) {
        setBlocks(cb);
      } else {
        setBlocks([{ id: genId(), type: "paragraph", data: { text: "" } }]);
      }
    }
  }, [chapter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("institute_chapters")
        .update({
          title_ko: titleKo,
          title: titleKo,
          content_type: "blocks",
          content_blocks: blocks,
        } as any)
        .eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => toast.success(language === "ko" ? "저장됨" : "Saved"),
  });

  // Auto-save (3s debounce)
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveMutation.mutate(), 3000);
  }, [saveMutation]);

  const updateBlock = useCallback((updated: ContentBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const insertBlock = useCallback((type: ContentBlock["type"], afterIdx: number, data: Record<string, any> = {}) => {
    const newBlock: ContentBlock = { id: genId(), type, data };
    if (type === "heading") newBlock.data = { level: data.level || 1, text: "" };
    if (type === "paragraph") newBlock.data = { text: "" };
    if (type === "callout") newBlock.data = { icon: "💡", text: "" };
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, newBlock);
      return next;
    });
    setShowCommand(false);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
    scheduleAutoSave();
  };

  const handleSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    saveMutation.mutate();
  };

  const handleAIGenerate = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session) throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      const token = refreshData.session.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 300000);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/institute-generate-content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            module_title_ko: titleKo || "페이지",
            file_content: aiText,
            generate_quiz: false,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(fetchTimeout);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "AI failed");
      const firstPage = result.data?.pages?.[0];
      if (firstPage?.content_blocks) {
        setBlocks(firstPage.content_blocks);
        scheduleAutoSave();
        toast.success(language === "ko" ? "AI 블록이 생성되었습니다" : "AI blocks generated");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        toast.error(err.message || "AI 생성 실패");
      }
    } finally {
      setAiLoading(false);
      setShowAIModal(false);
      setAiText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => { handleSave(); onClose(); }}>
            <X className="w-4 h-4" />
          </Button>
          <input
            value={titleKo}
            onChange={(e) => { setTitleKo(e.target.value); scheduleAutoSave(); }}
            className="text-lg font-bold bg-transparent border-none outline-none"
            placeholder={language === "ko" ? "페이지 제목" : "Page title"}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAIModal(true)} disabled={aiLoading}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            AI
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {saveMutation.isPending ? (language === "ko" ? "저장 중..." : "Saving...") : (language === "ko" ? "자동저장" : "Auto-save")}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-3.5 h-3.5 mr-1" />
            {language === "ko" ? "저장" : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, idx) => {
                const Editor = blockEditors[block.type];
                if (!Editor) return null;
                return (
                  <SortableBlock key={block.id} block={block} onDelete={() => deleteBlock(block.id)}>
                    <Editor block={block} onChange={updateBlock} />
                  </SortableBlock>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Add block button */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => { setCommandInsertIdx(blocks.length - 1); setShowCommand(true); }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === "ko" ? "블록 추가" : "Add block"}
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {language === "ko" ? "또는 '/' 입력" : "or type '/'"}
            </span>
          </div>
        </div>
      </div>

      {/* Command Menu */}
      {showCommand && (
        <BlockEditorCommandMenu
          onSelect={(type, data) => insertBlock(type, commandInsertIdx, data)}
          onClose={() => setShowCommand(false)}
        />
      )}

      {/* AI Text Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              {language === "ko" ? "AI로 콘텐츠 생성" : "Generate Content with AI"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === "ko"
                ? "강의 원고나 텍스트를 붙여넣으면 AI가 블록 콘텐츠로 변환합니다."
                : "Paste lecture text and AI will convert it to content blocks."}
            </p>
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              className="min-h-[200px] text-xs font-mono"
              placeholder={language === "ko" ? "텍스트를 붙여넣으세요..." : "Paste text here..."}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowAIModal(false); setAiText(""); }}>
                {language === "ko" ? "취소" : "Cancel"}
              </Button>
              <Button size="sm" onClick={handleAIGenerate} disabled={!aiText.trim() || aiLoading}>
                {aiLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{language === "ko" ? "생성 중..." : "Generating..."}</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 mr-1" />{language === "ko" ? "생성하기" : "Generate"}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
