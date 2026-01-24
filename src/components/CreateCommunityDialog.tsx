import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { CheckCircle, UserPlus, Gift } from "lucide-react";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
}

export const CreateCommunityDialog = ({ open, onOpenChange, defaultName }: CreateCommunityDialogProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: defaultName || "",
    description: "",
  });
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const [newCommunityId, setNewCommunityId] = useState<string | null>(null);

  // Update form when defaultName changes
  useEffect(() => {
    if (defaultName && open) {
      setFormData(prev => ({ ...prev, name: defaultName }));
    }
  }, [defaultName, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowInvitePrompt(false);
      setNewCommunityId(null);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Create community
      const { data, error } = await supabase
        .from("worship_communities")
        .insert({
          name: formData.name,
          description: formData.description,
          leader_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner in community_members
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) {
        console.error("Failed to add owner membership:", memberError);
        // Don't throw - community was created successfully
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["user-communities"] });
      queryClient.invalidateQueries({ queryKey: ["wl-onboarding-community"] });
      setFormData({ name: "", description: "" });
      
      // Show invite prompt instead of closing immediately
      if (data?.id) {
        setNewCommunityId(data.id);
        setShowInvitePrompt(true);
      }
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

  const handleInviteTeam = () => {
    onOpenChange(false);
    if (newCommunityId) {
      navigate(`/community/${newCommunityId}/manage`);
    }
  };

  const handleLater = () => {
    toast.success(t("community.createDialog.success"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {showInvitePrompt ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <DialogTitle className="text-xl">
                {language === "ko" ? "예배공동체가 생성되었습니다!" : "Community Created!"}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {language === "ko" 
                  ? "이제 팀원들을 초대하여 함께 예배를 준비하세요."
                  : "Now invite your team members to prepare worship together."}
              </DialogDescription>
            </div>
            
            {/* Invite CTA with K-Seed reward */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {language === "ko" ? "팀원을 초대해보세요!" : "Invite your team!"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="h-4 w-4 text-primary" />
                <span>
                  {language === "ko" 
                    ? "팀원을 초대하면 30 K-Seed 보상을 받습니다"
                    : "Earn 30 K-Seeds for each team member"}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleLater}
              >
                {language === "ko" ? "나중에" : "Later"}
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={handleInviteTeam}
              >
                <UserPlus className="h-4 w-4" />
                {language === "ko" ? "팀원 초대하기" : "Invite Team"}
              </Button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
