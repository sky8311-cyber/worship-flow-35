import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { AddCollaboratorDialog } from "./AddCollaboratorDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface SetCollaboratorsProps {
  serviceSetId: string;
  createdBy: string;
  currentUserId: string;
}

export const SetCollaborators = ({ serviceSetId, createdBy, currentUserId }: SetCollaboratorsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: collaborators } = useQuery({
    queryKey: ["set-collaborators", serviceSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_collaborators")
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq("service_set_id", serviceSetId);
      if (error) throw error;
      return data;
    },
    enabled: !!serviceSetId,
  });

  const removeMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("set_collaborators")
        .delete()
        .eq("id", collaboratorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-collaborators"] });
      toast({ title: t("setBuilder.collaboratorRemoved") });
    },
    onError: () => {
      toast({
        title: t("setBuilder.collaboratorError"),
        variant: "destructive",
      });
    },
  });

  const isCreator = createdBy === currentUserId;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{t("setBuilder.collaborators")}</CardTitle>
        {isCreator && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("setBuilder.addCollaborator")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!collaborators || collaborators.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("setBuilder.noCollaborators")}
          </p>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{collaborator.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {collaborator.profiles?.email}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t(`setBuilder.collaboratorRole.${collaborator.role}`)}
                  </Badge>
                </div>
                {isCreator && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("setBuilder.removeCollaborator")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this collaborator?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMutation.mutate(collaborator.id)}
                        >
                          {t("common.remove")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isCreator && (
        <AddCollaboratorDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          serviceSetId={serviceSetId}
          existingCollaborators={collaborators?.map(c => c.user_id) || []}
        />
      )}
    </Card>
  );
};
