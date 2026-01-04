import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share2, Mail, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

interface ShareReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareReferralDialog = ({ open, onOpenChange }: ShareReferralDialogProps) => {
  const { profile } = useAuth();
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch user's referral code
  const { data: referralCode } = useQuery({
    queryKey: ["my-referral-code", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", profile.id)
        .single();
      return data?.referral_code;
    },
    enabled: !!profile?.id && open,
  });

  const referralLink = referralCode ? `https://kworship.app/r/${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(language === "ko" ? "링크가 복사되었습니다" : "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === "ko" ? "복사 실패" : "Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (!referralLink || !navigator.share) return;
    
    try {
      await navigator.share({
        title: "K-Worship",
        text: language === "ko" 
          ? "K-Worship에서 함께 예배를 준비해요!" 
          : "Join me on K-Worship!",
        url: referralLink,
      });
    } catch (error) {
      // User cancelled or share failed
      console.log("Share cancelled or failed:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !referralCode) return;
    
    setSending(true);
    try {
      const response = await supabase.functions.invoke("send-referral-invite", {
        body: {
          email: inviteEmail,
          inviterName: profile?.full_name || "A K-Worship user",
          referralCode,
          language,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(language === "ko" ? "초대가 발송되었습니다!" : "Invitation sent!");
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || (language === "ko" ? "발송 실패" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {language === "ko" ? "친구 초대하기" : "Invite Friends"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reward Info */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {language === "ko" 
                ? "친구가 가입하면 K-Seed를 받아요!" 
                : "Earn K-Seeds when friends join!"}
            </p>
          </div>

          {/* Referral Link Section */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "내 초대 링크" : "My Referral Link"}</Label>
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Referral Code */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "ko" ? "내 추천 코드" : "My Referral Code"}
            </p>
            <p className="font-mono text-lg font-bold tracking-widest text-primary">
              {referralCode || "---"}
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              {language === "ko" ? "복사" : "Copy"}
            </Button>
            
            {typeof navigator !== "undefined" && navigator.share && (
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {language === "ko" ? "공유" : "Share"}
              </Button>
            )}
          </div>

          {/* Email Invite Section */}
          <div className="border-t pt-4 space-y-3">
            <Label>{language === "ko" ? "이메일로 초대하기" : "Invite by Email"}</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={language === "ko" ? "친구 이메일" : "Friend's email"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button 
                onClick={handleSendInvite}
                disabled={!inviteEmail || sending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {sending 
                  ? (language === "ko" ? "발송중..." : "Sending...") 
                  : (language === "ko" ? "초대" : "Send")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
