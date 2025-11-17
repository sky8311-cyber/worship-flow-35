import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCommunityDialog = ({ open, onOpenChange }: CreateCommunityDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("worship_communities")
        .insert({
          name: formData.name,
          description: formData.description,
          leader_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      toast.success(t("community.createDialog.success"));
      setFormData({ name: "", description: "" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(t("community.createDialog.error"));
      console.error("Error creating community:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("community.createDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("community.createDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("community.createDialog.nameLabel")}</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("community.createDialog.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("community.createDialog.descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("community.createDialog.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("community.createDialog.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("common.loading") : t("community.createDialog.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
