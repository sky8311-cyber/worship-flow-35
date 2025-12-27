import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSetSnapshot } from "@/hooks/useSetAuditHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, Music, LayoutList } from "lucide-react";

interface SetRevertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string | undefined;
  snapshotTime: string | null;
  onRevertComplete?: (restoredSongs: any[], restoredComponents: any[]) => void;
}

export const SetRevertDialog = ({
  open,
  onOpenChange,
  setId,
  snapshotTime,
  onRevertComplete,
}: SetRevertDialogProps) => {
  const queryClient = useQueryClient();
  const { data: snapshot, isLoading } = useSetSnapshot(setId, snapshotTime || undefined);

  const revertMutation = useMutation({
    mutationFn: async () => {
      if (!setId || !snapshot) throw new Error("Missing data");

      // Delete all current songs and components
      await supabase.from("set_songs").delete().eq("service_set_id", setId);
      await supabase.from("set_components").delete().eq("service_set_id", setId);

      let insertedSongs: any[] = [];
      let insertedComponents: any[] = [];

      // Restore songs from snapshot - get back the new IDs
      if (snapshot.songs.length > 0) {
        const songsToInsert = snapshot.songs.map((song) => ({
          service_set_id: setId,
          song_id: song.song_id,
          position: song.position,
          key: song.key,
          key_change_to: song.key_change_to,
          custom_notes: song.custom_notes,
          override_score_file_url: song.override_score_file_url,
          override_youtube_url: song.override_youtube_url,
          lyrics: song.lyrics,
          bpm: song.bpm,
          time_signature: song.time_signature,
          energy_level: song.energy_level,
        }));
        
        const { data, error } = await supabase
          .from("set_songs")
          .insert(songsToInsert)
          .select("id, song_id, position, key, key_change_to, custom_notes, override_score_file_url, override_youtube_url, lyrics, bpm, time_signature, energy_level");
        
        if (error) throw error;
        insertedSongs = data || [];
      }

      // Restore components from snapshot - get back the new IDs
      if (snapshot.components.length > 0) {
        const componentsToInsert = snapshot.components.map((comp) => ({
          service_set_id: setId,
          position: comp.position,
          component_type: comp.component_type,
          label: comp.label,
          notes: comp.notes,
          duration_minutes: comp.duration_minutes,
          assigned_to: comp.assigned_to,
          content: comp.content,
        }));
        
        const { data, error } = await supabase
          .from("set_components")
          .insert(componentsToInsert)
          .select("id, position, component_type, label, notes, duration_minutes, assigned_to, content");
        
        if (error) throw error;
        insertedComponents = data || [];
      }

      // Update set metadata if needed
      if (snapshot.set) {
        const { error } = await supabase
          .from("service_sets")
          .update({
            service_name: snapshot.set.service_name,
            date: snapshot.set.date,
            service_time: snapshot.set.service_time,
            worship_leader: snapshot.set.worship_leader,
            band_name: snapshot.set.band_name,
            theme: snapshot.set.theme,
            notes: snapshot.set.notes,
            scripture_reference: snapshot.set.scripture_reference,
            target_audience: snapshot.set.target_audience,
            worship_duration: snapshot.set.worship_duration,
          })
          .eq("id", setId);
        if (error) throw error;
      }

      return { insertedSongs, insertedComponents };
    },
    onSuccess: (data) => {
      toast.success("이전 버전으로 되돌렸습니다");
      
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
      queryClient.invalidateQueries({ queryKey: ["set-songs", setId] });
      queryClient.invalidateQueries({ queryKey: ["set-components", setId] });
      queryClient.invalidateQueries({ queryKey: ["set-audit-history", setId] });
      
      onOpenChange(false);
      
      // Call the callback with restored data so parent can update items state with new dbIds
      if (onRevertComplete && data) {
        onRevertComplete(data.insertedSongs, data.insertedComponents);
      }
    },
    onError: (error) => {
      console.error("Revert error:", error);
      toast.error("되돌리기에 실패했습니다");
    },
  });

  const formattedTime = snapshotTime
    ? format(new Date(snapshotTime), "yyyy년 M월 d일 HH:mm", { locale: ko })
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            이 시점으로 되돌리시겠습니까?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong>{formattedTime}</strong> 시점의 상태로 예배 세트를 복원합니다.
              </p>
              
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : snapshot ? (
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <p className="font-medium">복원될 내용:</p>
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>곡 {snapshot.songs.length}개</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4 text-muted-foreground" />
                    <span>순서 {snapshot.components.length}개</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">스냅샷 데이터를 불러올 수 없습니다.</p>
              )}

              <p className="text-amber-600 text-sm">
                ⚠️ 현재 상태의 곡과 순서가 삭제되고 이전 버전으로 대체됩니다.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revertMutation.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              revertMutation.mutate();
            }}
            disabled={revertMutation.isPending || isLoading || !snapshot}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {revertMutation.isPending ? "되돌리는 중..." : "되돌리기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
