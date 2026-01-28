import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronRight
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
import { useTierFeature, TIER_HIERARCHY, type TierLevel } from "@/hooks/useTierFeature";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  
  const { product: premiumProduct } = useMembershipProduct("full_membership");
  const { product: churchProduct } = useMembershipProduct("community_account");

  const [isLoading, setIsLoading] = useState<PlanId | null>(null);

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
        ? `${formatPrice(premiumProduct.price_krw, "krw")}/${premiumProduct.billing_cycle_label_ko || "년"}`
        : `${formatPrice(premiumProduct.price_usd, "usd")}/${premiumProduct.billing_cycle_label_en || "year"}`)
    : (language === "ko" ? "₩59,000/년" : "$59/year");

  const churchPriceDisplay = churchProduct 
    ? (language === "ko" 
        ? `${formatPrice(churchProduct.price_krw, "krw")}/${churchProduct.billing_cycle_label_ko || "월"}`
        : `${formatPrice(churchProduct.price_usd, "usd")}/${churchProduct.billing_cycle_label_en || "month"}`)
    : (language === "ko" ? "₩39,900/월" : "$39.99/month");

  const premiumTrialDays = premiumProduct?.trial_days || 7;
  const churchTrialDays = churchProduct?.trial_days || 30;

  // Handle Premium (Full Member) subscription
  const handlePremiumSubscribe = async () => {
    setIsLoading("full-member");
    try {
      const { data, error } = await supabase.functions.invoke("create-premium-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
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
        body: { churchAccountId },
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
      features: [
        t("churchAccount.featureJoinCommunity"),
        t("churchAccount.featureViewSets"),
        t("churchAccount.featureTeamComm"),
      ],
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
      features: [
        t("churchAccount.featureCreateCommunity"),
        t("churchAccount.featureManageSets"),
        t("churchAccount.featureManageLibrary"),
        t("churchAccount.featureTemplates"),
      ],
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
      features: [
        language === "ko" ? "고급 분석 및 인사이트" : "Advanced analytics & insights",
        language === "ko" ? "우선 지원" : "Priority support",
        language === "ko" ? "추가 저장 공간" : "Additional storage",
        language === "ko" ? "프리미엄 템플릿" : "Premium templates",
      ],
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
      features: [
        t("churchAccount.featureCustomRoles"),
        t("churchAccount.featureTeamRotation"),
        t("churchAccount.featurePositionSignup"),
        t("churchAccount.featureWhiteLabel"),
        t("churchAccount.featureCustomDomain"),
      ],
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
        <div className="md:hidden mb-8">
          <Carousel
            opts={{
              align: "center",
              startIndex: currentPlanIndex >= 0 ? currentPlanIndex : 0,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
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

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("churchAccount.trialNote")}
          </p>
        </div>

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
