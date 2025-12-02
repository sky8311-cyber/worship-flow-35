import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

interface LevelUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
  levelName: string;
  emoji: string;
}

export const LevelUpDialog = ({
  open,
  onOpenChange,
  level,
  levelName,
  emoji
}: LevelUpDialogProps) => {
  const { t } = useTranslation();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        {open && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />}
        
        <div className="space-y-6 py-6">
          <div className="text-7xl animate-bounce">{emoji}</div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('seeds.levelUp')}
            </h2>
            <p className="text-xl font-semibold">
              {t('seeds.congratulations')}
            </p>
            <p className="text-lg text-muted-foreground">
              Level {level} ({levelName}) {t('seeds.youReached')}
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
