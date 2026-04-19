import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, History, Save, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

export interface ProgressionHistoryEntry {
  id: string;
  bpm: number | null;
  time_signature: string | null;
  energy_level: number | null;
  notes: string | null;
  created_at: string;
}

interface ProgressionHistoryControlsProps {
  songId: string;
  bpm?: number | null;
  timeSignature?: string | null;
  energyLevel?: number | null;
  notes?: string | null;
  onApplyHistory: (entry: ProgressionHistoryEntry) => void;
}

export const ProgressionHistoryControls = ({
  songId,
  bpm,
  timeSignature,
  energyLevel,
  notes,
  onApplyHistory,
}: ProgressionHistoryControlsProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ProgressionHistoryEntry[]>([]);

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
          bpm: bpm ?? null,
          time_signature: timeSignature ?? null,
          energy_level: energyLevel ?? null,
          notes: notes ?? null,
        });
      if (error) throw error;
      toast.success(t("setSongItem.progression.saveSuccess"));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t("setSongItem.progression.saveError"));
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
      setHistory((data || []) as ProgressionHistoryEntry[]);
    } catch (e) {
      console.error(e);
      toast.error(t("setSongItem.progression.loadError"));
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h5 className="text-sm font-medium flex items-center gap-1.5">
        <Music2 className="w-4 h-4 text-primary" />
        {t("setSongItem.progression.title")}
      </h5>
      <div className="flex gap-1">
        <Popover open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (o) loadHistory(); }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <History className="w-3.5 h-3.5 mr-1" />
              {t("setSongItem.progression.history")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-2 border-b">
              <p className="text-xs font-medium">{t("setSongItem.progression.historyTitle")}</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {t("setSongItem.progression.historyEmpty")}
                </p>
              ) : (
                <ul className="divide-y">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => { onApplyHistory(h); setHistoryOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-xs"
                      >
                        <div className="text-muted-foreground text-[10px]">
                          {format(new Date(h.created_at), "yyyy-MM-dd HH:mm")}
                        </div>
                        <div className="font-medium">
                          BPM: {h.bpm ?? "-"} / {h.time_signature ?? "-"} / {t("setSongItem.energyLevel")}: {h.energy_level ?? "-"}
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
        <Button size="sm" className="h-7 px-2 text-xs bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          {t("setSongItem.progression.save")}
        </Button>
      </div>
    </div>
  );
};
