import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SpaceBlock } from "@/hooks/useSpaceBlocks";

interface BlockSettingsPanelProps {
  block: SpaceBlock;
  content: Record<string, any>;
  onContentChange: (patch: Record<string, any>) => void;
  onDelete: () => void;
}

export function BlockSettingsPanel({ block, content, onContentChange, onDelete }: BlockSettingsPanelProps) {
  const { language } = useTranslation();
  const t = (ko: string, en: string) => (language === "ko" ? ko : en);

  return (
    <div className="space-y-6">
      {/* Position/size readout */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {t("블록 정보", "Block Info")}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded px-2 py-1.5"><span className="text-muted-foreground">X:</span> {block.pos_x}</div>
          <div className="bg-muted/50 rounded px-2 py-1.5"><span className="text-muted-foreground">Y:</span> {block.pos_y}</div>
          <div className="bg-muted/50 rounded px-2 py-1.5"><span className="text-muted-foreground">W:</span> {block.size_w}</div>
          <div className="bg-muted/50 rounded px-2 py-1.5"><span className="text-muted-foreground">H:</span> {block.size_h}</div>
        </div>
      </div>

      {/* Type-specific settings */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("설정", "Settings")}
        </h3>
        <TypeSettings blockType={block.block_type} content={content} onChange={onContentChange} />
      </div>

      {/* Delete */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        {t("블록 삭제", "Delete Block")}
      </Button>
    </div>
  );
}

function TypeSettings({ blockType, content, onChange }: { blockType: string; content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  switch (blockType) {
    case "title":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Size</label>
          <div className="flex gap-1">
            {(["xl", "2xl", "3xl"] as const).map(s => (
              <button key={s} onClick={() => onChange({ fontSize: s })}
                className={`px-2 py-1 text-xs rounded border ${content.fontSize === s ? "bg-primary text-primary-foreground" : "border-border"}`}>
                {s}
              </button>
            ))}
          </div>
          <label className="text-xs text-muted-foreground">Align</label>
          <div className="flex gap-1">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
              <button key={a} onClick={() => onChange({ align: a })}
                className={`p-1.5 rounded border ${content.align === a ? "bg-primary text-primary-foreground" : "border-border"}`}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      );

    case "subtitle":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Size</label>
          <div className="flex gap-1">
            {(["sm", "md", "lg"] as const).map(s => (
              <button key={s} onClick={() => onChange({ fontSize: s })}
                className={`px-2 py-1 text-xs rounded border ${content.fontSize === s ? "bg-primary text-primary-foreground" : "border-border"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      );

    case "sticky_note":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">배경색</label>
          <div className="flex gap-2">
            {["#fef08a", "#fecdd3", "#bfdbfe", "#bbf7d0"].map(c => (
              <button key={c} onClick={() => onChange({ bgColor: c })}
                className={`h-7 w-7 rounded-full border-2 ${content.bgColor === c ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      );

    case "numbered_list":
    case "checklist":
      return (
        <Button size="sm" variant="outline" className="w-full" onClick={() => {
          if (blockType === "checklist") {
            const items = [...((content.items as any[]) || []), { text: "", checked: false }];
            onChange({ items });
          } else {
            const items = [...((content.items as string[]) || []), ""];
            onChange({ items });
          }
        }}>
          + 항목 추가
        </Button>
      );

    case "photo":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">이미지 URL</label>
          <Input value={content.image_url || ""} placeholder="https://..." onChange={(e) => onChange({ image_url: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">Object Fit</label>
          <div className="flex gap-1">
            {(["cover", "contain"] as const).map(f => (
              <button key={f} onClick={() => onChange({ object_fit: f })}
                className={`px-2 py-1 text-xs rounded border ${content.object_fit === f ? "bg-primary text-primary-foreground" : "border-border"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      );

    case "youtube":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">YouTube URL</label>
          <Input value={content.url || ""} placeholder="https://youtube.com/watch?v=..." onChange={(e) => onChange({ url: e.target.value })} className="text-xs" />
        </div>
      );

    case "song":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">YouTube URL</label>
          <Input value={content.youtube_url || ""} placeholder="https://youtube.com/..." onChange={(e) => onChange({ youtube_url: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">제목</label>
          <Input value={content.title || ""} onChange={(e) => onChange({ title: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">아티스트</label>
          <Input value={content.artist || ""} onChange={(e) => onChange({ artist: e.target.value })} className="text-xs" />
        </div>
      );

    case "worship_set":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">세트 ID</label>
          <Input value={content.set_id || ""} placeholder="UUID" onChange={(e) => onChange({ set_id: e.target.value })} className="text-xs" />
        </div>
      );

    case "link":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">라벨</label>
          <Input value={content.label || ""} onChange={(e) => onChange({ label: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">URL</label>
          <Input value={content.url || ""} placeholder="https://..." onChange={(e) => onChange({ url: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">배경색</label>
          <div className="flex gap-2">
            {["#3a6b8a", "#b8902a", "#cc3333", "#4a7c6a"].map(c => (
              <button key={c} onClick={() => onChange({ bgColor: c })}
                className={`h-7 w-7 rounded-full border-2 ${content.bgColor === c ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      );

    case "file":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">파일 URL</label>
          <Input value={content.file_url || ""} placeholder="https://..." onChange={(e) => onChange({ file_url: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">파일명</label>
          <Input value={content.filename || ""} onChange={(e) => onChange({ filename: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">아이콘</label>
          <div className="flex gap-1">
            {["document", "image", "audio", "video", "default"].map(i => (
              <button key={i} onClick={() => onChange({ icon: i })}
                className={`px-2 py-1 text-[10px] rounded border ${content.icon === i ? "bg-primary text-primary-foreground" : "border-border"}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
      );

    case "business_card":
      return (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">이름</label>
          <Input value={content.name || ""} onChange={(e) => onChange({ name: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">역할</label>
          <Input value={content.role || ""} onChange={(e) => onChange({ role: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">이메일</label>
          <Input value={content.email || ""} onChange={(e) => onChange({ email: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">전화번호</label>
          <Input value={content.phone || ""} onChange={(e) => onChange({ phone: e.target.value })} className="text-xs" />
          <label className="text-xs text-muted-foreground">프로필 사진 URL</label>
          <Input value={content.photo_url || ""} onChange={(e) => onChange({ photo_url: e.target.value })} className="text-xs" />
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("profiles").select("display_name, email, avatar_url").eq("id", user.id).single();
            if (data) {
              onChange({
                name: data.display_name || "",
                email: data.email || user.email || "",
                photo_url: data.avatar_url || "",
              });
            }
          }}>
            내 프로필에서 가져오기
          </Button>
        </div>
      );

    default:
      return <p className="text-xs text-muted-foreground italic">설정 없음</p>;
  }
}
