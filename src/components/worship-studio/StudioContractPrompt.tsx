import { useTranslation } from "@/hooks/useTranslation";
import { useCreateStudio } from "@/hooks/useCreateStudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PenLine, BookOpen, Users, Music } from "lucide-react";

interface StudioContractPromptProps {
  onLater?: () => void;
  onCreated?: () => void;
}

export function StudioContractPrompt({ onLater, onCreated }: StudioContractPromptProps) {
  const { language } = useTranslation();
  const createStudio = useCreateStudio();
  
  const handleCreate = () => {
    createStudio.mutate(undefined, {
      onSuccess: () => {
        onCreated?.();
      },
    });
  };
  
  const features = [
    { icon: PenLine, text: language === "ko" ? "블록 에디터로 글 작성하기" : "Write posts with a block editor" },
    { icon: Music, text: language === "ko" ? "찬양곡과 예배셋 삽입하기" : "Embed songs and worship sets" },
    { icon: Users, text: language === "ko" ? "친구들과 나눔하기" : "Share with friends" },
  ];
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {language === "ko" 
              ? "나만의 예배공작소를 열어보세요" 
              : "Open your own Worship Studio"}
          </h2>
          <div className="text-muted-foreground mt-4 text-sm italic leading-relaxed">
            {language === "ko" ? (
              <>
                "예배는 무대가 아닌, 삶입니다.<br />
                삶이 예배가 될 때, 사역이 빚어집니다.<br />
                이 아틀리에는 그 여정이 기록되고 나눠지는 곳입니다."
              </>
            ) : (
              <>
                "Worship is not a stage, it is life.<br />
                As life becomes worship, ministry takes shape.<br />
                This Atelier is where that journey is written and shared."
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button 
            onClick={handleCreate} 
            className="w-full"
            disabled={createStudio.isPending}
          >
            {createStudio.isPending 
              ? (language === "ko" ? "생성 중..." : "Creating...")
              : (language === "ko" ? "예, 아틀리에를 오픈합니다" : "Yes, open my Atelier")}
          </Button>
          {onLater && (
            <Button variant="ghost" onClick={onLater} className="w-full">
              {language === "ko" ? "나중에" : "Later"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
