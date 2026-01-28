import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

interface EmailPreferences {
  automated_reminders: boolean;
  community_updates: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
}

const EmailPreferences = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    automated_reminders: true,
    community_updates: true,
    product_updates: true,
    marketing_emails: true,
  });
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("유효하지 않은 링크입니다.");
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke("manage-email-preferences", {
          method: "POST",
          body: { action: "get", token },
        });

        if (fetchError) throw fetchError;
        if (data?.error) throw new Error(data.error);

        if (data?.preferences) {
          setPreferences(data.preferences);
          // Check if all are false
          const allFalse = !data.preferences.automated_reminders && 
            !data.preferences.community_updates && 
            !data.preferences.product_updates && 
            !data.preferences.marketing_emails;
          setUnsubscribeAll(allFalse);
        }
      } catch (err: any) {
        console.error("Error fetching preferences:", err);
        setError(err.message || "설정을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [token]);

  const handleUnsubscribeAllChange = (checked: boolean) => {
    setUnsubscribeAll(checked);
    if (checked) {
      setPreferences({
        automated_reminders: false,
        community_updates: false,
        product_updates: false,
        marketing_emails: false,
      });
    }
  };

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    // If any preference is turned on, uncheck "unsubscribe all"
    if (value) {
      setUnsubscribeAll(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    
    setSaving(true);
    try {
      const { data, error: saveError } = await supabase.functions.invoke("manage-email-preferences", {
        method: "POST",
        body: { action: "update", token, preferences },
      });

      if (saveError) throw saveError;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      toast.success("이메일 수신 설정이 저장되었습니다.");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      toast.error(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">오류</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoDesktop} alt="K-Worship" className="h-8" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle>이메일 수신 설정</CardTitle>
            <CardDescription>
              K-Worship에서 보내는 이메일 수신 여부를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">저장되었습니다</h3>
                <p className="text-sm text-muted-foreground">
                  이메일 수신 설정이 업데이트되었습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📬</span>
                      <div>
                        <p className="font-medium text-sm">자동 리마인더</p>
                        <p className="text-xs text-muted-foreground">미접속, 팀원 초대, 워십세트 알림</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.automated_reminders}
                      onCheckedChange={(v) => handlePreferenceChange("automated_reminders", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">👥</span>
                      <div>
                        <p className="font-medium text-sm">커뮤니티 업데이트</p>
                        <p className="text-xs text-muted-foreground">커뮤니티 공지 및 안내</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.community_updates}
                      onCheckedChange={(v) => handlePreferenceChange("community_updates", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📢</span>
                      <div>
                        <p className="font-medium text-sm">서비스 업데이트</p>
                        <p className="text-xs text-muted-foreground">새 기능, 정책 변경 안내</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.product_updates}
                      onCheckedChange={(v) => handlePreferenceChange("product_updates", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="font-medium text-sm">마케팅 이메일</p>
                        <p className="text-xs text-muted-foreground">프로모션, 이벤트 안내</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.marketing_emails}
                      onCheckedChange={(v) => handlePreferenceChange("marketing_emails", v)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm text-destructive">모든 이메일 수신 거부</p>
                    <p className="text-xs text-muted-foreground">모든 마케팅 이메일 수신을 중단합니다</p>
                  </div>
                  <Switch
                    checked={unsubscribeAll}
                    onCheckedChange={handleUnsubscribeAllChange}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  저장하기
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          © 2026 K-Worship. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default EmailPreferences;
