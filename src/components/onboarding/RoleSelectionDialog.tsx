import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Music4, Crown, Users, X } from "lucide-react";
import { motion } from "framer-motion";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
  onTeamMemberSelected?: () => void;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
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

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

export function RoleSelectionDialog({ 
  open, 
  onOpenChange, 
  userId,
  onComplete,
  onTeamMemberSelected
}: RoleSelectionDialogProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
      // Trigger team member welcome dialog
      onTeamMemberSelected?.();
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
      if (dontShowAgain) {
        // Permanently dismiss by setting count to 99
        await supabase
          .from("profiles")
          .update({ 
            onboarding_role_asked: true,
            onboarding_role_asked_count: 99 
          })
          .eq("id", userId);
      } else {
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
      }
      
      onComplete();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    handleLater();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-b from-background to-muted/30">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <DialogHeader className="text-center">
            <motion.div 
              className="flex justify-center mb-2"
              variants={staggerItem}
            >
              <motion.div
                animate={pulseAnimation}
                className="p-3 rounded-full bg-primary/10"
              >
                <Music4 className="h-12 w-12 text-primary" />
              </motion.div>
            </motion.div>
            <motion.div variants={staggerItem}>
              <DialogTitle className="text-xl">
                {language === "ko" 
                  ? "K-Worship에 오신 것을 환영합니다!" 
                  : "Welcome to K-Worship!"}
              </DialogTitle>
            </motion.div>
            <motion.div variants={staggerItem}>
              <DialogDescription>
                {language === "ko" 
                  ? "어떻게 활동하시겠어요?" 
                  : "How would you like to participate?"}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Team Member Option */}
            <motion.button
              variants={staggerItem}
              onClick={handleTeamMember}
              disabled={loading}
              className="w-full p-4 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
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
                      ? "초대를 받거나, 공동체를 직접 찾아서 가입" 
                      : "Get invited or search for a community to join"}
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Worship Leader Option */}
            <motion.button
              variants={staggerItem}
              onClick={handleWorshipLeader}
              disabled={loading}
              className="w-full p-4 text-left rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
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
            </motion.button>
          </div>

          {/* Don't show again checkbox + Later button */}
          <motion.div variants={staggerItem} className="mt-4 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox 
                id="dontShowAgain" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label 
                htmlFor="dontShowAgain" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {language === "ko" ? "다시 보지 않기" : "Don't show again"}
              </label>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={handleLater}
              disabled={loading}
              className="w-full text-muted-foreground"
            >
              {language === "ko" ? "나중에 결정할게요" : "I'll decide later"}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
