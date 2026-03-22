import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onClose: () => void;
  courseName: string;
  hasCert: boolean;
  language: string;
}

export function InstituteCompletionModal({ open, onClose, courseName, hasCert, language }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="max-w-[320px] w-full text-center relative overflow-hidden shadow-lg"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />

        <CardContent className="pt-9 pb-6 px-7">
          <div className="text-[44px] mb-4">🎓</div>
          <h2 className="text-xl font-bold text-foreground">
            {language === "ko" ? "수강 완료!" : "Course Complete!"}
          </h2>
          <div className="text-primary text-sm font-bold mt-2">
            {courseName}
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            {new Date().toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
          </div>

          {hasCert && (
            <div className="bg-muted rounded-lg p-3 mt-4 text-xs text-muted-foreground leading-relaxed">
              {language === "ko"
                ? "K-Worship Certified 배지 발급은 해당 자격증의 모든 과정을 완료한 후 신청할 수 있습니다."
                : "K-Worship Certified badge can be requested after completing all courses in the certification."}
            </div>
          )}

          <Button className="mt-4" onClick={onClose}>
            {language === "ko" ? "확인" : "OK"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
