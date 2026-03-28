import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateRoom, type WorshipRoom } from "@/hooks/useWorshipRoom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StudioBGMSelector } from "./StudioBGMSelector";
import { Lock, Users, Globe, Music } from "lucide-react";

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
  
  const handleSave = () => {
    updateRoom.mutate({
      roomId: room.id,
      visibility,
      bgm_song_id: selectedBgmId,
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
      label: language === "ko" ? "친구 공개" : "Friends Only",
      desc: language === "ko" ? "친구만 볼 수 있음" : "Only friends can see",
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
