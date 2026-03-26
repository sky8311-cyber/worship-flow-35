import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Check, FileText, HelpCircle, Eye } from "lucide-react";
import { BlockRenderer } from "../BlockRenderer";

interface AIContentPreviewProps {
  data: {
    pages: Array<{ title_ko: string; content_blocks: any[] }>;
    quiz?: { title_ko: string; questions: any[] } | null;
  };
  moduleTitle: string;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export const AIContentPreview = ({ data, moduleTitle, onSave, onBack, isSaving }: AIContentPreviewProps) => {
  const { language } = useTranslation();
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  const pages = data.pages || [];
  const quiz = data.quiz;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {language === "ko" ? "뒤로" : "Back"}
          </Button>
          <div>
            <h3 className="text-sm font-bold text-foreground">{moduleTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {pages.length} {language === "ko" ? "페이지" : "pages"}
              {quiz?.questions?.length ? ` · ${quiz.questions.length} ${language === "ko" ? "퀴즈 문항" : "quiz questions"}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={onSave} disabled={isSaving}>
          <Check className="w-4 h-4 mr-1.5" />
          {isSaving
            ? (language === "ko" ? "저장 중..." : "Saving...")
            : (language === "ko" ? "코스에 추가" : "Add to Course")}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Left: page list */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {pages.map((page, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedPageIdx(idx); setShowQuiz(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !showQuiz && selectedPageIdx === idx
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{page.title_ko || `Page ${idx + 1}`}</span>
              </div>
            </button>
          ))}

          {quiz && quiz.questions?.length > 0 && (
            <>
              <hr className="my-2 border-border" />
              <button
                onClick={() => setShowQuiz(true)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  showQuiz
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{language === "ko" ? "퀴즈 미리보기" : "Quiz Preview"}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {quiz.questions.length}
                  </Badge>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Right: content preview */}
        <Card className="flex-1 min-w-0">
          <CardContent className="p-6">
            <ScrollArea className="h-[500px]">
              {!showQuiz && pages[selectedPageIdx] ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {language === "ko" ? "학생 화면 미리보기" : "Student view preview"}
                    </span>
                  </div>
                  <BlockRenderer blocks={pages[selectedPageIdx].content_blocks || []} />
                </div>
              ) : showQuiz && quiz ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold">{quiz.title_ko}</h3>
                  {quiz.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-3">
                      <p className="text-sm font-semibold">
                        {qIdx + 1}. {q.question_text_ko}
                      </p>
                      <div className="space-y-2 pl-4">
                        {(q.options || []).map((opt: any, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                              oIdx === q.correct_answer_index
                                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                : "bg-muted/50"
                            }`}
                          >
                            <span className="font-medium text-xs w-5">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt.text_ko || opt.text}</span>
                            {oIdx === q.correct_answer_index && (
                              <Check className="w-3.5 h-3.5 text-green-600 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation_ko && (
                        <p className="text-xs text-muted-foreground pl-4 italic">
                          💡 {q.explanation_ko}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  {language === "ko" ? "페이지를 선택하세요" : "Select a page"}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
