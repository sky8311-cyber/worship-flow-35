import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2, UserCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { MUSICAL_KEYS, SERVICE_TYPES, TEMPO_PATTERNS } from "./types";

interface AISetBuilderFormProps {
  theme: string;
  setTheme: (v: string) => void;
  songCount: number;
  setSongCount: (v: number) => void;
  preferredKey: string;
  setPreferredKey: (v: string) => void;
  durationMinutes: number;
  setDurationMinutes: (v: number) => void;
  tone: string;
  setTone: (v: string) => void;
  serviceType: string;
  setServiceType: (v: string) => void;
  tempoPattern: string;
  setTempoPattern: (v: string) => void;
  isLoading: boolean;
  onGenerate: () => void;
  hasAiAccess: boolean;
  hasProfile: boolean;
  curationProfile: any;
  onEditProfile: () => void;
  language: string;
}

export function AISetBuilderForm({
  theme, setTheme,
  songCount, setSongCount,
  preferredKey, setPreferredKey,
  durationMinutes, setDurationMinutes,
  tone, setTone,
  serviceType, setServiceType,
  tempoPattern, setTempoPattern,
  isLoading, onGenerate,
  hasAiAccess, hasProfile, curationProfile, onEditProfile,
  language,
}: AISetBuilderFormProps) {
  return (
    <div className="space-y-4 py-4">
      {/* Profile indicator */}
      {hasProfile && (
        <button
          onClick={onEditProfile}
          className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
        >
          <UserCircle className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">내 예배 프로필</p>
            <p className="text-xs text-muted-foreground truncate">
              {curationProfile?.skills_summary?.slice(0, 60)}...
            </p>
          </div>
          <span className="text-xs text-primary shrink-0">수정</span>
        </button>
      )}

      {/* Locked banner */}
      {hasProfile && !hasAiAccess && (
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">예배 프로필이 준비됐습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI 워십세트 생성은 정식멤버(Full Member)부터 사용할 수 있습니다.
                정식멤버가 되면 지금 설정한 프로필이 바로 적용됩니다.
              </p>
            </div>
          </div>
          <Link to="/membership">
            <Button variant="outline" size="sm" className="w-full">
              정식멤버 안내 보기
            </Button>
          </Link>
        </div>
      )}

      {hasAiAccess && (
        <>
          <div className="space-y-2">
            <Label>{language === "ko" ? "설교 본문/주제" : "Sermon Theme / Scripture"}</Label>
            <Input
              placeholder={language === "ko" ? "예: 은혜, 요한복음 3:16" : "e.g., Grace, John 3:16"}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>예배 유형</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="예배 유형 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((st) => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tempo Pattern */}
          <div className="space-y-2">
            <Label>템포 패턴</Label>
            <RadioGroup value={tempoPattern} onValueChange={setTempoPattern} className="grid gap-2">
              {TEMPO_PATTERNS.map((tp) => (
                <label
                  key={tp.value}
                  className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5"
                >
                  <RadioGroupItem value={tp.value} />
                  <span className="text-sm font-medium">{tp.label}</span>
                  {tp.description && (
                    <span className="text-xs text-muted-foreground ml-auto">{tp.description}</span>
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{language === "ko" ? "곡 수" : "Number of Songs"}</Label>
            <Input
              type="number"
              min={3}
              max={12}
              value={songCount || ""}
              onChange={(e) => setSongCount(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === "ko" ? "선호 키" : "Preferred Key"}</Label>
            <Select value={preferredKey} onValueChange={setPreferredKey}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ko" ? "키 선택 (선택사항)" : "Select key (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{language === "ko" ? "상관없음" : "Any"}</SelectItem>
                {MUSICAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{language === "ko" ? "예배 시간 (분)" : "Service Duration (min)"}</Label>
            <Input
              type="number"
              min={10}
              max={120}
              value={durationMinutes || ""}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === "ko" ? "분위기" : "Tone"}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_energy">{language === "ko" ? "에너지 높은" : "High Energy"}</SelectItem>
                <SelectItem value="reflective">{language === "ko" ? "묵상적" : "Reflective"}</SelectItem>
                <SelectItem value="mixed">{language === "ko" ? "혼합" : "Mixed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === "ko" ? "AI가 세트를 구성하고 있습니다..." : "AI is building your set..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === "ko" ? "AI 세트 생성" : "Generate AI Set"}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
