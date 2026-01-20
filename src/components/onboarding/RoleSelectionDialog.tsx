import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Music4, Crown, Users } from "lucide-react";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
}

export function RoleSelectionDialog({ 
  open, 
  onOpenChange, 
  userId,
  onComplete 
}: RoleSelectionDialogProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleTeamMember = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ 
          onboarding_role_asked: true,
          onboarding_role_asked_count: 1 
        })
        .eq("id", userId);
      
      onComplete();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWorshipLeader = async () => {
    setLoading(true);
    try {
      // Mark that we asked but user chose to become WL
      await supabase
        .from("profiles")
        .update({ 
          onboarding_role_asked: true,
          onboarding_role_asked_count: 1 
        })
        .eq("id", userId);
      
      onOpenChange(false);
      navigate("/request-worship-leader");
    } finally {
      setLoading(false);
    }
  };

  const handleLater = async () => {
    setLoading(true);
    try {
      // Increment count but don't mark as completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_role_asked_count")
        .eq("id", userId)
        .single();
      
      const currentCount = profile?.onboarding_role_asked_count || 0;
      
      // If asked 3 times, mark as completed
      if (currentCount >= 2) {
        await supabase
          .from("profiles")
          .update({ 
            onboarding_role_asked: true,
            onboarding_role_asked_count: currentCount + 1 
          })
          .eq("id", userId);
      } else {
        await supabase
          .from("profiles")
          .update({ 
            onboarding_role_asked_count: currentCount + 1 
          })
          .eq("id", userId);
      }
      
      onComplete();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Music4 className="h-12 w-12 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {language === "ko" 
              ? "K-Worship에 오신 것을 환영합니다!" 
              : "Welcome to K-Worship!"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "어떻게 활동하시겠어요?" 
              : "How would you like to participate?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Team Member Option */}
          <button
            onClick={handleTeamMember}
            disabled={loading}
            className="w-full p-4 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-medium">
                  {language === "ko" ? "예배팀 멤버로 참여" : "Join as a Team Member"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "ko" 
                    ? "기존 팀에 초대받아 참여하기" 
                    : "Join an existing team through invitation"}
                </p>
              </div>
            </div>
          </button>

          {/* Worship Leader Option */}
          <button
            onClick={handleWorshipLeader}
            disabled={loading}
            className="w-full p-4 text-left rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {language === "ko" ? "예배 인도자로 시작" : "Start as a Worship Leader"}
                  </h3>
                  <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                    {language === "ko" ? "추천" : "Recommended"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "ko" 
                    ? "내 예배팀 또는 공동체 만들기" 
                    : "Create your own team or community"}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Later button */}
        <Button 
          variant="ghost" 
          onClick={handleLater}
          disabled={loading}
          className="w-full mt-2 text-muted-foreground"
        >
          {language === "ko" ? "나중에 결정할게요" : "I'll decide later"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
