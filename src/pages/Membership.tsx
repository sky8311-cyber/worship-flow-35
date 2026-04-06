import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Music, 
  Crown, 
  Building2, 
  CheckCircle, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  CreditCard,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumSubscription } from "@/hooks/usePremiumSubscription";
import { useChurchSubscription } from "@/hooks/useChurchSubscription";
import { useMembershipProduct, formatPrice } from "@/hooks/useMembershipProducts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTierFeature, TIER_HIERARCHY, type TierLevel } from "@/hooks/useTierFeature";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isNativeIOS } from "@/utils/platform";
import { useRevenueCat } from "@/hooks/useRevenueCat";

type PlanId = "team-member" | "basic-member" | "full-member" | "community-account";

interface PlanConfig {
  id: PlanId;
  tierKey: TierLevel;
  icon: typeof Users;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  isHighlighted?: boolean;
  actionType: "current" | "upgrade" | "manage" | "none";
}

const Membership = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isWorshipLeader, isAdmin } = useAuth();
  const { isSubscribed: isPremium, isLoading: premiumLoading } = usePremiumSubscription();
  const { 
    isSubscriptionActive: isChurch, 
    isInTrial: isChurchTrial, 
    canStartTrial: canStartChurchTrial,
    churchAccountId 
  } = useChurchSubscription();
  const { tier } = useTierFeature();
  const { isSandboxTester, isLoading: settingsLoading } = useAppSettings();
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { product: premiumMonthly } = useMembershipProduct("full_membership");
  const { product: premiumYearly } = useMembershipProduct("full_membership_yearly");
  const { product: churchMonthly } = useMembershipProduct("community_account");
  const { product: churchYearly } = useMembershipProduct("community_account_yearly");
  const premiumProduct = billingCycle === "yearly" ? premiumYearly : premiumMonthly;
  const churchProduct = billingCycle === "yearly" ? churchYearly : churchMonthly;

  const [isLoading, setIsLoading] = useState<PlanId | null>(null);
  const nativeIOS = isNativeIOS();
  const { 
    purchasePackage, 
    restorePurchases, 
    getPremiumPackage, 
    getChurchPackage, 
    isLoading: rcLoading 
  } = useRevenueCat();

  // Access control: Only Admin or Sandbox Tester can access this page
  if (!settingsLoading && !isAdmin && !isSandboxTester) {
    return <Navigate to="/dashboard" replace />;
  }

  // Determine user's current tier
  const getUserTier = (): TierLevel => {
    if (isChurch) return "church";
    if (isPremium) return "premium";
    if (isWorshipLeader || isAdmin) return "worship_leader";
    return "member";
  };

  const currentTier = getUserTier();
  const currentTierLevel = TIER_HIERARCHY[currentTier];

  // Get dynamic pricing
  const premiumPriceDisplay = premiumProduct 
    ? (language === "ko" 
        ? `${formatPrice(premiumProduct.price_krw, "krw")}/${premiumProduct.billing_cycle_label_ko || (billingCycle === "yearly" ? "년" : "월")}`
        : `${formatPrice(premiumProduct.price_usd, "usd")}/${premiumProduct.billing_cycle_label_en || (billingCycle === "yearly" ? "year" : "month")}`)
    : (billingCycle === "yearly" 
        ? (language === "ko" ? "₩59,000/년" : "$49.99/year")
        : (language === "ko" ? "₩5,900/월" : "$4.99/month"));

  const churchPriceDisplay = churchProduct 
    ? (language === "ko" 
        ? `${formatPrice(churchProduct.price_krw, "krw")}/${churchProduct.billing_cycle_label_ko || (billingCycle === "yearly" ? "년" : "월")}`
        : `${formatPrice(churchProduct.price_usd, "usd")}/${churchProduct.billing_cycle_label_en || (billingCycle === "yearly" ? "year" : "month")}`)
    : (billingCycle === "yearly"
        ? (language === "ko" ? "₩399,000/년" : "$399/year")
        : (language === "ko" ? "₩39,900/월" : "$39.99/month"));

  const premiumTrialDays = premiumProduct?.trial_days || 7;
  const churchTrialDays = churchProduct?.trial_days || 30;

  // Handle Premium (Full Member) subscription
  const handlePremiumSubscribe = async () => {
    setIsLoading("full-member");
    try {
      if (nativeIOS) {
        // Use RevenueCat for native iOS IAP
        const pkg = getPremiumPackage();
        if (!pkg) {
          toast.error(language === "ko" ? "상품을 불러올 수 없습니다" : "Could not load product");
          return;
        }
        await purchasePackage(pkg);
        toast.success(language === "ko" ? "정식 멤버 가입 완료!" : "Full Member activated!");
        queryClient.invalidateQueries({ queryKey: ["premium-subscription-status"] });
      } else {
        // Use Stripe for web
        const { data, error } = await supabase.functions.invoke("create-premium-checkout", {
          body: { billing_cycle: billingCycle },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
        }
      }
    } catch (error) {
      console.error("Premium checkout error:", error);
      toast.error(language === "ko" ? "결제 페이지를 열 수 없습니다" : "Could not open checkout page");
    } finally {
      setIsLoading(null);
    }
  };

  const handlePremiumManage = async () => {
    setIsLoading("full-member");
    try {
      const { data, error } = await supabase.functions.invoke("premium-customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error(language === "ko" ? "관리 페이지를 열 수 없습니다" : "Could not open portal");
    } finally {
      setIsLoading(null);
    }
  };

  // Handle Church Account actions
  const handleChurchStartTrial = async () => {
    if (churchAccountId) {
      setIsLoading("community-account");
      try {
        const trialDays = churchProduct?.trial_days || 30;
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);
        
        const { error } = await supabase
          .from("church_accounts")
          .update({ 
            subscription_status: "trial",
            trial_ends_at: trialEndDate.toISOString()
          })
          .eq("id", churchAccountId);

        if (error) throw error;
        
        toast.success(t("churchAccount.trialStarted"));
        queryClient.invalidateQueries({ queryKey: ["churchAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["church-subscription-status"] });
      } catch (error) {
        console.error("Start trial error:", error);
        toast.error(t("churchAccount.trialStartFailed"));
      } finally {
        setIsLoading(null);
      }
    } else {
      // Navigate to create church account
      navigate("/church-account");
    }
  };

  const handleChurchSubscribe = async () => {
    if (!churchAccountId) {
      navigate("/church-account");
      return;
    }
    
    setIsLoading("community-account");
    try {
      const { data, error } = await supabase.functions.invoke("create-church-checkout", {
        body: { churchAccountId, billing_cycle: billingCycle },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("churchAccount.checkoutFailed"));
    } finally {
      setIsLoading(null);
    }
  };

  const handleChurchManage = async () => {
    setIsLoading("community-account");
    try {
      const { data, error } = await supabase.functions.invoke("church-customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error(t("churchAccount.portalFailed"));
    } finally {
      setIsLoading(null);
    }
  };

  // Define plans
  const plans: PlanConfig[] = [
    {
      id: "team-member",
      tierKey: "member",
      icon: Users,
      name: t("churchAccount.planMember"),
      price: language === "ko" ? "무료" : "Free",
      priceNote: t("churchAccount.freeForever"),
      description: t("churchAccount.planMemberDescription"),
      features: language === "ko" 
        ? ["송 라이브러리 조회", "Band View", "워십 아틀리에", "KWI 무료 강의 수강"]
        : ["Song Library", "Band View", "Worship Atelier", "KWI Free Courses"],
      actionType: currentTier === "member" ? "current" : "none",
    },
    {
      id: "basic-member",
      tierKey: "worship_leader",
      icon: Music,
      name: t("churchAccount.planWorshipLeader"),
      price: language === "ko" ? "무료" : "Free",
      priceNote: t("churchAccount.freeForever"),
      description: t("churchAccount.planWorshipLeaderDescription"),
      features: language === "ko"
        ? ["팀멤버 전체 포함", "워십세트 생성 및 관리", "KWI 기본멤버 강의 수강"]
        : ["All Team Member features", "Worship Set Builder", "KWI Basic Courses"],
      actionType: currentTier === "worship_leader" ? "current" : 
                  (currentTier === "member" ? "upgrade" : "none"),
    },
    {
      id: "full-member",
      tierKey: "premium",
      icon: Crown,
      name: premiumProduct ? (language === "ko" ? premiumProduct.display_name_ko : premiumProduct.display_name_en) : (language === "ko" ? "정식 멤버" : "Full Member"),
      price: premiumPriceDisplay,
      priceNote: language === "ko" ? `${premiumTrialDays}일 무료 체험` : `${premiumTrialDays}-day free trial`,
      description: premiumProduct 
        ? (language === "ko" ? premiumProduct.description_ko || "" : premiumProduct.description_en || "") 
        : (language === "ko" ? "예배인도자를 위한 프리미엄 기능" : "Premium features for worship leaders"),
      features: language === "ko"
        ? ["기본멤버 전체 포함", "AI 워십세트 생성 (Worship Arc™)", "KWI 전체 수강 + AI 코치 + 수료 배지", "앰배서더 신청 자격"]
        : ["All Basic Member features", "AI Worship Set Generation (Worship Arc™)", "Full KWI Access + AI Coach + Certification", "Ambassador Application"],
      isHighlighted: !isChurch && !isPremium,
      actionType: isPremium ? "manage" : "upgrade",
    },
    {
      id: "community-account",
      tierKey: "church",
      icon: Building2,
      name: churchProduct ? (language === "ko" ? churchProduct.display_name_ko : churchProduct.display_name_en) : t("churchAccount.planChurch"),
      price: churchPriceDisplay,
      priceNote: language === "ko" ? `${churchTrialDays}일 무료 체험` : `${churchTrialDays}-day free trial`,
      description: churchProduct 
        ? (language === "ko" ? churchProduct.description_ko || "" : churchProduct.description_en || "")
        : t("churchAccount.planChurchDescription"),
      features: language === "ko"
        ? ["정식멤버 전체 포함", "소속 팀원 정식멤버 권한 부여 (인원 무제한)", "PPT 자막 생성", "팀 로테이션 스케줄링", "화이트레이블 브랜딩"]
        : ["All Full Member features", "Grant Full Member access to all team members", "PPT Subtitle Generation", "Team Rotation Scheduling", "White-label Branding"],
      isHighlighted: isChurch || (!isPremium && (isWorshipLeader || isAdmin)),
      actionType: isChurch ? "manage" : "upgrade",
    },
  ];

  const renderPlanCard = (plan: PlanConfig, isMobile = false) => {
    const Icon = plan.icon;
    const isCurrent = plan.tierKey === currentTier;
    const planLevel = TIER_HIERARCHY[plan.tierKey];
    const isDowngrade = planLevel < currentTierLevel;
    
    return (
      <Card 
        key={plan.id}
        className={`relative h-full flex flex-col transition-all ${
          isCurrent 
            ? "ring-2 ring-primary border-primary shadow-lg" 
            : plan.isHighlighted 
              ? "border-primary/50 shadow-md" 
              : ""
        } ${isMobile ? "mx-2" : ""}`}
      >
        {/* Badges */}
        <div className="absolute -top-3 left-4 flex gap-2">
          {isCurrent && (
            <Badge className="bg-primary shadow-sm">
              {t("churchAccount.yourCurrentPlan")}
            </Badge>
          )}
          {plan.isHighlighted && !isCurrent && (
            <Badge variant="secondary" className="gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              {t("churchAccount.recommended")}
            </Badge>
          )}
        </div>

        <CardHeader className="pt-8">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-xl ${isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
              <Icon className={`w-6 h-6 ${isCurrent ? "" : "text-primary"}`} />
            </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.priceNote}</p>
          </div>
          <CardDescription className="mt-3">
            {plan.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Features */}
          <ul className="space-y-3 text-sm flex-1">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            {plan.id === "team-member" && (
              isCurrent ? (
                <Badge variant="outline" className="w-full justify-center py-2">
                  {t("churchAccount.yourCurrentPlan")}
                </Badge>
              ) : null
            )}

            {plan.id === "basic-member" && (
              isCurrent ? (
                <Badge variant="outline" className="w-full justify-center py-2">
                  {t("churchAccount.yourCurrentPlan")}
                </Badge>
              ) : !isDowngrade && !isWorshipLeader && !isAdmin ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate("/request-worship-leader")}
                >
                  {language === "ko" ? "기본 멤버 신청" : "Apply for Basic Member"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : null
            )}

            {plan.id === "full-member" && (
              isPremium ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handlePremiumManage}
                  disabled={isLoading === "full-member"}
                >
                  {isLoading === "full-member" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {t("churchAccount.manageSubscription")}
                </Button>
              ) : (
                <Button 
                  className="w-full gap-2"
                  onClick={handlePremiumSubscribe}
                  disabled={isLoading === "full-member"}
                >
                  {isLoading === "full-member" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {language === "ko" ? "정식 멤버 가입" : "Become Full Member"}
                </Button>
              )
            )}

            {plan.id === "community-account" && (
              isChurch && !isChurchTrial ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleChurchManage}
                  disabled={isLoading === "community-account"}
                >
                  {isLoading === "community-account" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {t("churchAccount.manageSubscription")}
                </Button>
              ) : isChurchTrial ? (
                <Button 
                  className="w-full gap-2"
                  onClick={handleChurchSubscribe}
                  disabled={isLoading === "community-account"}
                >
                  {isLoading === "community-account" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {t("churchAccount.upgradeToPaid")}
                </Button>
              ) : canStartChurchTrial && churchAccountId ? (
                <>
                  <Button 
                    className="w-full gap-2"
                    onClick={handleChurchStartTrial}
                    disabled={isLoading === "community-account"}
                  >
                    {isLoading === "community-account" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {t("churchAccount.startTrial")}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleChurchSubscribe}
                    disabled={isLoading === "community-account"}
                  >
                    {t("churchAccount.subscribeNow")}
                  </Button>
                </>
              ) : (isWorshipLeader || isAdmin) ? (
                <Button 
                  className="w-full gap-2"
                  onClick={() => navigate("/church-account")}
                >
                  <Building2 className="w-4 h-4" />
                  {language === "ko" ? "공동체 계정 시작" : "Start Community Account"}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  {language === "ko" ? "기본 멤버 필요" : "Requires Basic Member"}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Find current plan index for carousel
  const currentPlanIndex = plans.findIndex(p => p.tierKey === currentTier);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {language === "ko" ? "멤버십 선택" : "Choose Your Membership"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {t("churchAccount.choosePlan")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("churchAccount.choosePlanDescription")}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <ToggleGroup
              type="single"
              value={billingCycle}
              onValueChange={(val) => { if (val) setBillingCycle(val as "monthly" | "yearly"); }}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="monthly" className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                {language === "ko" ? "월간" : "Monthly"}
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                {language === "ko" ? "연간" : "Yearly"}
              </ToggleGroupItem>
            </ToggleGroup>
            {billingCycle === "yearly" && (
              <Badge variant="secondary" className="text-xs">
                {language === "ko" ? "약 17% 할인" : "Save ~17%"}
              </Badge>
            )}
          </div>
        </div>

        {/* Desktop: Grid View */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => renderPlanCard(plan))}
        </div>

        {/* Tablet: 2-column Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-6 mb-8">
          {plans.map((plan) => renderPlanCard(plan))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden mb-8 pt-4">
          <Carousel
            opts={{
              align: "center",
              startIndex: currentPlanIndex >= 0 ? currentPlanIndex : 0,
            }}
            className="w-full overflow-visible"
          >
            <CarouselContent className="-ml-2 overflow-visible">
              {plans.map((plan) => (
                <CarouselItem key={plan.id} className="pl-2 basis-[85%]">
                  {renderPlanCard(plan, true)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-6">
              <CarouselPrevious className="static translate-y-0" />
              <p className="text-sm text-muted-foreground">
                {t("churchAccount.swipeToCompare")}
              </p>
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>

        {/* Restore Purchases — required by Apple for native iOS */}
        {nativeIOS && (
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={async () => {
                try {
                  await restorePurchases();
                  queryClient.invalidateQueries({ queryKey: ["premium-subscription-status"] });
                  queryClient.invalidateQueries({ queryKey: ["church-subscription-status"] });
                  toast.success(language === "ko" ? "구매 내역이 복원되었습니다" : "Purchases restored");
                } catch {
                  toast.error(language === "ko" ? "복원에 실패했습니다" : "Failed to restore purchases");
                }
              }}
              disabled={rcLoading}
            >
              {rcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {language === "ko" ? "구매 내역 복원" : "Restore Purchases"}
            </Button>
          </div>
        )}

        {/* Quick Links for existing subscribers */}
        {(isPremium || isChurch) && (
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ko" ? "멤버십 관리가 필요하신가요?" : "Need to manage your membership?"}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {isPremium && (
                <Button variant="outline" size="sm" onClick={handlePremiumManage}>
                  {language === "ko" ? "정식 멤버 관리" : "Manage Full Member"}
                </Button>
              )}
              {isChurch && (
                <Button variant="outline" size="sm" onClick={() => navigate("/church-account")}>
                  {language === "ko" ? "공동체 계정 관리" : "Manage Community Account"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Membership;
