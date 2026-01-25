import { useTranslation } from "@/hooks/useTranslation";
import { useCreateStudio } from "@/hooks/useCreateStudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Palette, BookOpen, Users, Music } from "lucide-react";

interface StudioContractPromptProps {
  onLater?: () => void;
  onCreated?: () => void;
}

export function StudioContractPrompt({ onLater, onCreated }: StudioContractPromptProps) {
  const { t, language } = useTranslation();
  const createStudio = useCreateStudio();
  
  const handleCreate = () => {
    createStudio.mutate(undefined, {
      onSuccess: () => {
        onCreated?.();
      },
    });
  };
  
  const features = [
    { icon: BookOpen, text: language === "ko" ? "기도, 묵상, 간증 기록하기" : "Record prayers, reflections, and testimonies" },
    { icon: Users, text: language === "ko" ? "친구들과 나눔하기" : "Share with friends" },
    { icon: Music, text: language === "ko" ? "BGM으로 분위기 만들기" : "Set the mood with BGM" },
  ];
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {language === "ko" 
              ? "나만의 예배공작소를 열어보세요" 
              : "Open your own Worship Studio"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {language === "ko"
              ? "예배는 삶입니다. 공작소는 그 삶이 쌓이는 곳입니다."
              : "Worship is a life. The Studio is where it accumulates."}
          </p>
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
              : (language === "ko" ? "예, 스튜디오를 오픈합니다" : "Yes, open my Studio")}
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
