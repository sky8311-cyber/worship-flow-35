import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Eye, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  html_content: string;
  variables: unknown;
  is_system: boolean;
  is_active: boolean;
}

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
  isReadOnly?: boolean;
}

export const TemplateEditorDialog = ({
  open,
  onOpenChange,
  template,
  isReadOnly = false,
}: TemplateEditorDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("edit");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSlug(template.slug);
      setCategory(template.category);
      setSubject(template.subject);
      setHtmlContent(template.html_content);
    } else {
      setName("");
      setSlug("");
      setCategory("general");
      setSubject("");
      setHtmlContent("");
    }
  }, [template]);

  // Generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!template) {
      setSlug(value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from("email_templates")
          .update({
            name,
            slug,
            category,
            subject,
            html_content: htmlContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", template.id);
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase.from("email_templates").insert({
          name,
          slug,
          category,
          subject,
          html_content: htmlContent,
          is_system: false,
          is_active: true,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(template ? t("adminEmail.editor.templateUpdated") : t("adminEmail.editor.templateCreated"));
      queryClient.invalidateQueries({ queryKey: ["email-templates-all"] });
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("adminEmail.editor.saveFailed"));
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("adminEmail.editor.pleaseEnterName"));
      return;
    }
    if (!slug.trim()) {
      toast.error(t("adminEmail.editor.pleaseEnterSlug"));
      return;
    }
    if (!subject.trim()) {
      toast.error(t("adminEmail.editor.pleaseEnterSubject"));
      return;
    }
    if (!htmlContent.trim()) {
      toast.error(t("adminEmail.editor.pleaseEnterContent"));
      return;
    }
    saveMutation.mutate();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {template 
              ? (isReadOnly ? t("adminEmail.editor.viewTemplate") : t("adminEmail.editor.editTemplate")) 
              : t("adminEmail.editor.createTemplate")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit">
              {isReadOnly ? t("adminEmail.templates.view") : t("adminEmail.templates.edit")}
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("adminEmail.editor.templateName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Welcome Email"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t("adminEmail.editor.slug")}</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="welcome-email"
                  disabled={isReadOnly || !!template}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("adminEmail.editor.category")}</Label>
                <Select value={category} onValueChange={setCategory} disabled={isReadOnly || template?.is_system}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {template?.is_system && <SelectItem value="system">{t("adminEmail.editor.categorySystem")}</SelectItem>}
                    <SelectItem value="general">{t("adminEmail.editor.categoryGeneral")}</SelectItem>
                    <SelectItem value="invitation">{t("adminEmail.editor.categoryInvitation")}</SelectItem>
                    <SelectItem value="announcement">{t("adminEmail.editor.categoryAnnouncement")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t("adminEmail.editor.subjectLine")}</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Welcome to KWorship!"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("adminEmail.editor.emailContent")}</Label>
              {isReadOnly ? (
                <div className="border rounded-lg p-4 bg-muted/50 max-h-[300px] overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">{htmlContent}</pre>
                </div>
              ) : (
                <RichTextEditor
                  content={htmlContent}
                  onChange={setHtmlContent}
                  placeholder={t("adminEmail.editor.contentPlaceholder")}
                />
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">{t("adminEmail.editor.availableVariables")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <code className="px-2 py-1 bg-background rounded">{"{{user_name}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{app_url}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{community_name}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{inviter_name}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{invite_link}}"}</code>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg bg-white">
              <div className="p-4 border-b bg-muted/30">
                <p className="text-sm">
                  <strong>{t("adminEmail.composer.subject")}:</strong> {subject.replace(/\{\{(\w+)\}\}/g, t("adminEmail.composer.sampleValue"))}
                </p>
              </div>
              <div className="p-4">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isReadOnly ? t("common.close") : t("common.cancel")}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {template ? t("adminEmail.editor.updateTemplate") : t("adminEmail.editor.createTemplate")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
