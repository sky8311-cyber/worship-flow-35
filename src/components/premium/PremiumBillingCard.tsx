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
import { useMembershipProduct, formatPrice } from "@/hooks/useMembershipProducts";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  const { product, isLoading: isProductLoading } = useMembershipProduct("full_membership");
  
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

  // Get pricing from DB or fallback
  const priceDisplay = product 
    ? (language === "ko" 
        ? `${formatPrice(product.price_krw, "krw")}/${product.billing_cycle_label_ko || "연간"}`
        : `${formatPrice(product.price_usd, "usd")}/${product.billing_cycle_label_en || "year"}`)
    : (language === "ko" ? "₩59,000/연간" : "$49.99/year");

  const trialDays = product?.trial_days || 7;
  const displayName = product 
    ? (language === "ko" ? product.display_name_ko : product.display_name_en)
    : (language === "ko" ? "정식 멤버십" : "Full Membership");

  const billingCycleLabel = product
    ? (language === "ko" ? product.billing_cycle_label_ko : product.billing_cycle_label_en)
    : (language === "ko" ? "연간" : "Annual");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {displayName} ({billingCycleLabel})
        </CardTitle>
        <CardDescription>
          {product 
            ? (language === "ko" ? product.description_ko : product.description_en) 
            : (language === "ko" ? "정식 멤버 기능으로 더 많은 것을 누리세요" : "Unlock full member features for more")}
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
                  ? (language === "ko" ? "정식 멤버" : "Full Member") 
                  : (language === "ko" ? "기본 멤버십" : "Basic Membership")}
              </p>
              {subscriptionEnd && isSubscribed && (
                <p className="text-sm text-muted-foreground">
                  {language === "ko" ? "구독 종료일: " : "Membership ends: "}{formatDate(subscriptionEnd)}
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
                ? "체험 기간이 끝나면 멤버십으로 전환됩니다"
                : "Your membership will start when your trial ends"}
            </p>
          </div>
        )}

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {language === "ko" ? "정식 멤버 기능" : "Full Member Features"}
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
                ? (language === "ko" ? `${trialDays}일 무료 체험 시작` : `Start ${trialDays}-Day Free Trial`)
                : (language === "ko" ? "정식 멤버 가입" : "Join as Full Member")}
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
              {language === "ko" ? "멤버십 관리" : "Manage Membership"}
            </Button>
          )}
        </div>

        {/* Price Info */}
        <div className="text-center pt-2 border-t">
          {isProductLoading ? (
            <Skeleton className="h-6 w-24 mx-auto mb-1" />
          ) : (
            <p className="text-lg font-bold">{priceDisplay}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {language === "ko" ? "언제든 취소 가능" : "Cancel anytime"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
