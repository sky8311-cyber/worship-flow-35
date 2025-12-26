import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Eye, Music, Clock } from "lucide-react";
import { getComponentLabel, WorshipComponentType } from "@/lib/worshipComponents";

interface TemplateSelectorProps {
  communityId?: string;
  onSelectTemplate: (template: any) => void;
}

interface TemplateComponent {
  id: string;
  component_type: string;
  label: string;
  position: number;
  duration_minutes: number | null;
  notes: string | null;
  default_content: string | null;
  default_assigned_to: string | null;
}

interface Template {
  id: string;
  name: string;
  service_name: string | null;
  template_components?: TemplateComponent[];
}

export const TemplateSelector = ({ communityId, onSelectTemplate }: TemplateSelectorProps) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["worship-templates", user?.id, communityId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("worship_set_templates")
        .select("*")
        .order("name", { ascending: true });
      
      // Filter by community if provided, or show user's own templates
      if (communityId) {
        query = query.or(`community_id.eq.${communityId},created_by.eq.${user.id}`);
      } else {
        query = query.eq("created_by", user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const fetchTemplateWithComponents = async (templateId: string): Promise<Template | null> => {
    const { data, error } = await supabase
      .from("worship_set_templates")
      .select(`
        *,
        template_components(*)
      `)
      .eq("id", templateId)
      .single();
    
    if (error) return null;
    return data as Template;
  };

  const handleSelect = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplateId("");
      setSelectedTemplate(null);
      return;
    }
    setSelectedTemplateId(templateId);
    setSelectedTemplate(null);
  };

  const handlePreview = async () => {
    if (!selectedTemplateId) return;
    
    setIsLoading(true);
    const template = await fetchTemplateWithComponents(selectedTemplateId);
    if (template) {
      setSelectedTemplate(template);
      setShowPreview(true);
    }
    setIsLoading(false);
  };

  const handleLoad = async () => {
    if (!selectedTemplateId) return;
    
    setIsLoading(true);
    const template = await fetchTemplateWithComponents(selectedTemplateId);
    if (template) {
      onSelectTemplate(template);
      setSelectedTemplateId("");
      setSelectedTemplate(null);
    }
    setIsLoading(false);
  };

  const handleLoadFromPreview = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setShowPreview(false);
      setSelectedTemplateId("");
      setSelectedTemplate(null);
    }
  };

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          {language === "ko" ? "템플릿 선택" : "Select Template"}
        </Label>
        <div className="flex gap-2">
          <Select value={selectedTemplateId} onValueChange={handleSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={language === "ko" ? "템플릿을 선택하세요" : "Select a template"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {language === "ko" ? "템플릿 없이 시작" : "Start without template"}
              </SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTemplateId && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePreview}
                disabled={isLoading}
                title={language === "ko" ? "미리보기" : "Preview"}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={handleLoad}
                disabled={isLoading}
                title={language === "ko" ? "불러오기" : "Load"}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.service_name || (language === "ko" ? "템플릿 미리보기" : "Template Preview")}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {selectedTemplate?.template_components && selectedTemplate.template_components.length > 0 ? (
                [...selectedTemplate.template_components]
                  .sort((a, b) => a.position - b.position)
                  .map((comp, index) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Music className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-medium">
                            {getComponentLabel(comp.component_type as WorshipComponentType, language as "en" | "ko")}
                          </span>
                        </div>
                        {comp.label !== comp.component_type && (
                          <p className="text-xs text-muted-foreground mt-0.5">{comp.label}</p>
                        )}
                      </div>
                      {comp.duration_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {comp.duration_minutes}분
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "ko" ? "템플릿에 컴포넌트가 없습니다" : "No components in template"}
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button onClick={handleLoadFromPreview}>
              <Download className="w-4 h-4 mr-2" />
              {language === "ko" ? "불러오기" : "Load Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
