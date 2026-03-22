import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface AddToSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song?: any;
  songs?: any[];
  onSuccess?: () => void;
}

export function AddToSetDialog({ open, onOpenChange, song, songs, onSuccess }: AddToSetDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [currentEditingSetId, setCurrentEditingSetId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<"new" | string>("new");
  const [capturedSongs, setCapturedSongs] = useState<any[]>([]);
  const wasOpenRef = useRef(false);
  
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const match = location.pathname.match(/\/set-builder\/([a-f0-9-]+)/i);
      if (match) {
        setCurrentEditingSetId(match[1]);
        setSelectedOption(match[1]);
      } else {
        const storedId = sessionStorage.getItem('currentEditingSetId');
        setCurrentEditingSetId(storedId);
        setSelectedOption(storedId || "new");
      }
      
      const songsToCapture = songs || (song ? [song] : []);
      setCapturedSongs([...songsToCapture]);
    }
    wasOpenRef.current = open;
  }, [open, songs, song, location.pathname]);
  
  useEffect(() => {
    if (open && capturedSongs.length === 0 && song) {
      setCapturedSongs([song]);
    }
  }, [open, capturedSongs.length, song]);
  
  const { data: sets } = useQuery({
    queryKey: ["my-draft-sets"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      
      const { data, error } = await supabase
        .from("service_sets")
        .select("id, date, service_name, worship_leader")
        .eq("created_by", user.user.id)
        .eq("status", "draft")
        .order("date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });
  
  const { data: editingSet } = useQuery({
    queryKey: ["editing-set-info", currentEditingSetId],
    queryFn: async () => {
      if (!currentEditingSetId) return null;
      
      const { data, error } = await supabase
        .from("service_sets")
        .select("id, date, service_name, worship_leader")
        .eq("id", currentEditingSetId)
        .eq("status", "draft")
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!currentEditingSetId && open,
  });
  
  const canAddToSet = capturedSongs.length > 0;
  
  const addToSetMutation = useMutation({
    mutationFn: async (songsParam: any[]) => {
      if (!songsParam || songsParam.length === 0) {
        throw new Error("No songs to add");
      }

      const validSongs = songsParam.filter(s => 
        s && s.id && typeof s.id === 'string' && s.id.length === 36
      );

      if (validSongs.length === 0) {
        throw new Error("No valid songs to add");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      let targetSetId: string;
      
      if (selectedOption === "new") {
        const newSetId = crypto.randomUUID();
        const { error: setError } = await supabase
          .from("service_sets")
          .insert({
            id: newSetId,
            date: format(new Date(), "yyyy-MM-dd"),
            service_name: t("addToSet.newSetName"),
            status: "draft",
            created_by: user.id,
          });
        
        if (setError) {
          console.error("Insert service_sets error:", setError);
          throw setError;
        }
        
        targetSetId = newSetId;
      } else {
        targetSetId = selectedOption;
      }
      
      const { data: existingSongs } = await supabase
        .from("set_songs")
        .select("position")
        .eq("service_set_id", targetSetId)
        .order("position", { ascending: false })
        .limit(1);
      
      const startPosition = (existingSongs?.[0]?.position || 0) + 1;
      
      const songInserts = validSongs.map((s, index) => ({
        service_set_id: targetSetId,
        song_id: s.id,
        position: startPosition + index,
        key: s.default_key,
      }));
      
      const { data: insertedRows, error: songError } = await supabase
        .from("set_songs")
        .insert(songInserts)
        .select("id");
      
      if (songError) {
        console.error("Insert set_songs error:", songError);
        throw songError;
      }
      
      const insertedIds = insertedRows?.map(r => r.id) || [];
      if (insertedIds.length > 0) {
        const storageKey = `recentlyAddedSetSongIds:${targetSetId}`;
        sessionStorage.setItem(storageKey, JSON.stringify({
          ids: insertedIds,
          timestamp: Date.now(),
        }));
      }
      
      return { setId: targetSetId, count: validSongs.length };
    },
    onSuccess: (result) => {
      const { setId, count } = result;
      const message = count === 1 
        ? t("addToSet.songAdded")
        : t("addToSet.songsAdded").replace("{count}", String(count));
      toast.success(message);
      
      queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
      queryClient.invalidateQueries({ queryKey: ["set-songs", setId] });
      queryClient.invalidateQueries({ queryKey: ["set-components", setId] });
      queryClient.invalidateQueries({ queryKey: ["my-draft-sets"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-set-songs"] });
      queryClient.invalidateQueries({ queryKey: ["set-songs-preview"] });
      
      sessionStorage.removeItem('currentEditingSetId');
      sessionStorage.removeItem('currentEditingSetName');
      
      onOpenChange(false);
      onSuccess?.();
      setTimeout(() => {
        navigate(`/set-builder/${setId}`);
      }, 100);
    },
    onError: (error: any) => {
      console.error("Add to set mutation error:", error);
      toast.error(t("addToSet.permissionError"));
    },
  });
  
  const handleAddToSet = () => {
    const songsSnapshot = [...capturedSongs];
    if (songsSnapshot.length === 0) {
      toast.error(t("addToSet.noSongsSelected"));
      return;
    }
    addToSetMutation.mutate(songsSnapshot);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("addToSet.title")}</DialogTitle>
          <DialogDescription>
            {t("addToSet.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {capturedSongs.length === 1 ? t("addToSet.selectedSong") : t("addToSet.selectedSongs").replace("{count}", String(capturedSongs.length))}
          </p>
          {capturedSongs.length === 0 ? (
            <p className="text-sm text-destructive">{t("addToSet.noSongsSelected")}</p>
          ) : capturedSongs.length === 1 ? (
            <p className="font-medium">{capturedSongs[0]?.title}</p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {capturedSongs.map((s, i) => (
                <p key={s.id} className="text-sm">
                  {i + 1}. {s.title} {s.artist && `- ${s.artist}`}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {editingSet && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-primary mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">{t("addToSet.currentEditingSet")}</span>
              </div>
              <div 
                className="flex items-center space-x-2 p-3 border-2 border-primary rounded-lg bg-primary/5 cursor-pointer"
              >
                <RadioGroupItem value={editingSet.id} id={`current-${editingSet.id}`} />
                <Label htmlFor={`current-${editingSet.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{editingSet.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(editingSet.date), "yyyy-MM-dd")} | {editingSet.worship_leader || t("addToSet.leaderTbd")}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>{t("addToSet.createNewSet")}</span>
              </div>
            </Label>
          </div>
          
          {sets && sets.filter(s => s.id !== editingSet?.id).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">{t("addToSet.addToOtherSet")}</p>
              {sets.filter(s => s.id !== editingSet?.id).map((set) => (
                <div key={set.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer mb-2">
                  <RadioGroupItem value={set.id} id={set.id} />
                  <Label htmlFor={set.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="font-medium">{set.service_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(set.date), "yyyy-MM-dd")} | {set.worship_leader || t("addToSet.leaderTbd")}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </RadioGroup>
        
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("addToSet.cancel")}
          </Button>
          <Button 
            onClick={handleAddToSet} 
            disabled={addToSetMutation.isPending || !canAddToSet}
          >
            {addToSetMutation.isPending ? t("addToSet.adding") : t("addToSet.addButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
