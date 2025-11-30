import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, GripVertical, Trash2 } from "lucide-react";
import { getComponentLabel, WorshipComponentType } from "@/lib/worshipComponents";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    service_name: string | null;
    worship_leader: string | null;
    band_name: string | null;
    theme: string | null;
    scripture_reference: string | null;
    target_audience: string | null;
    worship_duration: number | null;
    notes: string | null;
    template_components: Array<{
      id: string;
      component_type: string;
      label: string;
      position: number;
      duration_minutes: number | null;
      notes: string | null;
      default_assigned_to: string | null;
      default_content: string | null;
    }>;
  };
}

export const EditTemplateDialog = ({
  open,
  onOpenChange,
  template,
}: EditTemplateDialogProps) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState(template.name);
  const [serviceName, setServiceName] = useState(template.service_name || "");
  const [worshipLeader, setWorshipLeader] = useState(template.worship_leader || "");
  const [bandName, setBandName] = useState(template.band_name || "");
  const [theme, setTheme] = useState(template.theme || "");
  const [scriptureReference, setScriptureReference] = useState(template.scripture_reference || "");
  const [targetAudience, setTargetAudience] = useState(template.target_audience || "");
  const [worshipDuration, setWorshipDuration] = useState(template.worship_duration?.toString() || "");
  const [notes, setNotes] = useState(template.notes || "");
  const [components, setComponents] = useState(
    [...template.template_components].sort((a, b) => a.position - b.position)
  );

  useEffect(() => {
    setName(template.name);
    setServiceName(template.service_name || "");
    setWorshipLeader(template.worship_leader || "");
    setBandName(template.band_name || "");
    setTheme(template.theme || "");
    setScriptureReference(template.scripture_reference || "");
    setTargetAudience(template.target_audience || "");
    setWorshipDuration(template.worship_duration?.toString() || "");
    setNotes(template.notes || "");
    setComponents([...template.template_components].sort((a, b) => a.position - b.position));
  }, [template]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Update template
      const { error: templateError } = await supabase
        .from("worship_set_templates")
        .update({
          name,
          service_name: serviceName || null,
          worship_leader: worshipLeader || null,
          band_name: bandName || null,
          theme: theme || null,
          scripture_reference: scriptureReference || null,
          target_audience: targetAudience || null,
          worship_duration: worshipDuration ? parseInt(worshipDuration) : null,
          notes: notes || null,
        })
        .eq("id", template.id);

      if (templateError) throw templateError;

      // Delete removed components
      const currentIds = components.map(c => c.id);
      const originalIds = template.template_components.map(c => c.id);
      const deletedIds = originalIds.filter(id => !currentIds.includes(id));

      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("template_components")
          .delete()
          .in("id", deletedIds);
        if (deleteError) throw deleteError;
      }

      // Update existing components with new positions
      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        const { error: updateError } = await supabase
          .from("template_components")
          .update({ position: i + 1 })
          .eq("id", comp.id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "템플릿이 수정되었습니다" : "Template updated");
      queryClient.invalidateQueries({ queryKey: ["worship-templates"] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(language === "ko" ? "수정 실패" : "Update failed");
    },
  });

  const handleRemoveComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const handleMoveComponent = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= components.length) return;

    const newComponents = [...components];
    [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
    setComponents(newComponents);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "템플릿 수정" : "Edit Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "템플릿 이름" : "Template Name"} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ko" ? "예: 주일 1부 예배" : "e.g., Sunday Service"}
            />
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "예배 이름" : "Service Name"}</Label>
            <Input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder={language === "ko" ? "예: 주일 1부 예배" : "e.g., Sunday Morning Service"}
            />
          </div>

          {/* Two columns for leader and band */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{language === "ko" ? "예배인도자" : "Worship Leader"}</Label>
              <Input
                value={worshipLeader}
                onChange={(e) => setWorshipLeader(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ko" ? "팀멤버" : "Band"}</Label>
              <Input
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
              />
            </div>
          </div>

          {/* Theme and Scripture */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{language === "ko" ? "주제" : "Theme"}</Label>
              <Input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ko" ? "본문" : "Scripture"}</Label>
              <Input
                value={scriptureReference}
                onChange={(e) => setScriptureReference(e.target.value)}
              />
            </div>
          </div>

          {/* Target Audience and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{language === "ko" ? "대상" : "Audience"}</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ko" ? "시간 (분)" : "Duration (min)"}</Label>
              <Input
                type="number"
                value={worshipDuration}
                onChange={(e) => setWorshipDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "메모" : "Notes"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Components List */}
          {components.length > 0 && (
            <div className="space-y-2">
              <Label>{language === "ko" ? "컴포넌트" : "Components"}</Label>
              <div className="border rounded-lg divide-y">
                {components.map((comp, index) => (
                  <div
                    key={comp.id}
                    className="flex items-center gap-2 p-2 text-sm"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">
                      {getComponentLabel(comp.component_type as WorshipComponentType, language)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveComponent(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveComponent(index, "down")}
                        disabled={index === components.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemoveComponent(comp.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!name.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {language === "ko" ? "저장" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
