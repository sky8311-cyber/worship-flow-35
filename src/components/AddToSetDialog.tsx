import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AddToSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song?: any;
  songs?: any[];
  onSuccess?: () => void;
}

export function AddToSetDialog({ open, onOpenChange, song, songs, onSuccess }: AddToSetDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<"new" | string>("new");
  
  // CRITICAL: Capture songs in state when dialog opens to prevent closure issues
  const [capturedSongs, setCapturedSongs] = useState<any[]>([]);
  
  useEffect(() => {
    if (open) {
      // Capture songs when dialog opens - this prevents race conditions
      const songsToCapture = songs || (song ? [song] : []);
      setCapturedSongs([...songsToCapture]); // Create a copy
    }
  }, [open, songs, song]);
  
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
  
  const canAddToSet = capturedSongs.length > 0;
  
  const addToSetMutation = useMutation({
    mutationFn: async (songsParam: any[]) => {
      console.log("Mutation started with songs:", songsParam);
      
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
        // Use insert without select to avoid hanging
        const newSetId = crypto.randomUUID();
        const { error: setError } = await supabase
          .from("service_sets")
          .insert({
            id: newSetId,
            date: format(new Date(), "yyyy-MM-dd"),
            service_name: "새 워십세트",
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
      
      // Get existing songs position
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
      
      const { error: songError } = await supabase
        .from("set_songs")
        .insert(songInserts);
      
      if (songError) {
        console.error("Insert set_songs error:", songError);
        throw songError;
      }
      
      return { setId: targetSetId, count: validSongs.length };
    },
    onSuccess: (result) => {
      const { setId, count } = result;
      const message = count === 1 
        ? "곡이 워십세트에 추가되었습니다"
        : `${count}곡이 워십세트에 추가되었습니다`;
      toast.success(message);
      
      queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
      queryClient.invalidateQueries({ queryKey: ["my-draft-sets"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      
      onSuccess?.();
      onOpenChange(false);
      navigate(`/set-builder/${setId}`);
    },
    onError: (error: any) => {
      console.error("Add to set mutation error:", error);
      toast.error("워십세트에 추가할 수 없습니다. 권한을 확인해주세요.");
    },
  });
  
  const handleAddToSet = () => {
    // Create a snapshot of capturedSongs at click time
    const songsSnapshot = [...capturedSongs];
    console.log("handleAddToSet clicked, songs snapshot:", songsSnapshot);
    
    if (songsSnapshot.length === 0) {
      toast.error("선택된 곡이 없습니다");
      return;
    }
    
    addToSetMutation.mutate(songsSnapshot);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl">
        <DialogHeader>
          <DialogTitle>워십세트에 추가</DialogTitle>
          <DialogDescription>
            선택한 곡을 새 워십세트에 추가하거나 기존 세트에 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {capturedSongs.length === 1 ? "선택한 곡:" : `선택한 곡 (${capturedSongs.length}곡):`}
          </p>
          {capturedSongs.length === 0 ? (
            <p className="text-sm text-destructive">선택된 곡이 없습니다</p>
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
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>새 워십세트 만들기</span>
              </div>
            </Label>
          </div>
          
          {sets && sets.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">기존 워십세트에 추가:</p>
              {sets.map((set) => (
                <div key={set.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer mb-2">
                  <RadioGroupItem value={set.id} id={set.id} />
                  <Label htmlFor={set.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="font-medium">{set.service_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(set.date), "yyyy-MM-dd")} | {set.worship_leader || "인도자 미정"}
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
            취소
          </Button>
          <Button 
            onClick={handleAddToSet} 
            disabled={addToSetMutation.isPending || !canAddToSet}
          >
            {addToSetMutation.isPending ? "추가 중..." : "추가하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
