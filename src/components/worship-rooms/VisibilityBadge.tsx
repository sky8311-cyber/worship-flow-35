import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, Globe } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RoomVisibility = Database["public"]["Enums"]["room_visibility"];

interface VisibilityBadgeProps {
  visibility: RoomVisibility;
  size?: "sm" | "default";
}

const visibilityConfig = {
  private: { 
    icon: Lock, 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
  },
  friends: { 
    icon: Users, 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
  },
  public: { 
    icon: Globe, 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
  },
};

export function VisibilityBadge({ visibility, size = "default" }: VisibilityBadgeProps) {
  const { t } = useTranslation();
  const config = visibilityConfig[visibility];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={config.color}>
      <Icon className={size === "sm" ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1.5"} />
      {t(`rooms.visibility.${visibility}`)}
    </Badge>
  );
}
