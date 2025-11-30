import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  GripVertical, X, ChevronDown, ChevronUp, Clock,
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { WorshipComponentType, getComponentLabel } from "@/lib/worshipComponents";

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle,
};

interface SetComponentItemProps {
  component: {
    id: string;
    component_type: WorshipComponentType;
    label: string;
    notes?: string;
    duration_minutes?: number;
  };
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: any) => void;
}

const getIconForType = (type: WorshipComponentType): React.ComponentType<any> => {
  const iconNames: Record<string, string> = {
    countdown: "Timer",
    welcome: "HandMetal",
    prayer: "HandHeart",
    bible_reading: "BookOpen",
    sermon: "Mic",
    offering: "Heart",
    announcement: "Megaphone",
    lords_prayer: "ScrollText",
    apostles_creed: "ScrollText",
    benediction: "Sparkles",
    special_song: "Music2",
    testimony: "MessageCircle",
    communion: "Wine",
    baptism: "Droplets",
    small_group: "Users",
    responsive_reading: "MessagesSquare",
    custom: "Circle",
  };
  return iconMap[iconNames[type]] || Circle;
};

export const SetComponentItem = ({ component, index, onRemove, onUpdate }: SetComponentItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: component.id });
  const [notesOpen, setNotesOpen] = useState(false);
  const { language } = useTranslation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = getIconForType(component.component_type);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="shadow-sm border-l-4 border-l-accent bg-accent/10">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-start pt-1">
              <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
              </button>
              <div className="text-xl font-bold text-accent mt-2">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 py-1">
                    <IconComponent className="w-3.5 h-3.5" />
                    {component.component_type !== "custom" 
                      ? getComponentLabel(component.component_type, language as "en" | "ko")
                      : null
                    }
                  </Badge>
                  {component.component_type === "custom" && (
                    <span className="font-medium text-foreground">{component.label}</span>
                  )}
                </div>
              </div>

              {/* Editable label for non-custom types */}
              {component.component_type !== "custom" && (
                <Input
                  value={component.label}
                  onChange={(e) => onUpdate(index, { label: e.target.value })}
                  placeholder={language === "ko" ? "라벨 (선택)" : "Label (optional)"}
                  className="h-8 text-sm"
                />
              )}

              {/* Duration input */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={component.duration_minutes || ""}
                  onChange={(e) => onUpdate(index, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder={language === "ko" ? "소요시간 (분)" : "Duration (min)"}
                  className="h-8 text-sm w-32"
                />
              </div>

              {/* Notes Section */}
              <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <span className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      {language === "ko" ? "메모" : "Notes"}
                      {notesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    value={component.notes || ""}
                    onChange={(e) => onUpdate(index, { notes: e.target.value })}
                    placeholder={language === "ko" ? "메모나 설명을 입력하세요" : "Enter notes or description"}
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
