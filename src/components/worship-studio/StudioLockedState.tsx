import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus } from "lucide-react";
import { FriendRequestButton } from "@/components/worship-rooms/FriendRequestButton";

interface StudioLockedStateProps {
  ownerUserId: string;
  ownerName?: string;
}

export function StudioLockedState({ ownerUserId, ownerName }: StudioLockedStateProps) {
  const { language } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Lock className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {language === "ko" 
          ? "이 스튜디오는 친구에게만 공개됩니다." 
          : "This Studio is friends-only."}
      </h3>
      {ownerName && (
        <p className="text-muted-foreground mb-6">
          {language === "ko"
            ? `${ownerName}님과 친구가 되어 스튜디오를 구경하세요.`
            : `Become friends with ${ownerName} to view their Studio.`}
        </p>
      )}
      <FriendRequestButton targetUserId={ownerUserId} />
    </div>
  );
}
