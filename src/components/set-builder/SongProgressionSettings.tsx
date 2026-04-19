import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, History, Save, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SongProgressionSettingsProps {
  songId: string;
}

interface HistoryEntry {
  id: string;
  bpm: number | null;
  time_signature: string | null;
  energy_level: number | null;
  notes: string | null;
  created_at: string;
}

const ENERGY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "낮음 (1)" },
  { value: "2", label: "낮음-중간 (2)" },
  { value: "3", label: "중간 (3)" },
  { value: "4", label: "중간-높음 (4)" },
  { value: "5", label: "높음 (5)" },
];

export const SongProgressionSettings = ({ songId }: SongProgressionSettingsProps) => {
  const [bpm, setBpm] = useState<string>("");
  const [timeSignature, setTimeSignature] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load latest history entry on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("user_song_settings_history")
          .select("*")
          .eq("user_id", user.id)
          .eq("song_id", songId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && data) {
          setBpm(data.bpm?.toString() ?? "");
          setTimeSignature(data.time_signature ?? "");
          setEnergyLevel(data.energy_level?.toString() ?? "");
          setNotes(data.notes ?? "");
        }
      } catch (e) {
        console.error("Failed to load song settings history:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [songId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_song_settings_history")
        .insert({
          user_id: user.id,
          song_id: songId,
          bpm: bpm ? Number(bpm) : null,
          time_signature: timeSignature || null,
          energy_level: energyLevel ? Number(energyLevel) : null,
          notes: notes || null,
        });
      if (error) throw error;
      toast.success("저장되었습니다");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("user_song_settings_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory((data || []) as HistoryEntry[]);
    } catch (e) {
      console.error(e);
      toast.error("이력 불러오기 실패");
    } finally {
      setHistoryLoading(false);
    }
  };

  const applyHistoryEntry = (entry: HistoryEntry) => {
    setBpm(entry.bpm?.toString() ?? "");
    setTimeSignature(entry.time_signature ?? "");
    setEnergyLevel(entry.energy_level?.toString() ?? "");
    setNotes(entry.notes ?? "");
    setHistoryOpen(false);
  };

  return (
    <div className="border border-border rounded-md p-3 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium flex items-center gap-1.5">
          <Music2 className="w-4 h-4 text-primary" />
          진행 설정
        </h5>
        <div className="flex gap-1">
          <Popover open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (o) loadHistory(); }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <History className="w-3.5 h-3.5 mr-1" />
                이력
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-2 border-b">
                <p className="text-xs font-medium">진행 설정 이력</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {historyLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    저장된 이력이 없습니다
                  </p>
                ) : (
                  <ul className="divide-y">
                    {history.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onClick={() => applyHistoryEntry(h)}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-xs"
                        >
                          <div className="text-muted-foreground text-[10px]">
                            {format(new Date(h.created_at), "yyyy-MM-dd HH:mm")}
                          </div>
                          <div className="font-medium">
                            BPM: {h.bpm ?? "-"} / {h.time_signature ?? "-"} / 에너지: {h.energy_level ?? "-"}
                          </div>
                          {h.notes && (
                            <div className="text-muted-foreground truncate mt-0.5">{h.notes}</div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="default" size="sm" className="h-7 px-2 text-xs" onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            저장
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">BPM</label>
          <Input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="120"
            className="mt-1 h-9"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">박자</label>
          <Input
            type="text"
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            placeholder="4/4"
            className="mt-1 h-9"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">에너지</label>
          <Select value={energyLevel || "none"} onValueChange={(v) => setEnergyLevel(v === "none" ? "" : v)} disabled={loading}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {ENERGY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">진행설명</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="예: 후렴 2번 반복, 브리지 생략"
          rows={2}
          className="mt-1"
          disabled={loading}
        />
      </div>
    </div>
  );
};
