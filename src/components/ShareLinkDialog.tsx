import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Link, Globe, Users, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  publicShareToken: string | null;
  publicShareEnabled: boolean;
  onUpdate: () => void;
}

export const ShareLinkDialog = ({
  open,
  onOpenChange,
  setId,
  publicShareToken,
  publicShareEnabled,
  onUpdate,
}: ShareLinkDialogProps) => {
  const { t, language } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedTeam, setCopiedTeam] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  
  // Local state for immediate UI updates
  const [localEnabled, setLocalEnabled] = useState(publicShareEnabled);
  const [localToken, setLocalToken] = useState(publicShareToken);

  // Sync with props when dialog opens or props change
  useEffect(() => {
    setLocalEnabled(publicShareEnabled);
    setLocalToken(publicShareToken);
  }, [publicShareEnabled, publicShareToken, open]);

  const teamLink = `${window.location.origin}/band-view/${setId}`;
  
  // Public share link using the public-view route
  const publicLink = localToken 
    ? `${window.location.origin}/public-view/${localToken}` 
    : null;

  const handleCopyTeamLink = async () => {
    await navigator.clipboard.writeText(teamLink);
    setCopiedTeam(true);
    toast.success(language === "ko" ? "팀 링크가 복사되었습니다" : "Team link copied");
    setTimeout(() => setCopiedTeam(false), 2000);
  };

  const handleCopyPublicLink = async () => {
    if (publicLink) {
      await navigator.clipboard.writeText(publicLink);
      setCopiedPublic(true);
      toast.success(language === "ko" ? "공개 링크가 복사되었습니다" : "Public link copied");
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  const generateToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleTogglePublicLink = async (enabled: boolean) => {
    // Immediately update UI
    setLocalEnabled(enabled);
    setIsUpdating(true);
    
    try {
      const updates: Record<string, any> = { public_share_enabled: enabled };
      
      // Generate token if enabling for the first time
      if (enabled && !localToken) {
        const newToken = generateToken();
        updates.public_share_token = newToken;
        setLocalToken(newToken);
      }

      const { error } = await supabase
        .from("service_sets")
        .update(updates as any)
        .eq("id", setId);

      if (error) throw error;
      
      toast.success(
        enabled 
          ? (language === "ko" ? "공개 링크가 활성화되었습니다" : "Public link enabled")
          : (language === "ko" ? "공개 링크가 비활성화되었습니다" : "Public link disabled")
      );
      onUpdate();
    } catch (error) {
      // Rollback on error
      setLocalEnabled(!enabled);
      console.error("Error updating public share:", error);
      toast.error(language === "ko" ? "오류가 발생했습니다" : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateToken = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("service_sets")
        .update({ public_share_token: generateToken() } as any)
        .eq("id", setId);

      if (error) throw error;
      
      toast.success(language === "ko" ? "새로운 링크가 생성되었습니다" : "New link generated");
      onUpdate();
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error(language === "ko" ? "오류가 발생했습니다" : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            {language === "ko" ? "링크 공유" : "Share Link"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "팀원 또는 외부인과 예배세트를 공유하세요"
              : "Share your worship set with team members or external viewers"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Team Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="font-semibold">
                {language === "ko" ? "팀 링크" : "Team Link"}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ko" 
                ? "로그인한 팀원만 접근할 수 있습니다"
                : "Only authenticated team members can access"
              }
            </p>
            <div className="flex gap-2">
              <Input 
                value={teamLink} 
                readOnly 
                className="text-sm font-mono"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyTeamLink}
              >
                {copiedTeam ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="border-t" />

          {/* Public Link Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <Label className="font-semibold">
                  {language === "ko" ? "공개 링크" : "Public Link"}
                </Label>
              </div>
              <Switch
                checked={localEnabled}
                onCheckedChange={handleTogglePublicLink}
                disabled={isUpdating}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ko" 
                ? "로그인 없이 누구나 볼 수 있는 읽기 전용 링크입니다"
                : "Anyone can view without login (read-only)"
              }
            </p>

            {localEnabled && publicLink && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={publicLink} 
                    readOnly 
                    className="text-sm font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyPublicLink}
                  >
                    {copiedPublic ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={handleRegenerateToken}
                    disabled={isUpdating}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {language === "ko" ? "새 링크 생성" : "Regenerate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => window.open(publicLink, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {language === "ko" ? "미리보기" : "Preview"}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {language === "ko" 
                    ? "⚠️ 새 링크를 생성하면 기존 링크는 더 이상 작동하지 않습니다"
                    : "⚠️ Regenerating will invalidate the old link"
                  }
                </p>
              </div>
            )}

            {!localEnabled && (
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {language === "ko" 
                    ? "공개 링크를 활성화하면 외부인과 공유할 수 있습니다"
                    : "Enable to share with external viewers"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
