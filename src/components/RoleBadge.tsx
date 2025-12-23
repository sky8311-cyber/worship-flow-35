import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Star, User, Music } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export type RoleType = 
  | "admin" 
  | "community_owner" 
  | "worship_leader" 
  | "community_leader" 
  | "member";

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

export const RoleBadge = ({ role, className = "" }: RoleBadgeProps) => {
  const { t } = useTranslation();

  switch (role) {
    case "admin":
      return (
        <Badge variant="destructive" className={`text-xs ${className}`}>
          <Shield className="w-3 h-3 mr-1" />
          {t("roles.admin")}
        </Badge>
      );
    case "community_owner":
      return (
        <Badge className={`text-xs bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 hover:bg-orange-500/20 ${className}`}>
          <Crown className="w-3 h-3 mr-1" />
          {t("roles.communityOwner")}
        </Badge>
      );
    case "worship_leader":
      return (
        <Badge className={`text-xs bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/20 ${className}`}>
          <Star className="w-3 h-3 mr-1" />
          {t("roles.worshipLeader")}
        </Badge>
      );
    case "community_leader":
      return (
        <Badge className={`text-xs bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 hover:bg-purple-500/20 ${className}`}>
          <Music className="w-3 h-3 mr-1" />
          {t("roles.communityLeader")}
        </Badge>
      );
    case "member":
    default:
      return (
        <Badge variant="outline" className={`text-xs ${className}`}>
          <User className="w-3 h-3 mr-1" />
          {t("roles.member")}
        </Badge>
      );
  }
};

// Helper to get a simple icon for a role (without badge wrapper)
export const getRoleIcon = (role: RoleType) => {
  switch (role) {
    case "admin":
      return <Shield className="w-3 h-3" />;
    case "community_owner":
      return <Crown className="w-3 h-3" />;
    case "worship_leader":
      return <Star className="w-3 h-3" />;
    case "community_leader":
      return <Music className="w-3 h-3" />;
    case "member":
    default:
      return <User className="w-3 h-3" />;
  }
};
