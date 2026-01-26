import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Eye, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailSenderSettings {
  id: string;
  sender_name: string;
  sender_title: string | null;
  signature_html: string | null;
  auto_append_signature: boolean;
}

export const EmailSettings = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  
  const [senderName, setSenderName] = useState("Kworship");
  const [senderTitle, setSenderTitle] = useState("");
  const [signatureHtml, setSignatureHtml] = useState("");
  const [autoAppend, setAutoAppend] = useState(true);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-sender-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sender_settings")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as EmailSenderSettings | null;
    },
  });

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setSenderName(settings.sender_name || "Kworship");
      setSenderTitle(settings.sender_title || "");
      setSignatureHtml(settings.signature_html || "");
      setAutoAppend(settings.auto_append_signature ?? true);
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existingData } = await supabase
        .from("email_sender_settings")
        .select("id")
        .single();

      if (existingData) {
        const { error } = await supabase
          .from("email_sender_settings")
          .update({
            sender_name: senderName,
            sender_title: senderTitle || null,
            signature_html: signatureHtml || null,
            auto_append_signature: autoAppend,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_sender_settings")
          .insert({
            sender_name: senderName,
            sender_title: senderTitle || null,
            signature_html: signatureHtml || null,
            auto_append_signature: autoAppend,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "설정이 저장되었습니다" : "Settings saved");
      queryClient.invalidateQueries({ queryKey: ["email-sender-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const handleSave = () => {
    if (!senderName.trim()) {
      toast.error(language === "ko" ? "발신자 이름을 입력해주세요" : "Please enter sender name");
      return;
    }
    saveMutation.mutate();
  };

  const defaultSignature = `<p style="margin-top: 24px; color: #666;">
${language === "ko" ? "감사합니다" : "Thank you"},<br>
<strong>${senderName}</strong>${senderTitle ? `<br><span style="color: #888;">${senderTitle}</span>` : ""}
</p>
<p style="font-size: 12px; color: #888;">
📧 hello@kworship.app<br>
🌐 https://kworship.app
</p>`;

  const handleUseDefaultSignature = () => {
    setSignatureHtml(defaultSignature);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "ko" ? "📧 발신자 정보" : "📧 Sender Information"}
          </CardTitle>
          <CardDescription>
            {language === "ko" 
              ? "수신자에게 표시될 발신자 이름과 직함을 설정합니다"
              : "Set the sender name and title displayed to recipients"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">
              {language === "ko" ? "발신자 이름 *" : "Sender Name *"}
            </Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="David Kim"
            />
            <p className="text-xs text-muted-foreground">
              {language === "ko" 
                ? `수신자에게 "${senderName} <noreply@kworship.app>"로 표시됩니다`
                : `Recipients will see "${senderName} <noreply@kworship.app>"`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderTitle">
              {language === "ko" ? "발신자 직함/소개" : "Sender Title"}
            </Label>
            <Input
              id="senderTitle"
              value={senderTitle}
              onChange={(e) => setSenderTitle(e.target.value)}
              placeholder={language === "ko" ? "Kworship 대표" : "Kworship Founder"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "ko" ? "✍️ 이메일 서명" : "✍️ Email Signature"}
          </CardTitle>
          <CardDescription>
            {language === "ko"
              ? "모든 발송 이메일 하단에 추가될 서명입니다 (HTML 지원)"
              : "Signature appended to all outgoing emails (HTML supported)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="signature">
                {language === "ko" ? "서명 HTML" : "Signature HTML"}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseDefaultSignature}
              >
                {language === "ko" ? "기본 서명 사용" : "Use Default"}
              </Button>
            </div>
            <Textarea
              id="signature"
              value={signatureHtml}
              onChange={(e) => setSignatureHtml(e.target.value)}
              placeholder={language === "ko" ? "HTML 서명을 입력하세요..." : "Enter HTML signature..."}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoAppend">
                {language === "ko" ? "자동 서명 추가" : "Auto-append Signature"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === "ko"
                  ? "모든 이메일에 서명을 자동으로 추가합니다"
                  : "Automatically append signature to all emails"}
              </p>
            </div>
            <Switch
              id="autoAppend"
              checked={autoAppend}
              onCheckedChange={setAutoAppend}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {language === "ko" ? "서명 미리보기" : "Preview Signature"}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {language === "ko" ? "설정 저장" : "Save Settings"}
      </Button>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "ko" ? "서명 미리보기" : "Signature Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ko" 
                ? "이메일 본문 아래에 다음과 같이 표시됩니다:"
                : "This will appear below your email content:"}
            </p>
            <hr className="my-4" />
            <div dangerouslySetInnerHTML={{ __html: signatureHtml || defaultSignature }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
