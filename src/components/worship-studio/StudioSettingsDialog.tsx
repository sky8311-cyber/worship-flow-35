import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateRoom, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { StudioBGMSelector } from "./StudioBGMSelector";
import { Lock, Users, Globe, Music, Type } from "lucide-react";

interface StudioSettingsDialogProps {
  room: WorshipRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RoomVisibility = "private" | "friends" | "public";

export function StudioSettingsDialog({ room, open, onOpenChange }: StudioSettingsDialogProps) {
  const { language } = useTranslation();
  const updateRoom = useUpdateRoom();
  
  const [visibility, setVisibility] = useState<RoomVisibility>(room.visibility);
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>(room.bgm_song_id);
  const [marqueeText, setMarqueeText] = useState(room.marquee_text || "");
  const [marqueeTextColor, setMarqueeTextColor] = useState(room.marquee_text_color || "#333333");
  const [marqueeBgColor, setMarqueeBgColor] = useState(room.marquee_bg_color || "#f5f0e8");
  const [marqueeSpeed, setMarqueeSpeed] = useState(room.marquee_speed || 50);
  
  const handleSave = () => {
    updateRoom.mutate({
      roomId: room.id,
      visibility,
      bgm_song_id: selectedBgmId,
      marquee_text: marqueeText || null,
      marquee_text_color: marqueeTextColor,
      marquee_bg_color: marqueeBgColor,
      marquee_speed: marqueeSpeed,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
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

  const speedLabel = marqueeSpeed <= 30 
    ? (language === "ko" ? "느림" : "Slow")
    : marqueeSpeed <= 60 
      ? (language === "ko" ? "보통" : "Normal")
      : (language === "ko" ? "빠름" : "Fast");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "스튜디오 설정" : "Studio Settings"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Marquee Text Bar Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label>{language === "ko" ? "소개 텍스트 (흐르는 글)" : "Introduction Text (Marquee)"}</Label>
            </div>
            <Textarea
              placeholder={language === "ko" ? "나를 소개하는 한 줄을 적어보세요..." : "Write a short introduction about yourself..."}
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">{language === "ko" ? "글자 색" : "Text"}</Label>
                <input 
                  type="color" 
                  value={marqueeTextColor} 
                  onChange={(e) => setMarqueeTextColor(e.target.value)}
                  className="w-7 h-7 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">{language === "ko" ? "배경 색" : "BG"}</Label>
                <input 
                  type="color" 
                  value={marqueeBgColor} 
                  onChange={(e) => setMarqueeBgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-border cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{language === "ko" ? "속도" : "Speed"}</Label>
                <span className="text-xs text-muted-foreground">{speedLabel}</span>
              </div>
              <Slider
                value={[marqueeSpeed]}
                onValueChange={([v]) => setMarqueeSpeed(v)}
                min={15}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            {marqueeText && (
              <div 
                className="rounded-lg overflow-hidden h-7 flex items-center"
                style={{ backgroundColor: marqueeBgColor }}
              >
                <div 
                  className="whitespace-nowrap text-xs font-medium animate-marquee px-4"
                  style={{ 
                    color: marqueeTextColor,
                    animationDuration: `${Math.max(3, 200 / marqueeSpeed)}s`,
                  }}
                >
                  {marqueeText}
                </div>
              </div>
            )}
          </div>

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
