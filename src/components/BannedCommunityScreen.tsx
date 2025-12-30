import { Ban, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

const ADMIN_EMAIL = "support@kworship.app";

export function BannedCommunityScreen() {
  const { t, language } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          
          <h2 className="text-xl font-bold mb-3">
            {language === "ko" ? "커뮤니티가 비활성화되었습니다" : "Community Deactivated"}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {language === "ko" 
              ? "이 커뮤니티는 관리자에 의해 비활성화되었습니다. 문의사항이 있으시면 아래로 연락해주세요."
              : "This community has been deactivated by an administrator. Please contact us if you have any questions."}
          </p>
          
          <Button variant="outline" asChild>
            <a href={`mailto:${ADMIN_EMAIL}`} className="inline-flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {ADMIN_EMAIL}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
