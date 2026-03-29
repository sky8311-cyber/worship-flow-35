import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFriendStatus, useSendFriendRequest, useRemoveFriend } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NeighborActionHandlerProps {
  targetUserId?: string;
  targetName?: string;
  children: (props: {
    status: "none" | "pending" | "accepted" | null;
    onAction: () => void;
  }) => React.ReactNode;
}

export function NeighborActionHandler({ targetUserId, targetName, children }: NeighborActionHandlerProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { data: friendRecord } = useFriendStatus(targetUserId);
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const status: "none" | "pending" | "accepted" | null = (() => {
    if (!user || !targetUserId || user.id === targetUserId) return null;
    if (!friendRecord) return "none";
    if (friendRecord.status === "accepted") return "accepted";
    if (friendRecord.status === "pending") return "pending";
    return "none";
  })();

  const handleAction = () => {
    if (status === "none") {
      setShowConfirm(true);
    } else if (status === "pending") {
      setShowCancelConfirm(true);
    } else if (status === "accepted") {
      setShowRemoveConfirm(true);
    }
  };

  const handleSendRequest = () => {
    if (targetUserId) {
      sendRequest.mutate(targetUserId);
    }
    setShowConfirm(false);
  };

  const handleCancelRequest = () => {
    if (friendRecord) {
      removeFriend.mutate(friendRecord.id);
    }
    setShowCancelConfirm(false);
  };

  const handleRemoveFriend = () => {
    if (friendRecord) {
      removeFriend.mutate(friendRecord.id);
    }
    setShowRemoveConfirm(false);
  };

  const name = targetName || (language === "ko" ? "이 유저" : "this user");

  return (
    <>
      {children({ status, onAction: handleAction })}

      {/* Send request confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "이웃 신청" : "Add Neighbor"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? `${name}님에게 이웃 신청을 보내시겠습니까?\n\n상대편이 수락 시 맞추(상호 이웃)가 자동으로 이루어지며, 별도 동의 없이 서로 이웃이 됩니다.`
                : `Send a neighbor request to ${name}?\n\nWhen accepted, you will automatically become mutual neighbors without additional consent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendRequest}>
              {language === "ko" ? "신청 보내기" : "Send Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel pending request */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "이웃 신청 취소" : "Cancel Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? `${name}님에게 보낸 이웃 신청을 취소하시겠습니까?`
                : `Cancel the neighbor request sent to ${name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "돌아가기" : "Go Back"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "ko" ? "신청 취소" : "Cancel Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove neighbor */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "이웃 해제" : "Remove Neighbor"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? `${name}님과의 이웃 관계를 해제하시겠습니까?`
                : `Remove ${name} from your neighbors?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "ko" ? "해제" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
