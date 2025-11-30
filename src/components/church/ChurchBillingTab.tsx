import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, CheckCircle, AlertCircle, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradePlanDialog } from "./UpgradePlanDialog";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isTrialLoading, setIsTrialLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Check if subscription is active or in valid trial
  const isTrialValid = churchAccount.subscription_status === "trial" && 
    churchAccount.trial_ends_at && 
    new Date(churchAccount.trial_ends_at) > new Date();
  
  const isActive = churchAccount.subscription_status === "active" || isTrialValid;
  
  // Can start trial if no subscription yet
  const canStartTrial = !churchAccount.subscription_status || 
    churchAccount.subscription_status === "inactive" || 
    churchAccount.subscription_status === "";

  const getStatusBadge = (status: string) => {
    if (isTrialValid) {
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />{t("churchAccount.statusTrial")}</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{t("churchAccount.statusActive")}</Badge>;
      case "trial":
        return <Badge variant="outline" className="gap-1 text-destructive border-destructive"><Lock className="w-3 h-3" />{t("churchAccount.statusExpired")}</Badge>;
      case "past_due":
        return <Badge variant="destructive">{t("churchAccount.statusPastDue")}</Badge>;
      case "canceled":
        return <Badge variant="outline">{t("churchAccount.statusCanceled")}</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" />{t("churchAccount.statusNotSubscribed")}</Badge>;
    }
  };

  const handleStartTrial = async () => {
    setIsTrialLoading(true);
    try {
      // Update church account to start trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      
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
      setShowUpgradeDialog(false);
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
      setShowUpgradeDialog(false);
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

  const daysRemaining = churchAccount.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(churchAccount.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US");
  };

  return (
    <div className="space-y-6">
      {/* Start Trial CTA - Show prominently if not subscribed */}
      {canStartTrial && isOwner && (
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("churchAccount.tryFeatures")}
            </CardTitle>
            <CardDescription>
              {t("churchAccount.trialDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t("churchAccount.featureCustomRoles")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t("churchAccount.featureTeamRotation")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t("churchAccount.featurePositionSignup")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t("churchAccount.featureWhiteLabel")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t("churchAccount.featureCustomDomain")}
              </li>
            </ul>
            <Button 
              onClick={handleStartTrial} 
              disabled={isTrialLoading}
              className="w-full gap-2"
              size="lg"
            >
              {isTrialLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t("churchAccount.startTrial")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("churchAccount.noPaymentRequired")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t("churchAccount.subscriptionBilling")}
          </CardTitle>
          <CardDescription>
            {t("churchAccount.subscriptionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">K-Worship {t("churchAccount.planChurch")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("churchAccount.planChurchPrice")}
                </p>
              </div>
              {getStatusBadge(churchAccount.subscription_status)}
            </div>

            {/* Trial Info */}
            {isTrialValid && churchAccount.trial_ends_at && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
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
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm font-medium text-destructive">
                  {t("churchAccount.trialExpiredMessage")}
                </p>
              </div>
            )}

            {/* Plan Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">{t("churchAccount.maxSeats")}</p>
                <p className="font-semibold text-lg">{churchAccount.max_seats}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">{t("churchAccount.usedSeats")}</p>
                <p className="font-semibold text-lg">{churchAccount.used_seats}</p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">{t("churchAccount.includedFeatures")}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {t("churchAccount.featureCustomRoles")}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {t("churchAccount.featureTeamRotation")}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {t("churchAccount.featurePositionSignup")}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {t("churchAccount.featureWhiteLabel")}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {t("churchAccount.featureCustomDomain")}
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-3">
              {isTrialValid ? (
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
                  {t("churchAccount.upgradeToPaid")}
                </Button>
              ) : churchAccount.subscription_status === "active" && churchAccount.stripe_customer_id ? (
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
                  {t("churchAccount.manageBilling")}
                </Button>
              ) : !canStartTrial ? (
                <Button 
                  onClick={() => setShowUpgradeDialog(true)}
                  className="gap-2 flex-1"
                >
                  <CreditCard className="w-4 h-4" />
                  {t("churchAccount.choosePlanButton")}
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradePlanDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
        onStartTrial={handleStartTrial}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}