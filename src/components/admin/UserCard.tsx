import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ShieldOff, Mic, MicOff, KeyRound, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface UserCardProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    user_roles?: { role: string }[];
  };
  onAddRole: (userId: string, role: string) => void;
  onRemoveRole: (userId: string, role: string) => void;
  onResetPassword: (email: string, userName: string) => void;
  onDelete: (userId: string, userName: string) => void;
  onToggleSelection?: (userId: string) => void;
  isSelected?: boolean;
}

export function UserCard({ 
  user, 
  onAddRole, 
  onRemoveRole, 
  onResetPassword, 
  onDelete,
  onToggleSelection,
  isSelected 
}: UserCardProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  
  const userRoles = user.user_roles?.map(r => r.role) || [];
  const hasAdmin = userRoles.includes("admin");
  const hasWorshipLeader = userRoles.includes("worship_leader");
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "worship_leader":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {onToggleSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(user.id)}
                className="cursor-pointer mt-1"
              />
            )}
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.full_name || "-"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {t("admin.users.joined")}: {format(new Date(user.created_at), "PP", { locale: dateLocale })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {userRoles.map((role: string) => (
            <Badge key={role} variant={getRoleBadgeVariant(role)}>
              {role}
            </Badge>
          ))}
        </div>

        <TooltipProvider>
          <div className="flex gap-2 flex-wrap">
            {/* Admin Role Buttons */}
            {!hasAdmin ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddRole(user.id, "admin")}
                    className="flex-1 sm:flex-initial"
                  >
                    <Shield className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.addAdmin")}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveRole(user.id, "admin")}
                    className="flex-1 sm:flex-initial"
                  >
                    <ShieldOff className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.removeAdmin")}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Worship Leader Role Buttons */}
            {!hasWorshipLeader ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddRole(user.id, "worship_leader")}
                    className="flex-1 sm:flex-initial"
                  >
                    <Mic className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Leader</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.addWorshipLeader")}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveRole(user.id, "worship_leader")}
                    className="flex-1 sm:flex-initial"
                  >
                    <MicOff className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Leader</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.removeWorshipLeader")}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Reset Password Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResetPassword(user.email, user.full_name || user.email)}
                  className="flex-1 sm:flex-initial"
                >
                  <KeyRound className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("admin.users.resetPassword")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>{t("tooltips.resetPassword")}</p>
              </TooltipContent>
            </Tooltip>

            {/* Delete Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(user.id, user.full_name || user.email)}
                  className="flex-1 sm:flex-initial"
                >
                  <Trash2 className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("admin.users.delete")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>{t("tooltips.deleteUser")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
