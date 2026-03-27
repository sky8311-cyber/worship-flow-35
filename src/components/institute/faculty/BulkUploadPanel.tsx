import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Sparkles, Check, AlertCircle, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { AIContentPreview } from "./AIContentPreview";

type Step = "upload" | "generating" | "preview";

interface GeneratedData {
  pages: Array<{ title_ko: string; content_blocks: any[] }>;
  quiz?: {
    title_ko: string;
    questions: any[];
  } | null;
}

export const BulkUploadPanel = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["faculty-courses-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title, title_ko")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const extractTextFromFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    setFileName(file.name);

    if (ext === "txt" || ext === "md") {
      const text = await file.text();
      setExtractedText(text);
      return;
    }

    if (ext === "docx") {
      try {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setExtractedText(result.value);
      } catch (err) {
        toast.error("DOCX 파일 처리 실패");
        console.error(err);
      }
      return;
    }

    if (ext === "pdf") {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n\n";
        }
        setExtractedText(text);
      } catch (err) {
        toast.error("PDF 파일 처리 실패");
        console.error(err);
      }
      return;
    }

    toast.error(language === "ko" ? "지원하지 않는 파일 형식입니다" : "Unsupported file type");
  }, [language]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      extractTextFromFile(file);
    } else {
      toast.error(language === "ko" ? "10MB 이하 파일만 가능합니다" : "Max 10MB");
    }
  }, [extractTextFromFile, language]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      extractTextFromFile(file);
    } else if (file) {
      toast.error(language === "ko" ? "10MB 이하 파일만 가능합니다" : "Max 10MB");
    }
  }, [extractTextFromFile, language]);

  const handleGenerate = async () => {
    if (!extractedText.trim() || !selectedCourseId || !moduleTitle.trim()) {
      toast.error(language === "ko" ? "모든 필드를 입력해주세요" : "Please fill all fields");
      return;
    }

    setStep("generating");
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 90));
    }, 1500);

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session) throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      const token = refreshData.session.access_token;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 300000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/institute-generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_id: selectedCourseId,
            module_title_ko: moduleTitle,
            file_content: extractedText,
            generate_quiz: generateQuiz,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(fetchTimeout);

      const contentType = response.headers.get("Content-Type") || "";

      const readSSE = async () => {
        if (!response.body) throw new Error("스트림 응답이 없습니다.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let finished = false;
        let finalResult: any = null;

        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";

          for (const frame of frames) {
            const lines = frame.split("\n");
            let eventName = "message";
            const dataLines: string[] = [];

            for (const rawLine of lines) {
              const line = rawLine.trimEnd();
              if (!line) continue;
              if (line.startsWith(":")) continue; // comment / keepalive
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
            }

            if (dataLines.length === 0) continue;
            const dataStr = dataLines.join("\n");

            let payload: any;
            try {
              payload = JSON.parse(dataStr);
            } catch {
              payload = { raw: dataStr };
            }

            if (eventName === "delta") {
              // Use delta count to make progress feel real (caps at 95 until final result)
              setProgress((p) => Math.min(Math.max(p, 5) + 0.4, 95));
            }

            if (eventName === "error") {
              throw new Error(payload?.error || payload?.details || "AI 생성 실패");
            }

            if (eventName === "result") {
              finalResult = payload;
            }

            if (eventName === "done") {
              finished = true;
              break;
            }
          }
        }

        if (!finalResult) {
          throw new Error("SSE 스트림이 완료되었지만 결과가 없습니다.");
        }
        return finalResult;
      };

      let result: any;
      if (contentType.includes("text/event-stream")) {
        result = await readSSE();
      } else {
        result = await response.json();
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Generation failed");
      }

      setGeneratedData(result.data);
      setProgress(100);
      setTimeout(() => setStep("preview"), 500);
    } catch (err: any) {
      console.error("Generation error:", err);
      if (err.name === 'AbortError') {
        toast.error(language === "ko" ? "요청 시간이 초과되었습니다. 다시 시도해주세요." : "Request timed out. Please try again.");
      } else {
        toast.error(err.message || "AI 생성 실패");
      }
      setStep("upload");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleSaveToCourse = async () => {
    if (!generatedData || !selectedCourseId || !moduleTitle) return;

    setIsSaving(true);
    try {
      // Get current max sort_order for modules
      const { data: existingModules } = await supabase
        .from("institute_modules")
        .select("sort_order")
        .eq("course_id", selectedCourseId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSortOrder = (existingModules?.[0]?.sort_order ?? -1) + 1;

      // Create module
      const { data: newModule, error: moduleError } = await supabase
        .from("institute_modules")
        .insert({
          course_id: selectedCourseId,
          title: moduleTitle,
          title_ko: moduleTitle,
          sort_order: nextSortOrder,
          required_tier: 0,
        })
        .select("id")
        .single();

      if (moduleError) throw moduleError;

      // Create chapters
      const chaptersToInsert = generatedData.pages.map((page, idx) => ({
        module_id: newModule.id,
        title: page.title_ko,
        title_ko: page.title_ko,
        content_type: "blocks",
        content_blocks: page.content_blocks,
        sort_order: idx,
      }));

      const { error: chaptersError } = await supabase
        .from("institute_chapters")
        .insert(chaptersToInsert as any);

      if (chaptersError) throw chaptersError;

      // Create quiz if exists
      if (generatedData.quiz && generatedData.quiz.questions?.length > 0) {
        const { data: newQuiz, error: quizError } = await supabase
          .from("institute_quizzes")
          .insert({
            module_id: newModule.id,
            title_ko: generatedData.quiz.title_ko || `${moduleTitle} 퀴즈`,
            title: generatedData.quiz.title_ko || `${moduleTitle} Quiz`,
            is_published: true,
            pass_threshold: 70,
            max_attempts: 3,
            sort_order: 0,
          })
          .select("id")
          .single();

        if (quizError) throw quizError;

        const questionsToInsert = generatedData.quiz.questions.map((q: any, idx: number) => ({
          quiz_id: newQuiz.id,
          question_text: q.question_text || q.question_text_ko,
          question_text_ko: q.question_text_ko,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
          explanation_ko: q.explanation_ko || null,
          sort_order: idx,
        }));

        const { error: questionsError } = await supabase
          .from("institute_quiz_questions")
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      queryClient.invalidateQueries({ queryKey: ["faculty-courses"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-modules"] });

      toast.success(language === "ko"
        ? `모듈 "${moduleTitle}"이(가) 코스에 추가되었습니다!`
        : `Module "${moduleTitle}" added to course!`
      );

      // Reset
      setStep("upload");
      setExtractedText("");
      setFileName("");
      setModuleTitle("");
      setGeneratedData(null);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(language === "ko" ? "저장 실패" : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Upload step
  if (step === "upload") {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Drop zone */}
        {!extractedText ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {language === "ko" ? "파일을 끌어놓거나 클릭하세요" : "Drop a file or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, TXT, MD · {language === "ko" ? "최대 10MB" : "Max 10MB"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {extractedText.length.toLocaleString()} {language === "ko" ? "자" : "chars"}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setExtractedText(""); setFileName(""); }}
                >
                  {language === "ko" ? "다시 선택" : "Re-upload"}
                </Button>
              </div>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="min-h-[200px] text-xs font-mono"
                placeholder={language === "ko" ? "추출된 텍스트..." : "Extracted text..."}
              />
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        {extractedText && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {language === "ko" ? "대상 코스" : "Target Course"} *
              </label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "ko" ? "코스 선택" : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ko" ? c.title_ko : c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {language === "ko" ? "모듈 제목" : "Module Title"} *
              </label>
              <Input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder={language === "ko" ? "예: 예배 인도의 기초" : "e.g. Foundations of Worship Leading"}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="gen-quiz"
                checked={generateQuiz}
                onCheckedChange={(v) => setGenerateQuiz(!!v)}
              />
              <label htmlFor="gen-quiz" className="text-sm text-foreground cursor-pointer">
                {language === "ko" ? "퀴즈 자동 생성 (3-5문항)" : "Auto-generate quiz (3-5 questions)"}
              </label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!extractedText.trim() || !selectedCourseId || !moduleTitle.trim()}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {language === "ko" ? "AI로 강의 콘텐츠 생성" : "Generate Content with AI"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Generating step
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {language === "ko" ? "AI가 콘텐츠를 생성 중입니다..." : "AI is generating content..."}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {language === "ko"
            ? "강의 원고를 분석하고 학습 페이지와 퀴즈를 만들고 있습니다. 30-60초 정도 소요됩니다."
            : "Analyzing your manuscript and creating lesson pages and quiz. This takes 30-60 seconds."}
        </p>
        <Progress value={progress} className="w-full h-2" />
        <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</p>
      </div>
    );
  }

  // Preview step
  if (step === "preview" && generatedData) {
    return (
      <AIContentPreview
        data={generatedData}
        moduleTitle={moduleTitle}
        onSave={handleSaveToCourse}
        onBack={() => setStep("upload")}
        isSaving={isSaving}
      />
    );
  }

  return null;
};
