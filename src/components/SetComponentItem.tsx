import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X, ChevronDown, ChevronUp, Clock, User,
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone,
  ScrollText, Sparkles, Music, Music2, MessageCircle, Wine, Droplets,
  Users, MessagesSquare, Circle, FileText, Check, Plus, Settings, ArrowUpDown
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { WorshipComponentType, getComponentLabel, WORSHIP_COMPONENTS } from "@/lib/worshipComponents";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle,
};

interface SetComponentItemProps {
  component: {
    id: string;
    component_type: WorshipComponentType;
    label: string;
    notes?: string;
    duration_minutes?: number;
    assigned_to?: string;
    content?: string;
  };
  index: number;
  totalCount: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: any) => void;
  onOpenReorder?: () => void;
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

export const SetComponentItem = ({ component, index, totalCount, onRemove, onUpdate, onOpenReorder }: SetComponentItemProps) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(!!component.content);
  const [showDetails, setShowDetails] = useState(
    !!component.assigned_to || !!component.duration_minutes
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const { language, t } = useTranslation();

  const IconComponent = getIconForType(component.component_type);

  const handleTypeChange = (newType: WorshipComponentType) => {
    const newLabel = getComponentLabel(newType, language as "en" | "ko");
    onUpdate(index, { 
      component_type: newType, 
      label: newLabel 
    });
  };

  const handleCustomSubmit = () => {
    if (customName.trim()) {
      onUpdate(index, { 
        component_type: "custom", 
        label: customName.trim() 
      });
      setShowCustomInput(false);
      setCustomName("");
    }
  };

  return (
    <div>
      <Card className="shadow-sm border-l-4 border-l-accent bg-accent/10">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-start pt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onOpenReorder?.()}
                    className="flex items-center gap-1 px-2 h-9 rounded-full bg-accent/10 hover:bg-accent/25 border-2 border-accent/40 hover:border-accent text-accent font-bold text-base cursor-pointer transition-all"
                  >
                    {index + 1}
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("setSongItem.reorder.componentTooltip")}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {/* Type selector dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer gap-1.5 py-1 hover:bg-accent transition-colors"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        {component.component_type !== "custom" 
                          ? getComponentLabel(component.component_type, language as "en" | "ko")
                          : component.label
                        }
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto bg-background z-50">
                      {WORSHIP_COMPONENTS.map((comp) => {
                        const CompIcon = getIconForType(comp.type);
                        return (
                          <DropdownMenuItem
                            key={comp.type}
                            onClick={() => handleTypeChange(comp.type)}
                            className="gap-2"
                          >
                            <CompIcon className="w-4 h-4" />
                            {language === "ko" ? comp.labelKo : comp.labelEn}
                            {comp.type === component.component_type && (
                              <Check className="w-4 h-4 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowCustomInput(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ko" ? "커스텀 순서" : "Custom"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Custom name input */}
              {showCustomInput && (
                <div className="flex gap-2">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={language === "ko" ? "순서 이름" : "Component name"}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  />
                  <Button size="sm" onClick={handleCustomSubmit} disabled={!customName.trim()}>
                    {language === "ko" ? "확인" : "OK"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCustomInput(false)}>
                    {language === "ko" ? "취소" : "Cancel"}
                  </Button>
                </div>
              )}

              {/* Details Section (담당자, 소요시간) - Initially hidden */}
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <span className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {language === "ko" ? "세부 정보" : "Details"}
                      {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {/* Assigned To (담당자) field */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={component.assigned_to || ""}
                      onChange={(e) => onUpdate(index, { assigned_to: e.target.value })}
                      placeholder={language === "ko" ? "담당자 (선택)" : "Assigned to (optional)"}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Duration input */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      type="number"
                      value={component.duration_minutes || ""}
                      onChange={(e) => onUpdate(index, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder={language === "ko" ? "소요시간 (분)" : "Duration (min)"}
                      className="h-8 text-sm w-32"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rich Content Editor Section */}
              <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <span className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {t("setBuilder.richEditor.editContent")}
                      {contentOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <RichTextEditor
                    content={component.content || ""}
                    onChange={(html) => onUpdate(index, { content: html })}
                    placeholder={t("setBuilder.richEditor.placeholder")}
                  />
                </CollapsibleContent>
              </Collapsible>

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
