import { useState } from "react";
import { Lock, Link2, Copy, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";

interface PrivateShareControlsProps {
  serviceSetId: string;
  hasPrivate: boolean;
  visibility: "public" | "team" | "link" | string | null | undefined;
  shareToken: string | null | undefined;
}

export const PrivateShareControls = ({
  serviceSetId,
  hasPrivate,
  visibility,
  shareToken,
}: PrivateShareControlsProps) => {
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!hasPrivate) return null;

  const isLinkMode = visibility === "link";

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/band-view/${serviceSetId}?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success(language === "ko" ? "공유 링크가 복사되었습니다" : "Share link copied");
  };

  const handleCreateOrCopyLink = async () => {
    setLoading(true);
    try {
      let token = shareToken;
      const updates: Record<string, any> = { band_view_visibility: "link" };
      if (!token) {
        // Should already exist from migration default, but just in case
        const { data, error } = await supabase
          .from("service_sets")
          .select("share_token")
          .eq("id", serviceSetId)
          .maybeSingle();
        if (error) throw error;
        token = (data as any)?.share_token;
      }

      const { error } = await supabase
        .from("service_sets")
        .update(updates)
        .eq("id", serviceSetId);
      if (error) throw error;

      if (token) copyLink(token);
      queryClient.invalidateQueries({ queryKey: ["service-set", serviceSetId] });
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToTeam = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("service_sets")
        .update({ band_view_visibility: "team" })
        .eq("id", serviceSetId);
      if (error) throw error;
      toast.success(language === "ko" ? "비공개(팀 전용)로 변경되었습니다" : "Reverted to team-only");
      queryClient.invalidateQueries({ queryKey: ["service-set", serviceSetId] });
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="gap-1">
        <Lock className="w-3 h-3" />
        {isLinkMode
          ? language === "ko" ? "공유 링크 활성" : "Share link active"
          : language === "ko" ? "비공개 (팀 전용)" : "Private (team only)"}
      </Badge>

      {!isLinkMode ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={handleCreateOrCopyLink}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          <span className="text-xs sm:text-sm">
            {language === "ko" ? "공유 링크 생성" : "Create share link"}
          </span>
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => shareToken && copyLink(shareToken)}
            disabled={!shareToken || loading}
          >
            <Copy className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              {language === "ko" ? "공유 링크 다시 복사" : "Copy share link"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={handleRevertToTeam}
            disabled={loading}
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              {language === "ko" ? "비공개로 되돌리기" : "Revert to private"}
            </span>
          </Button>
        </>
      )}
    </div>
  );
};
