import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Sparkles } from "lucide-react";

interface DemoSignupCTAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export const DemoSignupCTA = ({ open, onOpenChange, action }: DemoSignupCTAProps) => {
  const { t, language } = useTranslation();

  const title = language === "ko" ? "회원가입이 필요합니다" : "Sign up required";
  const description = language === "ko"
    ? `이 기능을 사용하려면 회원가입이 필요합니다. 가입하면 워십세트 만들기, 새 곡 추가, 참고 자료 관리 등 모든 기능을 이용할 수 있습니다.`
    : `Sign up to use this feature. Create worship sets, add songs, manage reference materials and more.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "계속 둘러보기" : "Keep browsing"}
          </Button>
          <Button asChild>
            <Link to="/signup">
              {language === "ko" ? "가입하기" : "Sign up"}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
