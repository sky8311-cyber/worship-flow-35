import { useState } from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChurchBillingTabProps {
  churchAccount: {
    id: string;
    name: string;
    subscription_status: string;
    max_seats: number;
    used_seats: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    trial_ends_at: string | null;
  };
  isOwner: boolean;
}

export function ChurchBillingTab({ churchAccount, isOwner }: ChurchBillingTabProps) {
  const { language } = useLanguageContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{language === "ko" ? "활성" : "Active"}</Badge>;
      case "trial":
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />{language === "ko" ? "체험판" : "Trial"}</Badge>;
      case "past_due":
        return <Badge variant="destructive">{language === "ko" ? "결제 지연" : "Past Due"}</Badge>;
      case "canceled":
        return <Badge variant="outline">{language === "ko" ? "취소됨" : "Canceled"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-church-checkout", {
        body: { churchAccountId: churchAccount.id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(language === "ko" ? "결제 페이지를 열 수 없습니다" : "Could not open checkout page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("church-customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error(language === "ko" ? "결제 관리 페이지를 열 수 없습니다" : "Could not open billing portal");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const daysRemaining = churchAccount.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(churchAccount.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {language === "ko" ? "구독 및 결제" : "Subscription & Billing"}
          </CardTitle>
          <CardDescription>
            {language === "ko" 
              ? "교회 계정의 구독 상태와 결제 정보를 관리합니다."
              : "Manage your church account subscription and billing information."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{language === "ko" ? "K-Worship 교회 계정" : "K-Worship Church Account"}</h4>
                <p className="text-sm text-muted-foreground">
                  {language === "ko" ? "$39.99 / 월" : "$39.99 / month"}
                </p>
              </div>
              {getStatusBadge(churchAccount.subscription_status)}
            </div>

            {/* Trial Info */}
            {churchAccount.subscription_status === "trial" && churchAccount.trial_ends_at && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  {language === "ko" 
                    ? `30일 무료 체험 중 (${daysRemaining}일 남음)`
                    : `30-day free trial (${daysRemaining} days remaining)`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ko" 
                    ? `체험 종료일: ${new Date(churchAccount.trial_ends_at).toLocaleDateString("ko-KR")}`
                    : `Trial ends: ${new Date(churchAccount.trial_ends_at).toLocaleDateString("en-US")}`}
                </p>
              </div>
            )}

            {/* Plan Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">{language === "ko" ? "최대 시트" : "Max Seats"}</p>
                <p className="font-semibold text-lg">{churchAccount.max_seats}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">{language === "ko" ? "사용 중" : "Used"}</p>
                <p className="font-semibold text-lg">{churchAccount.used_seats}</p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">{language === "ko" ? "포함 기능" : "Included Features"}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {language === "ko" ? "커스텀 역할 라벨" : "Custom Role Labels"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {language === "ko" ? "팀 로테이션 시스템" : "Team Rotation System"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {language === "ko" ? "포지션 사인업 관리" : "Position Sign-up Management"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {language === "ko" ? "화이트 라벨 브랜딩" : "White-label Branding"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {language === "ko" ? "커스텀 도메인 연결" : "Custom Domain Connection"}
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-3">
              {churchAccount.subscription_status === "trial" ? (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isLoading}
                  className="gap-2 flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {language === "ko" ? "유료 플랜으로 업그레이드" : "Upgrade to Paid Plan"}
                </Button>
              ) : churchAccount.stripe_customer_id ? (
                <Button 
                  onClick={handleManageBilling} 
                  disabled={isPortalLoading}
                  variant="outline"
                  className="gap-2 flex-1"
                >
                  {isPortalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {language === "ko" ? "결제 관리" : "Manage Billing"}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isLoading}
                  className="gap-2 flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {language === "ko" ? "구독 시작하기" : "Start Subscription"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
