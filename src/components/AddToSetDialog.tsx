import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  song?: any; // For backward compatibility with single song
  songs?: any[]; // For multiple songs from cart
  onSuccess?: () => void;
}

export function AddToSetDialog({ open, onOpenChange, song, songs, onSuccess }: AddToSetDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<"new" | string>("new");
  
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
  
  const songsToAdd = songs || (song ? [song] : []);
  
  const addToSetMutation = useMutation({
    mutationFn: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Auth error:", authError);
          throw authError;
        }
        if (!user) throw new Error("Not authenticated");
        
        if (selectedOption === "new") {
          // Use .select() without .single() to avoid edge cases
          const { data: insertedSets, error: setError } = await supabase
            .from("service_sets")
            .insert([{
              date: format(new Date(), "yyyy-MM-dd"),
              service_name: "새 워십세트",
              status: "draft",
              created_by: user.id,
            }])
            .select();
          
          if (setError) {
            console.error("Insert service_sets error:", setError);
            throw setError;
          }
          
          if (!insertedSets || insertedSets.length === 0) {
            throw new Error("Failed to create worship set - no data returned");
          }
          
          const newSet = insertedSets[0];
          
          const songInserts = songsToAdd.map((s, index) => ({
            service_set_id: newSet.id,
            song_id: s.id,
            position: index + 1,
            key: s.default_key,
          }));
          
          const { error: songError } = await supabase
            .from("set_songs")
            .insert(songInserts);
          
          if (songError) {
            console.error("Insert set_songs error:", songError);
            throw songError;
          }
          
          return { setId: newSet.id, count: songsToAdd.length };
        } else {
          const { data: existingSongs, error: fetchError } = await supabase
            .from("set_songs")
            .select("position")
            .eq("service_set_id", selectedOption)
            .order("position", { ascending: false })
            .limit(1);
          
          if (fetchError) {
            console.error("Fetch existing songs error:", fetchError);
            throw fetchError;
          }
          
          const startPosition = (existingSongs?.[0]?.position || 0) + 1;
          
          const songInserts = songsToAdd.map((s, index) => ({
            service_set_id: selectedOption,
            song_id: s.id,
            position: startPosition + index,
            key: s.default_key,
          }));
          
          const { error: insertError } = await supabase
            .from("set_songs")
            .insert(songInserts);
          
          if (insertError) {
            console.error("Insert set_songs error:", insertError);
            throw insertError;
          }
          
          return { setId: selectedOption, count: songsToAdd.length };
        }
      } catch (error) {
        console.error("AddToSetDialog mutation error:", error);
        throw error;
      }
    },
    onSuccess: ({ setId, count }) => {
      const message = count === 1 
        ? "곡이 워십세트에 추가되었습니다"
        : `${count}곡이 워십세트에 추가되었습니다`;
      toast.success(message);
      
      // Invalidate related queries (no await - SetBuilder will fetch fresh data on mount)
      queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
      queryClient.invalidateQueries({ queryKey: ["my-draft-sets"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
      navigate(`/set-builder/${setId}`);
    },
    onError: (error: any) => {
      console.error("Add to set error:", error);
      toast.error("워십세트에 추가할 수 없습니다. 권한을 확인해주세요.");
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>워십세트에 추가</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {songsToAdd.length === 1 ? "선택한 곡:" : `선택한 곡 (${songsToAdd.length}곡):`}
          </p>
          {songsToAdd.length === 1 ? (
            <p className="font-medium">{songsToAdd[0]?.title}</p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {songsToAdd.map((s, i) => (
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
          <Button onClick={() => addToSetMutation.mutate()} disabled={addToSetMutation.isPending}>
            {addToSetMutation.isPending ? "추가 중..." : "추가하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
