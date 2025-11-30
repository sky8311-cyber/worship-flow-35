import { useState, useEffect } from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette, RotateCcw } from "lucide-react";

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
}

interface ChurchThemeCustomizerProps {
  themeConfig: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#2b4b8a",
  accentColor: "#d16265",
};

const PRESET_COLORS = [
  { name: "Blue", primary: "#2b4b8a", accent: "#d16265" },
  { name: "Purple", primary: "#6b46c1", accent: "#ed8936" },
  { name: "Green", primary: "#2f855a", accent: "#d69e2e" },
  { name: "Teal", primary: "#0d9488", accent: "#f472b6" },
  { name: "Navy", primary: "#1e3a5f", accent: "#f59e0b" },
  { name: "Burgundy", primary: "#7c2d12", accent: "#0ea5e9" },
];

export function ChurchThemeCustomizer({ themeConfig, onChange }: ChurchThemeCustomizerProps) {
  const { language } = useLanguageContext();
  const [primaryColor, setPrimaryColor] = useState(themeConfig.primaryColor || DEFAULT_THEME.primaryColor);
  const [accentColor, setAccentColor] = useState(themeConfig.accentColor || DEFAULT_THEME.accentColor);

  useEffect(() => {
    setPrimaryColor(themeConfig.primaryColor || DEFAULT_THEME.primaryColor);
    setAccentColor(themeConfig.accentColor || DEFAULT_THEME.accentColor);
  }, [themeConfig]);

  const handleColorChange = (type: "primary" | "accent", value: string) => {
    if (type === "primary") {
      setPrimaryColor(value);
      onChange({ primaryColor: value, accentColor });
    } else {
      setAccentColor(value);
      onChange({ primaryColor, accentColor: value });
    }
  };

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    onChange({ primaryColor: preset.primary, accentColor: preset.accent });
  };

  const resetToDefault = () => {
    setPrimaryColor(DEFAULT_THEME.primaryColor);
    setAccentColor(DEFAULT_THEME.accentColor);
    onChange(DEFAULT_THEME);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {language === "ko" ? "색상 프리셋" : "Color Presets"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetToDefault}
          className="gap-1 text-xs"
        >
          <RotateCcw className="w-3 h-3" />
          {language === "ko" ? "기본값" : "Reset"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => applyPreset(preset)}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:border-primary transition-colors"
            title={preset.name}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: preset.primary }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: preset.accent }}
            />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor" className="text-sm">
            {language === "ko" ? "기본 색상" : "Primary Color"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              placeholder="#2b4b8a"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accentColor" className="text-sm">
            {language === "ko" ? "강조 색상" : "Accent Color"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="accentColor"
              type="color"
              value={accentColor}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={accentColor}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              placeholder="#d16265"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground mb-2">
          {language === "ko" ? "미리보기" : "Preview"}
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            A
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: accentColor }}
          >
            B
          </div>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {language === "ko"
          ? "이 색상은 교회 계정의 화이트레이블 브랜딩에 사용됩니다."
          : "These colors will be used for your church's white-label branding."}
      </p>
    </div>
  );
}
