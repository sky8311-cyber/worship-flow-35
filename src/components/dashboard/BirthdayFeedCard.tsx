import { Cake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface BirthdayFeedCardProps {
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    birth_date: string;
  };
  community: {
    id: string;
    name: string;
  };
  onProfileClick?: (author: { id: string; full_name: string | null; avatar_url: string | null }) => void;
}

export const BirthdayFeedCard = ({ profile, community, onProfileClick }: BirthdayFeedCardProps) => {
  const { language } = useTranslation();
  
  const message = language === "ko"
    ? `${community.name} - ${profile.full_name}님의 생일이 이번 주입니다! 🎉`
    : `${community.name} - It's ${profile.full_name}'s birthday this week! 🎉`;

  return (
    <Card 
      className="p-6 hover:bg-accent/5 transition-colors cursor-pointer"
      onClick={() => onProfileClick?.({ 
        id: profile.id, 
        full_name: profile.full_name, 
        avatar_url: profile.avatar_url 
      })}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Cake className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{profile.full_name}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {new Date(profile.birth_date).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", { 
                month: "long", 
                day: "numeric" 
              })}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
