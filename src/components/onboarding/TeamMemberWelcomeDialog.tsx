import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Music, Heart, Search, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface TeamMemberWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const features = [
  { 
    icon: Music, 
    labelKo: "나의 예배 자료 이용", 
    labelEn: "Access My Worship Library",
    descKo: "2,000+ 찬양곡을 검색하고 저장하세요",
    descEn: "Search and save 2,000+ worship songs"
  },
  { 
    icon: Heart, 
    labelKo: "좋아하는 곡 저장", 
    labelEn: "Save Favorite Songs",
    descKo: "자주 부르는 곡을 즐겨찾기에 저장",
    descEn: "Bookmark songs you sing often"
  },
  { 
    icon: Search, 
    labelKo: "공동체 찾기", 
    labelEn: "Find Communities",
    descKo: "가입할 예배공동체를 검색하세요",
    descEn: "Search for communities to join"
  },
];

export function TeamMemberWelcomeDialog({ 
  open, 
  onOpenChange 
}: TeamMemberWelcomeDialogProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const handleSearchCommunity = () => {
    onOpenChange(false);
    navigate("/community/search");
  };

  const handleBecomeLeader = () => {
    onOpenChange(false);
    navigate("/request-worship-leader");
  };

  const handleClose = () => {
    onOpenChange(false);
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
            <motion.div 
              className="flex justify-center mb-3"
              variants={scaleIn}
            >
              <div className="p-4 rounded-full bg-primary/10">
                <Users className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <DialogTitle className="text-xl">
                {language === "ko" ? "팀멤버로 시작합니다! 🎵" : "Starting as a Team Member! 🎵"}
              </DialogTitle>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <DialogDescription className="text-base">
                {language === "ko" 
                  ? "K-Worship에 오신 것을 환영합니다! 다음 기능들을 사용할 수 있어요."
                  : "Welcome to K-Worship! You can now use these features."}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          {/* Features List */}
          <div className="space-y-3 mt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {language === "ko" ? feature.labelKo : feature.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === "ko" ? feature.descKo : feature.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Primary CTA */}
          <motion.div variants={staggerItem} className="mt-4">
            <Button 
              onClick={handleSearchCommunity}
              className="w-full"
              size="lg"
            >
              <Search className="mr-2 h-4 w-4" />
              {language === "ko" ? "공동체 찾아보기" : "Find a Community"}
            </Button>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-3">
            <Separator />
          </motion.div>

          {/* Become Leader Section */}
          <motion.div 
            variants={staggerItem}
            className="mt-3 p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {language === "ko" 
                    ? "예배인도자가 되고 싶으시면?" 
                    : "Want to become a Worship Leader?"}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBecomeLeader}
                className="text-primary hover:text-primary"
              >
                {language === "ko" ? "신청하기" : "Apply"}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.div variants={staggerItem} className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {language === "ko" ? "나중에 둘러볼게요" : "I'll explore later"}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
