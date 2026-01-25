import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useFriendStatus, useSendFriendRequest, useRemoveFriend } from "@/hooks/useFriends";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FriendRequestButtonProps {
  targetUserId: string;
}

export function FriendRequestButton({ targetUserId }: FriendRequestButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: friendStatus, isLoading } = useFriendStatus(targetUserId);
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  
  // Don't show button for own profile
  if (user?.id === targetUserId) return null;
  
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock className="h-4 w-4 animate-pulse" />
      </Button>
    );
  }
  
  // Determine the current state
  if (!friendStatus) {
    // No relationship - show "Add Friend"
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => sendRequest.mutate(targetUserId)}
        disabled={sendRequest.isPending}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {t("studio.addFriend")}
      </Button>
    );
  }
  
  if (friendStatus.status === "pending") {
    // Pending request
    const isSender = friendStatus.requester_user_id === user?.id;
    
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock className="h-4 w-4 mr-2" />
        {isSender ? t("studio.requestPending") : t("studio.respondToRequest")}
      </Button>
    );
  }
  
  if (friendStatus.status === "accepted") {
    // Already friends - show dropdown with unfriend option
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <UserCheck className="h-4 w-4 mr-2" />
            {t("studio.friends")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => removeFriend.mutate(friendStatus.id)}
            className="text-destructive"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            {t("studio.removeFriend")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Declined - allow re-sending
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => sendRequest.mutate(targetUserId)}
      disabled={sendRequest.isPending}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      {t("studio.addFriend")}
    </Button>
  );
}
