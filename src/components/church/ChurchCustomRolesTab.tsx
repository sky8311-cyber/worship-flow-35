import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, Loader2, Pencil, Trash2, GripVertical, 
  Church, Music, Volume2, Mic, Guitar, Monitor, User, Users, 
  BookOpen, Heart, Star, Sparkles, Camera, Laptop
} from "lucide-react";

interface CustomRole {
  id: string;
  church_account_id: string;
  name: string;
  name_ko: string | null;
  description: string | null;
  color: string;
  icon: string;
  position: number;
}

interface ChurchCustomRolesTabProps {
  churchAccountId: string;
  isAdmin: boolean;
}

const ICON_OPTIONS = [
  { value: "user", label: "User", icon: User },
  { value: "users", label: "Users", icon: Users },
  { value: "church", label: "Church", icon: Church },
  { value: "music", label: "Music", icon: Music },
  { value: "volume-2", label: "Sound", icon: Volume2 },
  { value: "mic", label: "Microphone", icon: Mic },
  { value: "guitar", label: "Guitar", icon: Guitar },
  { value: "monitor", label: "Monitor", icon: Monitor },
  { value: "book-open", label: "Book", icon: BookOpen },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "star", label: "Star", icon: Star },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
  { value: "camera", label: "Camera", icon: Camera },
  { value: "laptop", label: "Laptop", icon: Laptop },
];

const COLOR_OPTIONS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899",
  "#6366f1", "#14b8a6", "#84cc16", "#f97316", "#dc2626", "#a855f7",
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption?.icon || User;
};

export function ChurchCustomRolesTab({ churchAccountId, isAdmin }: ChurchCustomRolesTabProps) {
  const { language } = useLanguageContext();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [nameKo, setNameKo] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("user");

  // Fetch custom roles
  const { data: roles, isLoading } = useQuery({
    queryKey: ["church-custom-roles", churchAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_custom_roles")
        .select("*")
        .eq("church_account_id", churchAccountId)
        .order("position", { ascending: true });
      
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingRole) {
        const { error } = await supabase
          .from("church_custom_roles")
          .update({
            name,
            name_ko: nameKo || null,
            description: description || null,
            color,
            icon,
          })
          .eq("id", editingRole.id);
        if (error) throw error;
      } else {
        const maxPosition = roles?.length ? Math.max(...roles.map(r => r.position)) + 1 : 1;
        const { error } = await supabase
          .from("church_custom_roles")
          .insert({
            church_account_id: churchAccountId,
            name,
            name_ko: nameKo || null,
            description: description || null,
            color,
            icon,
            position: maxPosition,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        editingRole 
          ? (language === "ko" ? "역할이 수정되었습니다" : "Role updated")
          : (language === "ko" ? "역할이 추가되었습니다" : "Role added")
      );
      queryClient.invalidateQueries({ queryKey: ["church-custom-roles", churchAccountId] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error(language === "ko" ? "이미 존재하는 역할입니다" : "Role already exists");
      } else {
        toast.error(language === "ko" ? "저장 실패" : "Failed to save");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("church_custom_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 삭제되었습니다" : "Role deleted");
      queryClient.invalidateQueries({ queryKey: ["church-custom-roles", churchAccountId] });
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Failed to delete");
    },
  });

  const handleOpenDialog = (role?: CustomRole) => {
    if (role) {
      setEditingRole(role);
      setName(role.name);
      setNameKo(role.name_ko || "");
      setDescription(role.description || "");
      setColor(role.color);
      setIcon(role.icon);
    } else {
      setEditingRole(null);
      setName("");
      setNameKo("");
      setDescription("");
      setColor("#3b82f6");
      setIcon("user");
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRole(null);
    setName("");
    setNameKo("");
    setDescription("");
    setColor("#3b82f6");
    setIcon("user");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{language === "ko" ? "커스텀 역할" : "Custom Roles"}</CardTitle>
            <CardDescription>
              {language === "ko"
                ? "교회 팀원들에게 지정할 수 있는 역할 레이블을 관리합니다."
                : "Manage role labels that can be assigned to church team members."}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              {language === "ko" ? "역할 추가" : "Add Role"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !roles?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{language === "ko" ? "아직 역할이 없습니다" : "No roles defined yet"}</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4 gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                {language === "ko" ? "첫 역할 추가" : "Add First Role"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role) => {
              const IconComponent = getIconComponent(role.icon);
              return (
                <div
                  key={role.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: role.color }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.name_ko && (
                        <Badge variant="outline" className="text-xs">
                          {role.name_ko}
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {role.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {language === "ko" ? "역할 삭제" : "Delete Role"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === "ko"
                                ? `"${role.name}" 역할을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                                : `Are you sure you want to delete "${role.name}"? This action cannot be undone.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === "ko" ? "취소" : "Cancel"}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(role.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {language === "ko" ? "삭제" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRole
                  ? (language === "ko" ? "역할 수정" : "Edit Role")
                  : (language === "ko" ? "새 역할 추가" : "Add New Role")}
              </DialogTitle>
              <DialogDescription>
                {language === "ko"
                  ? "팀원에게 지정할 역할 정보를 입력하세요."
                  : "Enter role information for team members."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {language === "ko" ? "역할명 (영어)" : "Role Name (English)"} *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sound Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameKo">
                    {language === "ko" ? "역할명 (한국어)" : "Role Name (Korean)"}
                  </Label>
                  <Input
                    id="nameKo"
                    value={nameKo}
                    onChange={(e) => setNameKo(e.target.value)}
                    placeholder="예: 음향담당"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {language === "ko" ? "설명" : "Description"}
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "ko" ? "역할에 대한 간단한 설명" : "Brief description of the role"}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "ko" ? "아이콘" : "Icon"}</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIcon(opt.value)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
                          icon === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "ko" ? "색상" : "Color"}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-2">
                  {language === "ko" ? "미리보기" : "Preview"}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: color }}
                  >
                    {(() => {
                      const IconComp = getIconComponent(icon);
                      return <IconComp className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{name || "Role Name"}</span>
                      {nameKo && (
                        <Badge variant="outline" className="text-xs">
                          {nameKo}
                        </Badge>
                      )}
                    </div>
                    {description && (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  {language === "ko" ? "취소" : "Cancel"}
                </Button>
                <Button type="submit" disabled={!name || saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRole
                    ? (language === "ko" ? "수정" : "Update")
                    : (language === "ko" ? "추가" : "Add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
