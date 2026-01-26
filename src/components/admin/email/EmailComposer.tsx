import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { Send, Eye, Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { RecipientSelector, RecipientFilter } from "./RecipientSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  variables: unknown;
}

export const EmailComposer = () => {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({
    type: "segment",
    rpcFunction: "get_users_by_platform_tier",
    rpcParam: "all",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [excludedEmails, setExcludedEmails] = useState<string[]>([]);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  // Get recipient count based on filter
  const { data: countData, refetch: refetchCount } = useQuery({
    queryKey: ["recipient-count", recipientFilter],
    queryFn: async () => {
      // Manual emails - count is handled directly from the filter
      if (recipientFilter.type === "manual") {
        return recipientFilter.manualEmails?.length || 0;
      }
      if (recipientFilter.type === "segment" && recipientFilter.rpcFunction && recipientFilter.rpcParam) {
        let data: any[] = [];
        if (recipientFilter.rpcFunction === "get_users_by_platform_tier") {
          const result = await supabase.rpc("get_users_by_platform_tier", { tier_type: recipientFilter.rpcParam });
          data = result.data || [];
        } else if (recipientFilter.rpcFunction === "get_users_by_community_status") {
          const result = await supabase.rpc("get_users_by_community_status", { status_type: recipientFilter.rpcParam });
          data = result.data || [];
        } else if (recipientFilter.rpcFunction === "get_users_by_activity_status") {
          const result = await supabase.rpc("get_users_by_activity_status", { activity_type: recipientFilter.rpcParam });
          data = result.data || [];
        }
        return data.length;
      } else if (recipientFilter.type === "specific_community" && recipientFilter.communityId) {
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", recipientFilter.communityId);
        return count || 0;
      }
      return 0;
    },
    enabled: !!(
      (recipientFilter.type === "manual" && recipientFilter.manualEmails?.length) ||
      (recipientFilter.type === "segment" && recipientFilter.rpcFunction) ||
      (recipientFilter.type === "specific_community" && recipientFilter.communityId)
    ),
  });

  useEffect(() => {
    if (countData !== undefined) {
      setRecipientCount(countData);
    }
  }, [countData]);

  // Load template content when selected
  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== "scratch") {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setSubject(template.subject);
        setHtmlContent(template.html_content);
      }
    } else if (selectedTemplateId === "scratch") {
      setSubject("");
      setHtmlContent("");
    }
  }, [selectedTemplateId, templates]);

  // Handle filter change with useCallback to prevent infinite loops
  const handleFilterChange = useCallback((filter: RecipientFilter) => {
    setRecipientFilter(filter);
  }, []);

  // Effective recipient count after exclusions
  const effectiveRecipientCount = recipientCount - excludedEmails.length;

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (testMode: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-admin-email", {
        body: {
          templateId: selectedTemplateId || undefined,
          subject,
          htmlContent,
          recipientFilter,
          excludedEmails,
          testMode,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, testMode) => {
      if (testMode) {
        toast.success(t("adminEmail.composer.testEmailSent"));
      } else {
        toast.success(t("adminEmail.composer.emailsSentSuccess", { success: data.successCount, failed: data.failureCount }));
        queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      }
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send emails");
    },
  });

  const handleSendClick = () => {
    if (!subject.trim()) {
      toast.error(t("adminEmail.composer.pleaseEnterSubject"));
      return;
    }
    if (!htmlContent.trim()) {
      toast.error(t("adminEmail.composer.pleaseEnterContent"));
      return;
    }
    if (effectiveRecipientCount === 0) {
      toast.error(language === "ko" ? "수신자가 없습니다" : "No recipients selected");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = () => {
    sendEmailMutation.mutate(false);
  };

  const handleTestSend = () => {
    sendEmailMutation.mutate(true);
  };

  const getPreviewHtml = () => {
    return htmlContent
      .replace(/\{\{user_name\}\}/g, "John Doe")
      .replace(/\{\{app_url\}\}/g, "https://kworship.app")
      .replace(/\{\{subject\}\}/g, subject)
      .replace(/\{\{content\}\}/g, "Sample email content here...")
      .replace(/\{\{community_name\}\}/g, "Sample Community")
      .replace(/\{\{inviter_name\}\}/g, "Jane Smith")
      .replace(/\{\{invite_link\}\}/g, "https://kworship.app/invite/sample")
      .replace(/\{\{referral_link\}\}/g, "https://kworship.app/referral/sample");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("adminEmail.composer.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>{t("adminEmail.composer.templateOptional")}</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminEmail.composer.selectTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scratch">{t("adminEmail.composer.startFromScratch")}</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">{t("adminEmail.composer.subject")}</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("adminEmail.composer.subjectPlaceholder")}
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>{t("adminEmail.composer.content")}</Label>
              <RichTextEditor
                content={htmlContent}
                onChange={setHtmlContent}
                placeholder={t("adminEmail.composer.contentPlaceholder")}
              />
            </div>

            {/* Variable Help */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">{t("adminEmail.composer.availableVariables")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <code className="px-2 py-1 bg-background rounded">{"{{user_name}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{app_url}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{community_name}}"}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Recipients - New Segment Selector */}
        <RecipientSelector 
          value={recipientFilter}
          onChange={handleFilterChange}
          recipientCount={recipientCount}
          excludedEmails={excludedEmails}
          onExcludedEmailsChange={setExcludedEmails}
        />

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("adminEmail.composer.previewEmail")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestSend}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t("adminEmail.composer.sendTestEmail")}
            </Button>
            <Button
              className="w-full"
              onClick={handleSendClick}
              disabled={sendEmailMutation.isPending || effectiveRecipientCount === 0}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t("adminEmail.composer.sendToRecipients", { count: effectiveRecipientCount })}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("adminEmail.composer.previewTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminEmail.composer.subject")}: {subject.replace(/\{\{(\w+)\}\}/g, t("adminEmail.composer.sampleValue"))}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t("adminEmail.composer.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("adminEmail.composer.confirmMessage", { count: effectiveRecipientCount })}</p>
                {excludedEmails.length > 0 && (
                  <p className="text-sm text-amber-600">
                    {language === "ko" 
                      ? `${excludedEmails.length}명이 발송 대상에서 제외되었습니다.`
                      : `${excludedEmails.length} recipient(s) have been excluded.`}
                  </p>
                )}
                <p className="text-sm">
                  {t("adminEmail.composer.estimatedTime", { seconds: Math.ceil(effectiveRecipientCount / 50) })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("adminEmail.composer.cannotUndo")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t("adminEmail.composer.sendNow")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};