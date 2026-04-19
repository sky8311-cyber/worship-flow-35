import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Link as LinkIcon, Globe, Users, RefreshCw, ExternalLink, Lock, Undo2, Loader2 } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
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
  // New private-share props (optional for backward compatibility with other callers)
  hasPrivateScores?: boolean;
  bandViewVisibility?: "public" | "team" | "link" | string;
  privateShareToken?: string | null;
}

export const ShareLinkDialog = ({
  open,
  onOpenChange,
  setId,
  publicShareToken,
  publicShareEnabled,
  onUpdate,
  hasPrivateScores = false,
  bandViewVisibility = "public",
  privateShareToken = null,
}: ShareLinkDialogProps) => {
  const { language } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedTeam, setCopiedTeam] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [privateBusy, setPrivateBusy] = useState(false);

  const [localEnabled, setLocalEnabled] = useState(publicShareEnabled);
  const [localToken, setLocalToken] = useState(publicShareToken);

  useEffect(() => {
    setLocalEnabled(publicShareEnabled);
    setLocalToken(publicShareToken);
  }, [publicShareEnabled, publicShareToken, open]);

  const teamLink = `${window.location.origin}/band-view/${setId}`;
  const publicLink = localToken ? `${window.location.origin}/public-view/${localToken}` : null;
  const privateLink = privateShareToken
    ? `${window.location.origin}/band-view/${setId}?token=${privateShareToken}`
    : null;
  const isPrivateLinkMode = bandViewVisibility === "link";

  const copy = async (text: string, setter: (v: boolean) => void, msg: string) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    toast.success(msg);
    setTimeout(() => setter(false), 2000);
  };

  const handleCopyTeamLink = () =>
    copy(teamLink, setCopiedTeam, language === "ko" ? "팀 링크가 복사되었습니다" : "Team link copied");
  const handleCopyPublicLink = () =>
    publicLink && copy(publicLink, setCopiedPublic, language === "ko" ? "공개 링크가 복사되었습니다" : "Public link copied");
  const handleCopyPrivateLink = () =>
    privateLink && copy(privateLink, setCopiedPrivate, language === "ko" ? "공유 링크가 복사되었습니다" : "Share link copied");

  const generateToken = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  };

  const handleTogglePublicLink = async (enabled: boolean) => {
    setLocalEnabled(enabled);
    setIsUpdating(true);
    try {
      const updates: Record<string, any> = { public_share_enabled: enabled };
      if (enabled && !localToken) {
        const newToken = generateToken();
        updates.public_share_token = newToken;
        setLocalToken(newToken);
      }
      const { error } = await supabase.from("service_sets").update(updates as any).eq("id", setId);
      if (error) throw error;
      toast.success(
        enabled
          ? language === "ko" ? "공개 링크가 활성화되었습니다" : "Public link enabled"
          : language === "ko" ? "공개 링크가 비활성화되었습니다" : "Public link disabled",
      );
      onUpdate();
    } catch (error) {
      setLocalEnabled(!enabled);
      console.error(error);
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
      console.error(error);
      toast.error(language === "ko" ? "오류가 발생했습니다" : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnablePrivateLink = async () => {
    setPrivateBusy(true);
    try {
      const updates: Record<string, any> = { band_view_visibility: "link" };
      const { error } = await supabase.from("service_sets").update(updates).eq("id", setId);
      if (error) throw error;
      toast.success(language === "ko" ? "공유 링크가 활성화되었습니다" : "Share link activated");
      onUpdate();
      // Copy if token already exists
      if (privateShareToken) {
        await navigator.clipboard.writeText(
          `${window.location.origin}/band-view/${setId}?token=${privateShareToken}`,
        );
        toast.success(language === "ko" ? "링크가 복사되었습니다" : "Link copied");
      }
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setPrivateBusy(false);
    }
  };

  const handleRevertPrivateToTeam = async () => {
    setPrivateBusy(true);
    try {
      const { error } = await supabase
        .from("service_sets")
        .update({ band_view_visibility: "team" })
        .eq("id", setId);
      if (error) throw error;
      toast.success(language === "ko" ? "비공개(팀 전용)로 변경되었습니다" : "Reverted to team-only");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setPrivateBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            {language === "ko" ? "링크 공유" : "Share Link"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? "팀원 또는 외부인과 예배세트를 공유하세요"
              : "Share your worship set with team members or external viewers"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Private scores notice */}
          {hasPrivateScores && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <Label className="font-semibold">
                  {language === "ko" ? "비공개 악보 포함" : "Contains Private Scores"}
                </Label>
                <Badge variant="secondary" className="ml-auto">
                  {isPrivateLinkMode
                    ? language === "ko" ? "공유 링크 활성" : "Share link active"
                    : language === "ko" ? "팀 전용" : "Team only"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ko"
                  ? "이 세트에는 업로드한 비공개 악보가 포함되어 있어 공개 링크로는 표시되지 않습니다. 외부 공유가 필요하면 아래 전용 공유 링크를 사용하세요."
                  : "This set contains uploaded private scores that won't appear on the public link. Use the dedicated share link below for external sharing."}
              </p>

              {!isPrivateLinkMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleEnablePrivateLink}
                  disabled={privateBusy}
                >
                  {privateBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  {language === "ko" ? "공유 링크 생성 (비공개 악보 포함)" : "Create share link (with private scores)"}
                </Button>
              ) : (
                <div className="space-y-2">
                  {privateLink && (
                    <div className="flex gap-2">
                      <Input value={privateLink} readOnly className="text-sm font-mono" />
                      <Button variant="outline" size="icon" onClick={handleCopyPrivateLink}>
                        {copiedPrivate ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={handleRevertPrivateToTeam}
                    disabled={privateBusy}
                  >
                    <Undo2 className="w-4 h-4" />
                    {language === "ko" ? "비공개로 되돌리기" : "Revert to private"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Team Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="font-semibold">{language === "ko" ? "팀 링크" : "Team Link"}</Label>
              <HelpTooltip
                text={language === "ko" ? "로그인한 팀원만 접근 가능한 내부 링크입니다" : "Internal link accessible only to logged-in team members"}
                helpLink="/help#share"
                side="right"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ko" ? "로그인한 팀원만 접근할 수 있습니다" : "Only authenticated team members can access"}
            </p>
            <div className="flex gap-2">
              <Input value={teamLink} readOnly className="text-sm font-mono" />
              <Button variant="outline" size="icon" onClick={handleCopyTeamLink}>
                {copiedTeam ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="border-t" />

          {/* Public Link Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <Label className="font-semibold">{language === "ko" ? "공개 링크" : "Public Link"}</Label>
                <HelpTooltip
                  text={language === "ko" ? "로그인 없이 누구나 볼 수 있는 외부 공유 링크입니다" : "External share link viewable by anyone without login"}
                  helpLink="/help#share"
                  side="right"
                />
              </div>
              <Switch checked={localEnabled} onCheckedChange={handleTogglePublicLink} disabled={isUpdating} />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ko" ? "로그인 없이 누구나 볼 수 있는 읽기 전용 링크입니다" : "Anyone can view without login (read-only)"}
            </p>

            {localEnabled && publicLink && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={publicLink} readOnly className="text-sm font-mono" />
                  <Button variant="outline" size="icon" onClick={handleCopyPublicLink}>
                    {copiedPublic ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleRegenerateToken} disabled={isUpdating}>
                    <RefreshCw className="w-3 h-3" />
                    {language === "ko" ? "새 링크 생성" : "Regenerate"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => window.open(publicLink, "_blank")}>
                    <ExternalLink className="w-3 h-3" />
                    {language === "ko" ? "미리보기" : "Preview"}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {language === "ko"
                    ? "⚠️ 새 링크를 생성하면 기존 링크는 더 이상 작동하지 않습니다"
                    : "⚠️ Regenerating will invalidate the old link"}
                </p>
              </div>
            )}

            {!localEnabled && (
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {language === "ko"
                    ? "공개 링크를 활성화하면 외부인과 공유할 수 있습니다"
                    : "Enable to share with external viewers"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
