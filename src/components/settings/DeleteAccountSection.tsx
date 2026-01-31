import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2, ArrowRight, Users } from "lucide-react";

interface CommunityAction {
  communityId: string;
  communityName: string;
  action: "transfer" | "delete";
  newOwnerName?: string;
}

export const DeleteAccountSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useTranslation();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [communityActions, setCommunityActions] = useState<CommunityAction[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const CONFIRM_TEXT = language === "ko" ? "삭제합니다" : "delete";

  // Fetch preview of what will happen when account is deleted
  const fetchDeletePreview = async () => {
    if (!user) return;
    
    setPreviewLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/self-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ previewOnly: true }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch preview");
      }

      setCommunityActions(data.communityActions || []);
    } catch (error: any) {
      console.error("Error fetching delete preview:", error);
      toast.error(language === "ko" ? "정보를 불러오는데 실패했습니다" : "Failed to load account info");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle dialog open - fetch preview
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      setConfirmText("");
      fetchDeletePreview();
    }
  };

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/self-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ previewOnly: false }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      return data;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "계정이 삭제되었습니다" : "Account deleted successfully");
      // Sign out and redirect to landing
      supabase.auth.signOut().then(() => {
        navigate("/");
      });
    },
    onError: (error: any) => {
      toast.error(error.message || (language === "ko" ? "계정 삭제에 실패했습니다" : "Failed to delete account"));
    },
  });

  const handleDeleteAccount = () => {
    if (confirmText !== CONFIRM_TEXT) {
      toast.error(
        language === "ko" 
          ? `"${CONFIRM_TEXT}"를 정확히 입력해주세요` 
          : `Please type "${CONFIRM_TEXT}" exactly`
      );
      return;
    }
    deleteAccountMutation.mutate();
  };

  const isConfirmValid = confirmText === CONFIRM_TEXT;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {language === "ko" ? "계정 삭제" : "Delete Account"}
        </CardTitle>
        <CardDescription>
          {language === "ko" 
            ? "계정을 삭제하면 되돌릴 수 없습니다" 
            : "Once you delete your account, there is no going back"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2">
            <span>•</span>
            {language === "ko" ? "워십세트와 공개 곡은 유지됩니다" : "Worship sets and public songs will be preserved"}
          </p>
          <p className="flex items-center gap-2">
            <span>•</span>
            {language === "ko" ? "비공개 곡은 삭제됩니다" : "Private songs will be deleted"}
          </p>
          <p className="flex items-center gap-2">
            <span>•</span>
            {language === "ko" ? "커뮤니티 소유권은 자동으로 이전됩니다" : "Community ownership will be transferred automatically"}
          </p>
        </div>

        <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              {language === "ko" ? "계정 삭제" : "Delete Account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {language === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ko" 
                  ? "이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 개인 데이터가 영구적으로 삭제됩니다."
                  : "This action cannot be undone. All your personal data will be permanently deleted."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Community actions preview */}
            {previewLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : communityActions.length > 0 ? (
              <div className="space-y-2 py-2">
                <Label className="text-sm font-medium">
                  {language === "ko" ? "소유한 커뮤니티:" : "Owned Communities:"}
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {communityActions.map((action) => (
                    <div 
                      key={action.communityId}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        action.action === "delete" 
                          ? "bg-destructive/10 border border-destructive/20" 
                          : "bg-muted"
                      }`}
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="font-medium truncate">{action.communityName}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {action.action === "transfer" ? (
                        <span className="text-muted-foreground truncate">
                          {action.newOwnerName}
                          {language === "ko" ? "님에게 이전" : ""}
                        </span>
                      ) : (
                        <span className="text-destructive">
                          {language === "ko" ? "삭제 예정" : "Will be deleted"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Confirmation input */}
            <div className="space-y-2 py-2">
              <Label>
                {language === "ko" 
                  ? `확인을 위해 "${CONFIRM_TEXT}"를 입력하세요:` 
                  : `Type "${CONFIRM_TEXT}" to confirm:`}
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="font-mono"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteAccountMutation.isPending}>
                {language === "ko" ? "취소" : "Cancel"}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!isConfirmValid || deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ko" ? "삭제 중..." : "Deleting..."}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {language === "ko" ? "계정 삭제" : "Delete Account"}
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
