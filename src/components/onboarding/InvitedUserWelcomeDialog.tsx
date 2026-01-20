import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { ChurchIcon, CheckCircle, Crown, ArrowRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface InvitedUserWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  communityName: string;
  communityAvatarUrl?: string | null;
  inviterName?: string | null;
  onComplete: () => void;
}

export function InvitedUserWelcomeDialog({ 
  open, 
  onOpenChange, 
  userId,
  communityName,
  communityAvatarUrl,
  inviterName,
  onComplete 
}: InvitedUserWelcomeDialogProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ 
          onboarding_role_asked: true,
          onboarding_role_asked_count: 1,
          invited_by_community_id: null, // Clear the flag
        })
        .eq("id", userId);
      
      onComplete();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeLeader = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ 
          onboarding_role_asked: true,
          onboarding_role_asked_count: 1,
          invited_by_community_id: null,
        })
        .eq("id", userId);
      
      onOpenChange(false);
      navigate("/request-worship-leader");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          {/* Community Avatar */}
          <div className="flex justify-center mb-3">
            <Avatar className="h-16 w-16">
              {communityAvatarUrl ? (
                <AvatarImage src={communityAvatarUrl} alt={communityName} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <ChurchIcon className="h-8 w-8 text-primary" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <DialogTitle className="text-xl">
            🎉 {communityName}
            {language === "ko" ? " 예배팀에 오신 것을 환영합니다!" : " - Welcome!"}
          </DialogTitle>
          
          {inviterName && (
            <DialogDescription>
              {language === "ko" 
                ? `${inviterName}님이 초대했습니다` 
                : `Invited by ${inviterName}`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Main CTA */}
          <Button 
            onClick={handleContinue}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            {language === "ko" ? "예배팀에 참여하기" : "Join the Team"}
          </Button>

          <Separator />

          {/* Become Leader Section */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown className="h-4 w-4 text-primary" />
              {language === "ko" 
                ? "다른 팀도 이끌고 계신가요?" 
                : "Do you lead other teams too?"}
            </div>
            
            <Button 
              variant="outline"
              onClick={handleBecomeLeader}
              disabled={loading}
              className="w-full justify-between"
            >
              <span>
                {language === "ko" 
                  ? "나도 예배 인도자로 활동하기" 
                  : "Become a Worship Leader too"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
