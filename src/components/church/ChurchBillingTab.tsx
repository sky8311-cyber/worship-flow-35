import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Users, 
  Music, 
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useMembershipProduct, formatPrice } from "@/hooks/useMembershipProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

type PlanType = "member" | "worship-leader" | "church";

export function ChurchBillingTab({ churchAccount, isOwner }: ChurchBillingTabProps) {
  const { t, language } = useTranslation();
  const { isWorshipLeader } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isTrialLoading, setIsTrialLoading] = useState(false);

  // Fetch product info from DB
  const { product } = useMembershipProduct("community_account");

  // Check if subscription is active or in valid trial
  const isTrialValid = churchAccount.subscription_status === "trial" && 
    churchAccount.trial_ends_at && 
    new Date(churchAccount.trial_ends_at) > new Date();
  
  const isActive = churchAccount.subscription_status === "active" || isTrialValid;
  
  // Can start trial if no subscription yet
  const canStartTrial = !churchAccount.subscription_status || 
    churchAccount.subscription_status === "inactive" || 
    churchAccount.subscription_status === "";

  // Determine current plan
  const getCurrentPlan = (): PlanType => {
    if (churchAccount.subscription_status === "active" || isTrialValid) {
      return "church";
    }
    if (isWorshipLeader) {
      return "worship-leader";
    }
    return "member";
  };

  const currentPlan = getCurrentPlan();

  const daysRemaining = churchAccount.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(churchAccount.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US");
  };

  const handleStartTrial = async () => {
    setIsTrialLoading(true);
    try {
      const trialDays = product?.trial_days || 30;
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      
      const { error } = await supabase
        .from("church_accounts")
        .update({ 
          subscription_status: "trial",
          trial_ends_at: trialEndDate.toISOString()
        })
        .eq("id", churchAccount.id);

      if (error) throw error;
      
      toast.success(t("churchAccount.trialStarted"));
      queryClient.invalidateQueries({ queryKey: ["churchAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["church-subscription-status"] });
    } catch (error) {
      console.error("Start trial error:", error);
      toast.error(t("churchAccount.trialStartFailed"));
    } finally {
      setIsTrialLoading(false);
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
      toast.error(t("churchAccount.checkoutFailed"));
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
      toast.error(t("churchAccount.portalFailed"));
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Get dynamic pricing from DB or fallback
  const churchPriceDisplay = product 
    ? (language === "ko" 
        ? `${formatPrice(product.price_krw, "krw")}/${product.billing_cycle_label_ko || "월간"}`
        : `${formatPrice(product.price_usd, "usd")}/${product.billing_cycle_label_en || "month"}`)
    : (language === "ko" ? "₩39,900/월간" : "$39.99/month");

  const trialDays = product?.trial_days || 30;

  // Plan data
  const plans = [
    {
      id: "member" as PlanType,
      icon: Users,
      name: t("churchAccount.planMember"),
      price: t("churchAccount.planMemberPrice"),
      priceNote: t("churchAccount.freeForever"),
      description: t("churchAccount.planMemberDescription"),
      features: [
        t("churchAccount.featureJoinCommunity"),
        t("churchAccount.featureViewSets"),
        t("churchAccount.featureTeamComm"),
      ],
    },
    {
      id: "worship-leader" as PlanType,
      icon: Music,
      name: t("churchAccount.planWorshipLeader"),
      price: t("churchAccount.planWorshipLeaderPrice"),
      priceNote: t("churchAccount.freeForever"),
      description: t("churchAccount.planWorshipLeaderDescription"),
      features: [
        t("churchAccount.featureCreateCommunity"),
        t("churchAccount.featureManageSets"),
        t("churchAccount.featureManageLibrary"),
        t("churchAccount.featureTemplates"),
      ],
    },
    {
      id: "church" as PlanType,
      icon: Building2,
      name: product ? (language === "ko" ? product.display_name_ko : product.display_name_en) : t("churchAccount.planChurch"),
      price: churchPriceDisplay,
      priceNote: language === "ko" ? `${trialDays}일 무료 체험` : `${trialDays}-day free trial`,
      description: product 
        ? (language === "ko" ? product.description_ko : product.description_en) 
        : t("churchAccount.planChurchDescription"),
      features: [
        t("churchAccount.featureCustomRoles"),
        t("churchAccount.featureTeamRotation"),
        t("churchAccount.featurePositionSignup"),
        t("churchAccount.featureWhiteLabel"),
        t("churchAccount.featureCustomDomain"),
      ],
      isRecommended: true,
    },
  ];

  const getStatusBadge = () => {
    if (churchAccount.subscription_status === "active") {
      return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{t("churchAccount.statusActive")}</Badge>;
    }
    if (isTrialValid) {
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />{t("churchAccount.statusTrial")}</Badge>;
    }
    if (churchAccount.subscription_status === "trial" && !isTrialValid) {
      return <Badge variant="outline" className="gap-1 text-destructive border-destructive"><Lock className="w-3 h-3" />{t("churchAccount.statusExpired")}</Badge>;
    }
    if (churchAccount.subscription_status === "past_due") {
      return <Badge variant="destructive">{t("churchAccount.statusPastDue")}</Badge>;
    }
    if (churchAccount.subscription_status === "canceled") {
      return <Badge variant="outline">{t("churchAccount.statusCanceled")}</Badge>;
    }
    return null;
  };

  const renderPlanCard = (plan: typeof plans[0], isMobile = false) => {
    const isCurrent = plan.id === currentPlan;
    const Icon = plan.icon;
    
    return (
      <Card 
        key={plan.id}
        className={`relative h-full flex flex-col ${
          isCurrent 
            ? "ring-2 ring-primary border-primary" 
            : ""
        } ${isMobile ? "mx-2" : ""}`}
      >
        {/* Badges */}
        <div className="absolute -top-3 left-4 flex gap-2">
          {isCurrent && (
            <Badge className="bg-primary">
              {t("churchAccount.yourCurrentPlan")}
            </Badge>
          )}
          {plan.isRecommended && !isCurrent && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {t("churchAccount.recommended")}
            </Badge>
          )}
        </div>

        <CardHeader className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
          </div>
          <CardDescription className="mt-2">{plan.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Features */}
          <ul className="space-y-2 text-sm flex-1">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          {isOwner && plan.id === "church" && (
            <div className="mt-6 space-y-3">
              {canStartTrial ? (
                <>
                  <Button 
                    onClick={handleStartTrial}
                    disabled={isTrialLoading}
                    className="w-full gap-2"
                  >
                    {isTrialLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {t("churchAccount.startTrial")}
                  </Button>
                  <Button 
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("churchAccount.subscribeNow")}
                  </Button>
                </>
              ) : isTrialValid ? (
                <Button 
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {t("churchAccount.upgradeToPaid")}
                </Button>
              ) : churchAccount.subscription_status === "active" ? (
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
                  {t("churchAccount.manageSubscription")}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("churchAccount.subscribeNow")}
                </Button>
              )}
            </div>
          )}

          {/* Show current badge for non-church plans */}
          {isCurrent && plan.id !== "church" && (
            <div className="mt-6">
              <Badge variant="outline" className="w-full justify-center py-2">
                {t("churchAccount.yourCurrentPlan")}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("churchAccount.subscriptionBilling")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("churchAccount.subscriptionDescription")}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Trial Warning */}
          {isTrialValid && churchAccount.trial_ends_at && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                {t("churchAccount.trialDaysRemaining", { days: daysRemaining })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("churchAccount.trialEnds", { date: formatDate(churchAccount.trial_ends_at) })}
              </p>
            </div>
          )}

          {/* Expired Trial Warning */}
          {churchAccount.subscription_status === "trial" && !isTrialValid && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                {t("churchAccount.trialExpiredMessage")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t("churchAccount.comparePlans")}</h3>
        
        {/* Desktop: Grid View */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {plans.map((plan) => renderPlanCard(plan))}
        </div>

        {/* Mobile: Carousel View */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: "center",
              startIndex: plans.findIndex(p => p.id === currentPlan),
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {plans.map((plan) => (
                <CarouselItem key={plan.id} className="pl-2 md:pl-4 basis-[85%]">
                  {renderPlanCard(plan, true)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-4">
              <CarouselPrevious className="static translate-y-0" />
              <p className="text-sm text-muted-foreground">
                {t("churchAccount.swipeToCompare")}
              </p>
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </div>

      {/* Cancel/Downgrade Link */}
      {isOwner && (churchAccount.subscription_status === "active" || isTrialValid) && churchAccount.stripe_customer_id && (
        <div className="text-center pt-4 border-t">
          <button
            onClick={handleManageBilling}
            disabled={isPortalLoading}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors inline-flex items-center gap-1"
          >
            {isPortalLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {t("churchAccount.needToCancel")} {t("churchAccount.manageSubscription")}
          </button>
        </div>
      )}
    </div>
  );
}
