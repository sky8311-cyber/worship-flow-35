import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { ChurchIcon, CheckCircle, Crown, ArrowRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface InvitedUserWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  communityName: string;
  communityAvatarUrl?: string | null;
  inviterName?: string | null;
  onComplete: () => void;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
};

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
      <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <DialogHeader className="text-center">
            {/* Community Avatar */}
            <motion.div 
              className="flex justify-center mb-3"
              variants={scaleIn}
            >
              <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                {communityAvatarUrl ? (
                  <AvatarImage src={communityAvatarUrl} alt={communityName} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <ChurchIcon className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <DialogTitle className="text-xl">
                🎉 {communityName}
                {language === "ko" ? " 예배팀에 오신 것을 환영합니다!" : " - Welcome!"}
              </DialogTitle>
            </motion.div>
            
            {inviterName && (
              <motion.div variants={staggerItem}>
                <DialogDescription>
                  {language === "ko" 
                    ? `${inviterName}님이 초대했습니다` 
                    : `Invited by ${inviterName}`}
                </DialogDescription>
              </motion.div>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Main CTA */}
            <motion.div variants={staggerItem}>
              <Button 
                onClick={handleContinue}
                disabled={loading}
                className="w-full"
                size="lg"
                asChild
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {language === "ko" ? "예배팀에 참여하기" : "Join the Team"}
                </motion.button>
              </Button>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Separator />
            </motion.div>

            {/* Become Leader Section */}
            <motion.div 
              className="p-4 bg-muted/50 rounded-lg space-y-3"
              variants={staggerItem}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Crown className="h-4 w-4 text-primary" />
                {language === "ko" 
                  ? "다른 팀도 이끌고 계신가요?" 
                  : "Do you lead other teams too?"}
              </div>
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
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
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
