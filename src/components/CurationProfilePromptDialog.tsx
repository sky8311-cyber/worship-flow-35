import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DISMISSED_KEY = "kworship_profile_prompt_dismissed";
const IN_PROGRESS_KEY = "kworship_profile_prompt_in_progress";

export function CurationProfilePromptDialog() {
  const { user, isWorshipLeader } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: curationProfile, isLoading } = useQuery({
    queryKey: ["curation-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from("user_curation_profiles" as any)
        .select("skills_summary")
        .eq("user_id", user.id)
        .maybeSingle() as any);
      if (error) throw error;
      return data as { skills_summary: string | null } | null;
    },
    enabled: !!user && hasAiAccess,
  });

  useEffect(() => {
    if (isLoading || !user || !hasAiAccess) return;
    if (curationProfile?.skills_summary) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (sessionStorage.getItem(IN_PROGRESS_KEY)) return;
    if (location.pathname === "/settings") return;
    setOpen(true);
  }, [isLoading, user, hasAiAccess, curationProfile, location.pathname]);

  const handleSetup = () => {
    sessionStorage.setItem(IN_PROGRESS_KEY, "1");
    setOpen(false);
    setTimeout(() => {
      navigate("/settings", { state: { openCurationChat: true } });
    }, 100);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            AI 워십세트, 더 똑똑하게 쓰는 방법
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            내 교회 회중에 맞는 찬양 흐름을 AI가 제안하려면{"\n"}
            먼저 예배 스타일을 알려주세요.{"\n"}
            3분이면 완료됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleSetup} className="w-full">
            지금 설정하기
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full text-muted-foreground">
            나중에 하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

