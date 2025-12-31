import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Music, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";

interface WLWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchName?: string;
}

export function WLWelcomeDialog({ open, onOpenChange, churchName }: WLWelcomeDialogProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);

  const handleCreateCommunity = () => {
    onOpenChange(false);
    setShowCreateCommunity(true);
  };

  const handleCreateSet = () => {
    onOpenChange(false);
    navigate("/set-builder");
  };

  const handleGoToDashboard = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              {language === "ko" ? "🎉 환영합니다, 예배인도자님!" : "🎉 Welcome, Worship Leader!"}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {language === "ko" 
                ? "예배인도자로 승급되셨습니다. 이제 예배세트를 만들고 팀과 함께 예배를 준비할 수 있습니다."
                : "You've been approved as a worship leader. You can now create worship sets and prepare worship with your team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              {language === "ko" ? "다음 단계" : "Next Steps"}
            </h4>
            
            {/* Step 1: Create Community */}
            <button
              onClick={handleCreateCommunity}
              className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {language === "ko" ? "1. 예배공동체 만들기" : "1. Create Your Worship Community"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {language === "ko" 
                      ? churchName 
                        ? `"${churchName}" 공동체를 만들어보세요` 
                        : "팀원들과 함께 예배를 준비하세요"
                      : churchName 
                        ? `Create "${churchName}" community`
                        : "Prepare worship with your team members"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            {/* Step 2: Create First Set */}
            <button
              onClick={handleCreateSet}
              className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {language === "ko" ? "2. 첫 번째 워십세트 만들기" : "2. Create Your First Worship Set"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {language === "ko" 
                      ? "예배 순서와 곡 목록을 구성하세요"
                      : "Organize your worship order and song list"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={handleGoToDashboard}>
              {language === "ko" ? "나중에 하기" : "Maybe Later"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateCommunityDialog 
        open={showCreateCommunity} 
        onOpenChange={setShowCreateCommunity}
        defaultName={churchName}
      />
    </>
  );
}
