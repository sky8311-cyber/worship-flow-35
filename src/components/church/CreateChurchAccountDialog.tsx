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
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("church_accounts")
        .insert({
          name,
          description: description || null,
          website: website || null,
          billing_email: billingEmail || user.email,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "교회 계정이 생성되었습니다" : "Church account created");
      onOpenChange(false);
      onSuccess();
      // Reset form
      setName("");
      setDescription("");
      setWebsite("");
      setBillingEmail("");
    },
    onError: (error: any) => {
      toast.error(error.message || (language === "ko" ? "생성 중 오류가 발생했습니다" : "Failed to create"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {language === "ko" ? "교회 계정 만들기" : "Create Church Account"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? "교회 단위로 여러 예배공동체와 팀원을 관리할 수 있습니다. 30일 무료 체험이 제공됩니다."
              : "Manage multiple communities and team members at the church level. Includes a 30-day free trial."}
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
              rows={3}
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
            <p className="text-xs text-muted-foreground">
              {language === "ko"
                ? "결제 관련 알림을 받을 이메일 주소입니다."
                : "Email address for billing notifications."}
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">
              {language === "ko" ? "무료 체험 포함" : "Free Trial Included"}
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>• {language === "ko" ? "30일 무료 체험" : "30-day free trial"}</li>
              <li>• {language === "ko" ? "최대 5명 시트" : "Up to 5 seats"}</li>
              <li>• {language === "ko" ? "모든 기능 이용 가능" : "Access to all features"}</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button type="submit" disabled={!name || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === "ko" ? "만들기" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
