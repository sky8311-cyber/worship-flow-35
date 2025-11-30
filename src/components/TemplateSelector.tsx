import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

interface TemplateSelectorProps {
  communityId?: string;
  onSelectTemplate: (template: any) => void;
}

export const TemplateSelector = ({ communityId, onSelectTemplate }: TemplateSelectorProps) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

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

  const handleSelect = async (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplateId("");
      return;
    }
    
    setSelectedTemplateId(templateId);
    
    // Fetch full template with components
    const { data: template, error } = await supabase
      .from("worship_set_templates")
      .select(`
        *,
        template_components(*)
      `)
      .eq("id", templateId)
      .single();
    
    if (!error && template) {
      onSelectTemplate(template);
    }
  };

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-center gap-1.5">
        <FileText className="w-4 h-4" />
        {language === "ko" ? "템플릿 선택" : "Select Template"}
      </Label>
      <Select value={selectedTemplateId} onValueChange={handleSelect}>
        <SelectTrigger>
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
    </div>
  );
};
