import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AddCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceSetId: string;
  existingCollaborators: string[];
}

export const AddCollaboratorDialog = ({
  open,
  onOpenChange,
  serviceSetId,
  existingCollaborators,
}: AddCollaboratorDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [searchQuery, setSearchQuery] = useState("");

  // Get the community ID from the service set
  const { data: serviceSet } = useQuery({
    queryKey: ["service-set", serviceSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("community_id")
        .eq("id", serviceSetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceSetId,
  });

  // Get community members excluding existing collaborators and current user
  const { data: members, isLoading } = useQuery({
    queryKey: ["community-members-for-collab", serviceSet?.community_id, searchQuery],
    queryFn: async () => {
      if (!serviceSet?.community_id) return [];
      
      let query = supabase
        .from("community_members")
        .select(`
          user_id,
          profiles:user_id(id, full_name, email)
        `)
        .eq("community_id", serviceSet.community_id)
        .neq("user_id", user?.id);

      const { data, error } = await query;
      if (error) throw error;

      // Filter out existing collaborators
      const filtered = data.filter(
        (m) => !existingCollaborators.includes(m.user_id)
      );

      // Apply search filter
      if (searchQuery) {
        return filtered.filter((m) => {
          const name = m.profiles?.full_name?.toLowerCase() || "";
          const email = m.profiles?.email?.toLowerCase() || "";
          const query = searchQuery.toLowerCase();
          return name.includes(query) || email.includes(query);
        });
      }

      return filtered;
    },
    enabled: !!serviceSet?.community_id && open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("set_collaborators").insert({
        service_set_id: serviceSetId,
        user_id: selectedUserId,
        role: role,
        invited_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-collaborators"] });
      toast({ title: t("setBuilder.collaboratorAdded") });
      onOpenChange(false);
      setSelectedUserId("");
      setRole("editor");
      setSearchQuery("");
    },
    onError: () => {
      toast({
        title: t("setBuilder.collaboratorError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      addMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("setBuilder.addCollaborator")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("setBuilder.selectCollaborator")}</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t("setBuilder.selectCollaborator")} />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                ) : members && members.length > 0 ? (
                  members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div>
                        <p className="font-medium">{member.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No members available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("setBuilder.selectRole")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">
                  {t("setBuilder.collaboratorRole.editor")}
                </SelectItem>
                <SelectItem value="viewer">
                  {t("setBuilder.collaboratorRole.viewer")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!selectedUserId || addMutation.isPending}>
              {t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
