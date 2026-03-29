import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateRoom, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { useStudioSpaces, useUpdateSpace, useReorderSpaces } from "@/hooks/useStudioSpaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StudioBGMSelector } from "./StudioBGMSelector";
import { Lock, Users, Globe, Music, GripVertical, ChevronDown, ChevronUp, Mail } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StudioSpace } from "@/hooks/useStudioSpaces";

const ICON_CATEGORIES = [
  { label: { ko: "예배/신앙", en: "Worship" }, icons: ["🙏", "✝️", "📖", "🕊️", "🎵", "🎶", "🌿", "🕯️", "🌸", "💒"] },
  { label: { ko: "일상/감성", en: "Daily" }, icons: ["☕", "🍀", "📷", "✏️", "🎨", "🌙", "⭐", "🌈", "💌", "📝"] },
  { label: { ko: "폴더/시스템", en: "System" }, icons: ["📁", "📂", "🗂️", "📋", "📌", "🔖", "💼", "🗃️", "📦", "🗄️"] },
];
const COLOR_SWATCHES = [
  "#b8902a", "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b",
];

interface StudioSettingsDialogProps {
  room: WorshipRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RoomVisibility = "private" | "friends" | "public";

// Sortable space item
function SortableSpaceItem({
  space,
  isFirst,
  isExpanded,
  onToggleExpand,
  onUpdate,
  language,
}: {
  space: StudioSpace;
  isFirst: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<StudioSpace>) => void;
  language: string;
}) {
  const t = (ko: string, en: string) => (language === "ko" ? ko : en);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: space.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const visLabel = space.visibility === "public" ? t("공개", "Public")
    : space.visibility === "friends" ? t("이웃", "Friends")
    : t("비공개", "Private");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-base">{space.icon}</span>
        <span className="text-sm font-medium flex-1 truncate">{space.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {visLabel}
        </span>
        <button onClick={onToggleExpand} className="p-0.5 hover:bg-accent rounded">
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <div className="px-3 py-3 space-y-4 border-t">
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs">{t("이름", "Name")}</Label>
            <Input
              value={space.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="text-sm h-8"
            />
          </div>

          {/* Icon */}
          <div className="space-y-1">
            <Label className="text-xs">{t("아이콘", "Icon")}</Label>
            {ICON_CATEGORIES.map((cat) => (
              <div key={cat.label.en}>
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {language === "ko" ? cat.label.ko : cat.label.en}
                </p>
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {cat.icons.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => onUpdate({ icon: ic })}
                      className={`h-7 w-7 rounded-md flex items-center justify-center text-base transition-colors ${space.icon === ic ? "bg-[hsl(var(--primary))]/10 ring-2 ring-[hsl(var(--primary))]" : "hover:bg-muted/50"}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label className="text-xs">{t("색깔", "Color")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdate({ color: c })}
                  className={`h-7 w-7 rounded-full transition-all ${space.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1">
            <Label className="text-xs">{t("공개 설정", "Visibility")}</Label>
            {isFirst ? (
              <p className="text-xs text-muted-foreground">{t("첫 번째 공간은 항상 공개입니다", "First space is always public")}</p>
            ) : (
              <RadioGroup
                value={space.visibility}
                onValueChange={(v) => onUpdate({ visibility: v as any })}
                className="flex gap-3"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="public" id={`vis-pub-${space.id}`} />
                  <Label htmlFor={`vis-pub-${space.id}`} className="text-xs">{t("전체공개", "Public")}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="friends" id={`vis-fri-${space.id}`} />
                  <Label htmlFor={`vis-fri-${space.id}`} className="text-xs">{t("친구만", "Friends")}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="private" id={`vis-pri-${space.id}`} />
                  <Label htmlFor={`vis-pri-${space.id}`} className="text-xs">{t("비공개", "Private")}</Label>
                </div>
              </RadioGroup>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export function StudioSettingsDialog({ room, open, onOpenChange }: StudioSettingsDialogProps) {
  const { language } = useTranslation();
  const updateRoom = useUpdateRoom();
  const { data: spaces = [] } = useStudioSpaces(room.id);
  const updateSpace = useUpdateSpace();
  const reorderSpaces = useReorderSpaces();
  
  const [visibility, setVisibility] = useState<RoomVisibility>(room.visibility);
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>(room.bgm_song_id);
  const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);
  const [guestbookEnabled, setGuestbookEnabled] = useState<boolean>((room as any).guestbook_enabled ?? true);
  const [guestbookPermission, setGuestbookPermission] = useState<string>((room as any).guestbook_permission ?? 'all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  
  const handleSave = () => {
    updateRoom.mutate({
      roomId: room.id,
      visibility,
      bgm_song_id: selectedBgmId,
      guestbook_enabled: guestbookEnabled,
      guestbook_permission: guestbookPermission,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleSpaceUpdate = (spaceId: string, updates: Partial<StudioSpace>) => {
    updateSpace.mutate({ id: spaceId, ...updates });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = spaces.findIndex((s) => s.id === active.id);
    const newIndex = spaces.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...spaces];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderSpaces.mutate({ roomId: room.id, orderedIds: reordered.map((s) => s.id) });
  };
  
  const visibilityOptions = [
    {
      value: "private" as const,
      icon: Lock,
      label: language === "ko" ? "비공개" : "Private",
      desc: language === "ko" ? "나만 볼 수 있음" : "Only you can see",
    },
    {
      value: "friends" as const,
      icon: Users,
      label: language === "ko" ? "이웃 공개" : "Neighbors Only",
      desc: language === "ko" ? "이웃만 볼 수 있음" : "Only neighbors can see",
    },
    {
      value: "public" as const,
      icon: Globe,
      label: language === "ko" ? "전체 공개" : "Public",
      desc: language === "ko" ? "모두 볼 수 있음" : "Everyone can see",
    },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "스튜디오 설정" : "Studio Settings"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Visibility */}
          <div className="space-y-3">
            <Label>{language === "ko" ? "공개 설정" : "Visibility"}</Label>
            <RadioGroup 
              value={visibility} 
              onValueChange={(v) => setVisibility(v as RoomVisibility)}
              className="space-y-2"
            >
              {visibilityOptions.map((option) => (
                <div 
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => setVisibility(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <option.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="cursor-pointer font-medium">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* BGM */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <Label>{language === "ko" ? "BGM" : "Background Music"}</Label>
            </div>
            <StudioBGMSelector 
              selectedSongId={selectedBgmId}
              onSelect={setSelectedBgmId}
            />
            <p className="text-xs text-muted-foreground">
              {language === "ko" 
                ? "BGM이 스튜디오의 분위기를 만듭니다." 
                : "BGM sets the atmosphere of your Studio."}
            </p>
          </div>

          {/* Guestbook (Room-level) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label>{language === "ko" ? "방명록" : "Guestbook"}</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{language === "ko" ? "방명록 활성화" : "Enable Guestbook"}</Label>
              <Switch checked={guestbookEnabled} onCheckedChange={setGuestbookEnabled} />
            </div>
            {guestbookEnabled && (
              <RadioGroup
                value={guestbookPermission}
                onValueChange={setGuestbookPermission}
                className="flex gap-3 pl-1"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="all" id="gb-all" />
                  <Label htmlFor="gb-all" className="text-xs">{language === "ko" ? "전체" : "Everyone"}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="friends" id="gb-friends" />
                  <Label htmlFor="gb-friends" className="text-xs">{language === "ko" ? "친구만" : "Friends only"}</Label>
                </div>
              </RadioGroup>
            )}
            <p className="text-xs text-muted-foreground">
              {language === "ko"
                ? "방명록은 스튜디오당 1개이며, 모든 공간에서 표시됩니다."
                : "One guestbook per studio, visible across all spaces."}
            </p>
          </div>

          {spaces.length > 0 && (
            <div className="space-y-3">
              <Label>{language === "ko" ? "공간 관리" : "Space Management"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === "ko"
                  ? "드래그하여 순서를 변경하고, 펼쳐서 설정을 변경하세요."
                  : "Drag to reorder, expand to edit settings."}
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={spaces.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {spaces.map((space, idx) => (
                      <SortableSpaceItem
                        key={space.id}
                        space={space}
                        isFirst={idx === 0}
                        isExpanded={expandedSpaceId === space.id}
                        onToggleExpand={() => setExpandedSpaceId(expandedSpaceId === space.id ? null : space.id)}
                        onUpdate={(updates) => handleSpaceUpdate(space.id, updates)}
                        language={language}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={updateRoom.isPending}>
            {updateRoom.isPending 
              ? (language === "ko" ? "저장 중..." : "Saving...")
              : (language === "ko" ? "저장" : "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
