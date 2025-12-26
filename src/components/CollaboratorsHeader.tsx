import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Users, Info } from "lucide-react";
import { AddCollaboratorDialog } from "./AddCollaboratorDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CollaboratorsHeaderProps {
  serviceSetId: string | null;
  canManage: boolean;
  existingCollaborators?: string[];
}

export const CollaboratorsHeader = ({ 
  serviceSetId, 
  canManage,
}: CollaboratorsHeaderProps) => {
  const { t, language } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const { data: collaborators } = useQuery({
    queryKey: ["set-collaborators", serviceSetId],
    queryFn: async () => {
      if (!serviceSetId) return [];
      const { data: collabs, error } = await supabase
        .from("set_collaborators")
        .select("*")
        .eq("service_set_id", serviceSetId);
      if (error) throw error;
      
      if (!collabs || collabs.length === 0) return [];
      
      const userIds = collabs.map(c => c.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);
      if (profileError) throw profileError;
      
      return collabs.map(c => ({
        ...c,
        profiles: profiles?.find(p => p.id === c.user_id)
      }));
    },
    enabled: !!serviceSetId,
  });

  // For new sets (not yet saved)
  if (!serviceSetId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">
                {language === "ko" ? "저장 후 협업자 초대" : "Save to invite"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === "ko" 
              ? "세트를 먼저 저장하면 협업자를 초대할 수 있습니다" 
              : "Save the set first to invite collaborators"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const displayedCollaborators = collaborators?.slice(0, 3) || [];
  const remainingCount = (collaborators?.length || 0) - 3;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Collaborator avatars */}
        <div className="flex items-center -space-x-2">
          {displayedCollaborators.map((collab) => (
            <TooltipProvider key={collab.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-7 h-7 border-2 border-background cursor-pointer">
                    <AvatarImage src={collab.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {collab.profiles?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{collab.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`setBuilder.collaboratorRole.${collab.role}`)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          
          {remainingCount > 0 && (
            <Sheet open={showSheet} onOpenChange={setShowSheet}>
              <SheetTrigger asChild>
                <Avatar className="w-7 h-7 border-2 border-background cursor-pointer bg-muted">
                  <AvatarFallback className="text-xs">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t("setBuilder.collaborators")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  {collaborators?.map((collab) => (
                    <div key={collab.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={collab.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {collab.profiles?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{collab.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {collab.profiles?.email}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {t(`setBuilder.collaboratorRole.${collab.role}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
                {canManage && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      setShowSheet(false);
                      setShowAddDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("setBuilder.addCollaborator")}
                  </Button>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Add collaborator button */}
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("setBuilder.addCollaborator")}
            </span>
          </Button>
        )}

        {/* Show sheet trigger when there are collaborators but user can't manage */}
        {!canManage && collaborators && collaborators.length > 0 && (
          <Sheet open={showSheet} onOpenChange={setShowSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Users className="w-3 h-3 mr-1" />
                {collaborators.length}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t("setBuilder.collaborators")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={collab.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {collab.profiles?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{collab.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {collab.profiles?.email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {t(`setBuilder.collaboratorRole.${collab.role}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Empty state indicator for non-managers */}
        {!canManage && (!collaborators || collaborators.length === 0) && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {language === "ko" ? "협업자 없음" : "No collaborators"}
          </span>
        )}
      </div>

      {canManage && serviceSetId && (
        <AddCollaboratorDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          serviceSetId={serviceSetId}
          existingCollaborators={collaborators?.map(c => c.user_id) || []}
        />
      )}
    </>
  );
};
