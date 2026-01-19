import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateRoom, type WorshipRoom, type ThemeConfig } from "@/hooks/useWorshipRoom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomBGMSelector } from "./RoomBGMSelector";
import { Palette, Music, Lock, Users, Globe } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RoomVisibility = Database["public"]["Enums"]["room_visibility"];

interface RoomCustomizeDialogProps {
  room: WorshipRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const wallpapers = [
  { value: "default", label: "Default", color: "#f8f9fa" },
  { value: "nature", label: "Nature", color: "#e8f5e9" },
  { value: "worship", label: "Worship", color: "#e3f2fd" },
  { value: "minimal", label: "Minimal", color: "#ffffff" },
  { value: "gradient", label: "Gradient", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
];

const floorStyles = [
  { value: "wood", label: "Wood" },
  { value: "marble", label: "Marble" },
  { value: "carpet", label: "Carpet" },
  { value: "stone", label: "Stone" },
];

const visibilityOptions = [
  { value: "private", icon: Lock, label: "rooms.visibility.private", description: "rooms.visibilityDesc.private" },
  { value: "friends", icon: Users, label: "rooms.visibility.friends", description: "rooms.visibilityDesc.friends" },
  { value: "public", icon: Globe, label: "rooms.visibility.public", description: "rooms.visibilityDesc.public" },
];

export function RoomCustomizeDialog({ room, open, onOpenChange }: RoomCustomizeDialogProps) {
  const { t } = useTranslation();
  const updateRoom = useUpdateRoom();
  
  const initialConfig = room.theme_config || {
    wallpaper: "default",
    backgroundColor: "#f8f9fa",
    floorStyle: "wood",
    decorations: [],
  };
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(initialConfig);
  const [visibility, setVisibility] = useState<RoomVisibility>(room.visibility);
  const [bgmSongId, setBgmSongId] = useState<string | null>(room.bgm_song_id);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setThemeConfig(room.theme_config || initialConfig);
      setVisibility(room.visibility);
      setBgmSongId(room.bgm_song_id);
    }
  }, [open, room]);
  
  const handleSave = () => {
    updateRoom.mutate(
      {
        roomId: room.id,
        visibility,
        theme_config: themeConfig,
        bgm_song_id: bgmSongId,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };
  
  const handleWallpaperChange = (value: string) => {
    const wallpaper = wallpapers.find(w => w.value === value);
    setThemeConfig(prev => ({
      ...prev,
      wallpaper: value as ThemeConfig["wallpaper"],
      backgroundColor: wallpaper?.color.startsWith("linear") ? prev.backgroundColor : wallpaper?.color || prev.backgroundColor,
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("rooms.customizeRoom")}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              {t("rooms.theme")}
            </TabsTrigger>
            <TabsTrigger value="bgm">
              <Music className="h-4 w-4 mr-2" />
              BGM
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Lock className="h-4 w-4 mr-2" />
              {t("rooms.privacy")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="theme" className="space-y-4 mt-4">
            {/* Wallpaper Selection */}
            <div>
              <Label className="text-sm font-medium">{t("rooms.wallpaper")}</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {wallpapers.map((wp) => (
                  <button
                    key={wp.value}
                    onClick={() => handleWallpaperChange(wp.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      themeConfig.wallpaper === wp.value 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{ background: wp.color }}
                    title={wp.label}
                  />
                ))}
              </div>
            </div>
            
            {/* Floor Style */}
            <div>
              <Label className="text-sm font-medium">{t("rooms.floorStyle")}</Label>
              <Select 
                value={themeConfig.floorStyle} 
                onValueChange={(v) => setThemeConfig(prev => ({ ...prev, floorStyle: v as ThemeConfig["floorStyle"] }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floorStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="bgm" className="mt-4">
            <RoomBGMSelector 
              selectedSongId={bgmSongId}
              onSelect={setBgmSongId}
            />
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-4">
            <RadioGroup 
              value={visibility} 
              onValueChange={(v) => setVisibility(v as RoomVisibility)}
              className="space-y-3"
            >
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {t(option.label)}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t(option.description)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={updateRoom.isPending}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
