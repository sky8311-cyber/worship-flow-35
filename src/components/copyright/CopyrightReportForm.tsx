import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CopyrightReportFormProps {
  contentId: string;
  contentType?: string;
  onSuccess?: () => void;
}

export const CopyrightReportForm = ({ contentId, contentType = "song_score", onSuccess }: CopyrightReportFormProps) => {
  const { language } = useTranslation();
  const isKo = language === "ko";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reporter_email: "",
    reporter_name: "",
    reason: "",
    evidence_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reporter_email || !form.reason) {
      toast.error(isKo ? "이메일과 사유를 입력해주세요." : "Please provide your email and reason.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("copyright_reports").insert({
        reporter_email: form.reporter_email.trim(),
        reporter_name: form.reporter_name.trim() || null,
        content_id: contentId,
        content_type: contentType,
        reason: form.reason.trim(),
        evidence_url: form.evidence_url.trim() || null,
        status: "submitted",
      });

      if (error) throw error;

      toast.success(isKo ? "신고가 접수되었습니다." : "Report submitted successfully.");
      setForm({ reporter_email: "", reporter_name: "", reason: "", evidence_url: "" });
      onSuccess?.();
    } catch (err) {
      console.error("Copyright report error:", err);
      toast.error(isKo ? "신고 제출 중 오류가 발생했습니다." : "Error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>{isKo ? "이메일 *" : "Email *"}</Label>
        <Input
          type="email"
          required
          value={form.reporter_email}
          onChange={(e) => setForm({ ...form, reporter_email: e.target.value })}
          placeholder="email@example.com"
          maxLength={255}
        />
      </div>
      <div>
        <Label>{isKo ? "이름" : "Name"}</Label>
        <Input
          value={form.reporter_name}
          onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
          maxLength={100}
        />
      </div>
      <div>
        <Label>{isKo ? "사유 *" : "Reason *"}</Label>
        <Textarea
          required
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder={isKo ? "침해 내용을 설명해주세요" : "Describe the infringement"}
          maxLength={2000}
          rows={4}
        />
      </div>
      <div>
        <Label>{isKo ? "증거 URL" : "Evidence URL"}</Label>
        <Input
          type="url"
          value={form.evidence_url}
          onChange={(e) => setForm({ ...form, evidence_url: e.target.value })}
          placeholder="https://..."
          maxLength={500}
        />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
        {isKo ? "신고 제출" : "Submit Report"}
      </Button>
    </form>
  );
};
