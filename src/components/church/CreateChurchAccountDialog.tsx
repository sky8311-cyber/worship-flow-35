import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Loader2, CheckCircle } from "lucide-react";

interface CreateChurchAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChurchAccountDialog({ open, onOpenChange, onSuccess }: CreateChurchAccountDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguageContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Calculate trial end date (30 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
      
      const { data, error } = await supabase
        .from("church_accounts")
        .insert({
          name,
          description: description || null,
          website: website || null,
          billing_email: billingEmail || user.email,
          owner_id: user.id,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "교회 계정이 생성되었습니다. 30일 무료 체험이 시작되었습니다!" : "Church account created. Your 30-day free trial has started!");
      onOpenChange(false);
      onSuccess();
      // Reset form
      setName("");
      setDescription("");
      setWebsite("");
      setBillingEmail("");
      setAcceptedTerms(false);
    },
    onError: (error: any) => {
      toast.error(error.message || (language === "ko" ? "생성 중 오류가 발생했습니다" : "Failed to create"));
    },
  });

  const features = [
    language === "ko" ? "커스텀 역할 라벨" : "Custom role labels",
    language === "ko" ? "팀 로테이션 시스템" : "Team rotation system",
    language === "ko" ? "포지션 사인업 관리" : "Position sign-up management",
    language === "ko" ? "화이트 라벨 브랜딩" : "White-label branding",
    language === "ko" ? "커스텀 도메인 연결" : "Custom domain connection",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {language === "ko" ? "교회 계정 만들기" : "Create Church Account"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? "30일 무료 체험으로 교회 계정의 모든 기능을 사용해 보세요."
              : "Start your 30-day free trial and explore all Church Account features."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === "ko" ? "교회 이름" : "Church Name"} *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ko" ? "예: 사랑의교회" : "e.g., Grace Community Church"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {language === "ko" ? "설명" : "Description"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === "ko" ? "교회에 대한 간단한 설명" : "Brief description of your church"}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              {language === "ko" ? "웹사이트" : "Website"}
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.yourchurch.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">
              {language === "ko" ? "결제 이메일" : "Billing Email"}
            </Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder={user?.email || "billing@yourchurch.org"}
            />
          </div>

          {/* Trial Features Summary */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-medium text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              {language === "ko" ? "30일 무료 체험에 포함된 기능" : "Features included in 30-day trial"}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {features.map((feature, idx) => (
                <li key={idx}>• {feature}</li>
              ))}
            </ul>
          </div>

          {/* Trial Terms Acceptance */}
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <Checkbox
              id="acceptTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="acceptTerms" className="text-xs leading-relaxed cursor-pointer">
              {language === "ko" 
                ? "30일 무료 체험 이후에는 교회 계정 기능을 계속 사용하려면 월 $39.99의 구독이 필요합니다. 체험 기간 중 언제든지 취소할 수 있으며, 신용카드는 필요하지 않습니다."
                : "I understand that after the 30-day free trial, a subscription of $39.99/month is required to continue using Church Account features. I can cancel anytime during the trial period. No credit card required."}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button type="submit" disabled={!name || !acceptedTerms || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === "ko" ? "체험 시작하기" : "Start Free Trial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}