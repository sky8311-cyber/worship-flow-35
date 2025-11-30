import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Plus, Circle
} from "lucide-react";
import { WORSHIP_COMPONENTS, WorshipComponentType } from "@/lib/worshipComponents";
import { useTranslation } from "@/hooks/useTranslation";

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer,
  HandMetal,
  HandHeart,
  BookOpen,
  Mic,
  Heart,
  Megaphone,
  ScrollText,
  Sparkles,
  Music2,
  MessageCircle,
  Wine,
  Droplets,
  Users,
  MessagesSquare,
  Circle,
};

interface WorshipComponentPaletteProps {
  onAddComponent: (type: WorshipComponentType, customLabel?: string) => void;
}

export const WorshipComponentPalette = ({ onAddComponent }: WorshipComponentPaletteProps) => {
  const [customLabel, setCustomLabel] = useState("");
  const { t, language } = useTranslation();

  const handleAddCustom = () => {
    if (customLabel.trim()) {
      onAddComponent("custom", customLabel.trim());
      setCustomLabel("");
    }
  };

  return (
    <Card className="shadow-md h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {language === "ko" ? "예배 순서" : "Worship Components"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ScrollArea className="h-[400px] pr-2">
          <div className="flex flex-wrap gap-2">
            {WORSHIP_COMPONENTS.map((component) => {
              const IconComponent = iconMap[component.icon] || Circle;
              return (
                <Badge
                  key={component.type}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-2.5 text-xs"
                  onClick={() => onAddComponent(component.type)}
                >
                  <IconComponent className="w-3 h-3 mr-1.5" />
                  {language === "ko" ? component.labelKo : component.labelEn}
                </Badge>
              );
            })}
          </div>
        </ScrollArea>

        {/* Custom component input */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            {language === "ko" ? "커스텀 순서 추가" : "Add Custom Component"}
          </p>
          <div className="flex gap-2">
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={language === "ko" ? "순서 이름 입력" : "Enter name"}
              className="text-sm h-8"
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleAddCustom}
              disabled={!customLabel.trim()}
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
