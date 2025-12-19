import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type GuardState = "checking" | "allowed" | "denied";

export function SetBuilderGuard({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [state, setState] = useState<GuardState>(id ? "checking" : "allowed");
  const checkedIdRef = useRef<string | null>(null);
  const patchedCreatedByRef = useRef<string | null>(null);

  // Reset guard state only when the set id changes
  useEffect(() => {
    if (!id) {
      setState("allowed");
      checkedIdRef.current = null;
      return;
    }
    setState("checking");
    checkedIdRef.current = null;
  }, [id]);

  const { data: setMeta, isLoading: isSetLoading, refetch: refetchSetMeta } = useQuery({
    queryKey: ["set-builder-guard", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("service_sets")
        .select("id, status, created_by, community_id")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const { data: isCollaborator, isLoading: isCollaboratorLoading } = useQuery({
    queryKey: ["set-builder-guard-collab", id, user?.id],
    queryFn: async () => {
      if (!id || !user) return false;
      const { data, error } = await supabase
        .from("set_collaborators")
        .select("id")
        .eq("service_set_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!id && !!user,
    staleTime: 30000,
  });

  const { data: isCommunityLeaderForSet, isLoading: isCommunityLeaderLoading } = useQuery({
    queryKey: ["set-builder-guard-leader", setMeta?.community_id, user?.id],
    queryFn: async () => {
      if (!setMeta?.community_id || !user) return false;
      const { data, error } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", setMeta.community_id)
        .eq("user_id", user.id)
        .eq("role", "community_leader")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!setMeta?.community_id && !!user,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!id) return; // new set: always allowed by this guard
    if (!user) return;

    // If we've already allowed this id, don't ever re-decide (prevents redirect flicker)
    if (checkedIdRef.current === id && state === "allowed") return;

    if (isSetLoading) return;
    if (!setMeta) return;

    // Preserve existing behavior: legacy sets with created_by null get patched once
    if (setMeta.created_by === null) {
      if (patchedCreatedByRef.current !== id) {
        patchedCreatedByRef.current = id;
        supabase
          .from("service_sets")
          .update({ created_by: user.id })
          .eq("id", id)
          .then(({ error }) => {
            if (!error) refetchSetMeta();
          });
      }
      return;
    }

    // Wait for related permission signals to finish
    if (isCollaboratorLoading) return;
    if (setMeta.community_id && isCommunityLeaderLoading) return;

    const isCreator = setMeta.created_by === user.id;
    const isPublished = setMeta.status === "published";
    const hasEditPermission = isCreator || isAdmin || !!isCollaborator || !!isCommunityLeaderForSet;

    if (isPublished && !hasEditPermission) {
      setState("denied");
      toast.info("게시된 워십세트를 읽기 전용으로 보고 있습니다");
      navigate(`/band-view/${id}`, { replace: true });
      return;
    }

    if (!isPublished && !hasEditPermission) {
      setState("denied");
      toast.error("이 임시저장 워십세트를 볼 권한이 없습니다");
      navigate("/dashboard", { replace: true });
      return;
    }

    checkedIdRef.current = id;
    setState("allowed");
  }, [
    id,
    user,
    isAdmin,
    setMeta,
    isSetLoading,
    isCollaborator,
    isCollaboratorLoading,
    isCommunityLeaderForSet,
    isCommunityLeaderLoading,
    navigate,
    state,
    refetchSetMeta,
  ]);

  if (!id) return <>{children}</>;

  if (state !== "allowed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
