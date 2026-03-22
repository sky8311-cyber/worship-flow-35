import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function usePendingInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["institute-invitations-pending", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_invitations")
        .select("*, institute_courses(title, title_ko)")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useAcceptInvitation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      // Get the invitation
      const { data: inv, error: invErr } = await supabase
        .from("institute_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();
      if (invErr || !inv) throw invErr || new Error("Invitation not found");

      // Upsert enrollment
      const { error: enrollErr } = await supabase
        .from("institute_enrollments")
        .upsert(
          { user_id: user!.id, course_id: inv.course_id! },
          { onConflict: "user_id,course_id" }
        );
      if (enrollErr) throw enrollErr;

      // Update invitation status
      const { error: updateErr } = await supabase
        .from("institute_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-invitations-pending"] });
      queryClient.invalidateQueries({ queryKey: ["institute-enrollments"] });
    },
  });
}

export function useSendInvitation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userIds,
      courseId,
    }: {
      userIds: string[];
      courseId: string;
    }) => {
      const rows = userIds.map((uid) => ({
        invited_by: user!.id,
        user_id: uid,
        course_id: courseId,
        status: "pending",
      }));

      const { error } = await supabase
        .from("institute_invitations")
        .upsert(rows, { onConflict: "user_id,course_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-invitations-sent"] });
    },
  });
}

export function useSentInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["institute-invitations-sent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_invitations")
        .select("*, institute_courses(title, title_ko), profiles:user_id(full_name, email)")
        .eq("invited_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}
