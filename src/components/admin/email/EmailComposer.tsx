import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { Send, Eye, Users, Building2, Shield, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface Community {
  id: string;
  name: string;
}

type RecipientType = "all" | "role" | "community";

export const EmailComposer = () => {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(0);

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

  // Fetch communities
  const { data: communities = [] } = useQuery({
    queryKey: ["all-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Community[];
    },
  });

  // Get recipient count based on filter
  const { data: countData, refetch: refetchCount } = useQuery({
    queryKey: ["recipient-count", recipientType, selectedRole, selectedCommunityId],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id", { count: "exact", head: true });
      
      if (recipientType === "role" && selectedRole) {
        const { count } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", selectedRole as "admin" | "user" | "worship_leader");
        return count || 0;
      } else if (recipientType === "community" && selectedCommunityId) {
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", selectedCommunityId);
        return count || 0;
      } else {
        const { count } = await query;
        return count || 0;
      }
    },
    enabled: recipientType === "all" || (recipientType === "role" && !!selectedRole) || (recipientType === "community" && !!selectedCommunityId),
  });

  useEffect(() => {
    if (countData !== undefined) {
      setRecipientCount(countData);
    }
  }, [countData]);

  // Load template content when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setSubject(template.subject);
        setHtmlContent(template.html_content);
      }
    }
  }, [selectedTemplateId, templates]);

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
          recipientFilter: {
            type: recipientType,
            roleValue: recipientType === "role" ? selectedRole : undefined,
            communityId: recipientType === "community" ? selectedCommunityId : undefined,
          },
          testMode,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, testMode) => {
      if (testMode) {
        toast.success("Test email sent to your address");
      } else {
        toast.success(`Emails sent successfully! ${data.successCount} delivered, ${data.failureCount} failed`);
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
      toast.error("Please enter a subject");
      return;
    }
    if (!htmlContent.trim()) {
      toast.error("Please enter email content");
      return;
    }
    if (recipientType === "role" && !selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (recipientType === "community" && !selectedCommunityId) {
      toast.error("Please select a community");
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
      .replace(/\{\{content\}\}/g, "Sample email content here...");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Start from scratch</SelectItem>
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
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={htmlContent}
                onChange={setHtmlContent}
                placeholder="Compose your email content..."
              />
            </div>

            {/* Variable Help */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <code className="px-2 py-1 bg-background rounded">{"{{user_name}}"}</code>
                <code className="px-2 py-1 bg-background rounded">{"{{app_url}}"}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  All Users
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="role" id="role" />
                <Label htmlFor="role" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" />
                  By Role
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="community" id="community" />
                <Label htmlFor="community" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  By Community
                </Label>
              </div>
            </RadioGroup>

            {recipientType === "role" && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="worship_leader">Worship Leader</SelectItem>
                </SelectContent>
              </Select>
            )}

            {recipientType === "community" && (
              <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{recipientCount}</p>
              <p className="text-sm text-muted-foreground">Recipients</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Email
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
              Send Test Email
            </Button>
            <Button
              className="w-full"
              onClick={handleSendClick}
              disabled={sendEmailMutation.isPending || recipientCount === 0}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send to {recipientCount} Recipients
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Subject: {subject.replace(/\{\{(\w+)\}\}/g, "Sample Value")}
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
              Confirm Email Send
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>You are about to send an email to <strong>{recipientCount} recipients</strong>.</p>
                <p className="text-sm">
                  Estimated time: ~{Math.ceil(recipientCount / 50)} seconds
                </p>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
