import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Lock,
  Crown,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremiumSubscription } from "@/hooks/usePremiumSubscription";

export function PremiumBillingCard() {
  const { t, language } = useTranslation();
  const { 
    isSubscribed, 
    isActive, 
    isTrial, 
    trialDaysRemaining, 
    subscriptionStatus, 
    subscriptionEnd,
    canStartTrial,
    refetch 
  } = usePremiumSubscription();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US");
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-premium-checkout");

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
      const { data, error } = await supabase.functions.invoke("premium-customer-portal");

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

  const getStatusBadge = () => {
    if (subscriptionStatus === "active") {
      return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{language === "ko" ? "활성" : "Active"}</Badge>;
    }
    if (isTrial) {
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />{language === "ko" ? "체험판" : "Trial"}</Badge>;
    }
    if (subscriptionStatus === "trial" && !isTrial) {
      return <Badge variant="outline" className="gap-1 text-destructive border-destructive"><Lock className="w-3 h-3" />{language === "ko" ? "만료됨" : "Expired"}</Badge>;
    }
    return null;
  };

  const features = [
    language === "ko" ? "고급 분석 및 통계" : "Advanced analytics & stats",
    language === "ko" ? "우선 지원" : "Priority support",
    language === "ko" ? "확장 스토리지" : "Extended storage",
    language === "ko" ? "커스텀 브랜딩" : "Custom branding",
    language === "ko" ? "API 액세스" : "API access",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {language === "ko" ? "프리미엄 구독" : "Premium Subscription"}
        </CardTitle>
        <CardDescription>
          {language === "ko" ? "프리미엄 기능으로 더 많은 것을 누리세요" : "Unlock premium features for more"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {isSubscribed 
                  ? (language === "ko" ? "프리미엄 멤버" : "Premium Member") 
                  : (language === "ko" ? "무료 플랜" : "Free Plan")}
              </p>
              {subscriptionEnd && isSubscribed && (
                <p className="text-sm text-muted-foreground">
                  {language === "ko" ? "다음 결제일: " : "Next billing: "}{formatDate(subscriptionEnd)}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Trial Warning */}
        {isTrial && trialDaysRemaining > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              {language === "ko" 
                ? `체험판 ${trialDaysRemaining}일 남음` 
                : `${trialDaysRemaining} days left in trial`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "ko" 
                ? "체험 기간이 끝나면 유료 구독으로 전환됩니다"
                : "You'll be charged when your trial ends"}
            </p>
          </div>
        )}

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {language === "ko" ? "프리미엄 기능" : "Premium Features"}
          </h4>
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isSubscribed ? "text-green-500" : "text-muted-foreground"}`} />
                <span className={isSubscribed ? "" : "text-muted-foreground"}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {canStartTrial 
                ? (language === "ko" ? "14일 무료 체험 시작" : "Start 14-Day Free Trial")
                : (language === "ko" ? "프리미엄 구독" : "Subscribe to Premium")}
            </Button>
          ) : (
            <Button 
              onClick={handleManageBilling}
              disabled={isPortalLoading}
              variant="outline"
              className="w-full gap-2"
            >
              {isPortalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {language === "ko" ? "구독 관리" : "Manage Subscription"}
            </Button>
          )}
        </div>

        {/* Price Info */}
        <div className="text-center pt-2 border-t">
          <p className="text-lg font-bold">
            {language === "ko" ? "₩9,900/월" : "$9.99/month"}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "ko" ? "언제든 취소 가능" : "Cancel anytime"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
