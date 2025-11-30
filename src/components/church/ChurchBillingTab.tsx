import { useState } from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, CheckCircle, AlertCircle, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradePlanDialog } from "./UpgradePlanDialog";

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
      return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />{language === "ko" ? "체험판" : "Trial"}</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{language === "ko" ? "활성" : "Active"}</Badge>;
      case "trial":
        return <Badge variant="outline" className="gap-1 text-destructive border-destructive"><Lock className="w-3 h-3" />{language === "ko" ? "만료됨" : "Expired"}</Badge>;
      case "past_due":
        return <Badge variant="destructive">{language === "ko" ? "결제 지연" : "Past Due"}</Badge>;
      case "canceled":
        return <Badge variant="outline">{language === "ko" ? "취소됨" : "Canceled"}</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" />{language === "ko" ? "미구독" : "Not Subscribed"}</Badge>;
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
      
      toast.success(language === "ko" ? "30일 무료 체험이 시작되었습니다!" : "Your 30-day free trial has started!");
      queryClient.invalidateQueries({ queryKey: ["churchAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["church-subscription-status"] });
      setShowUpgradeDialog(false);
    } catch (error) {
      console.error("Start trial error:", error);
      toast.error(language === "ko" ? "체험 시작에 실패했습니다" : "Could not start trial");
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
      toast.error(language === "ko" ? "결제 페이지를 열 수 없습니다" : "Could not open checkout page");
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
      {/* Start Trial CTA - Show prominently if not subscribed */}
      {canStartTrial && isOwner && (
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {language === "ko" ? "교회 계정 기능 체험하기" : "Try Church Account Features"}
            </CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "30일 무료 체험 - 신용카드 없이 지금 바로 시작하세요!"
                : "30-day free trial - Start now without a credit card!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
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
              {language === "ko" ? "30일 무료 체험 시작하기" : "Start 30-Day Free Trial"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {language === "ko" ? "결제 정보 필요 없음" : "No payment information required"}
            </p>
          </CardContent>
        </Card>
      )}

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
            {isTrialValid && churchAccount.trial_ends_at && (
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

            {/* Expired Trial Warning */}
            {churchAccount.subscription_status === "trial" && !isTrialValid && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm font-medium text-destructive">
                  {language === "ko" 
                    ? "체험 기간이 종료되었습니다. 기능을 계속 사용하려면 구독해주세요."
                    : "Your trial has expired. Subscribe to continue using features."}
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
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {language === "ko" ? "커스텀 역할 라벨" : "Custom Role Labels"}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {language === "ko" ? "팀 로테이션 시스템" : "Team Rotation System"}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {language === "ko" ? "포지션 사인업 관리" : "Position Sign-up Management"}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {language === "ko" ? "화이트 라벨 브랜딩" : "White-label Branding"}
                </li>
                <li className="flex items-center gap-2">
                  {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  {language === "ko" ? "커스텀 도메인 연결" : "Custom Domain Connection"}
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
                  {language === "ko" ? "유료 플랜으로 업그레이드" : "Upgrade to Paid Plan"}
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
                  {language === "ko" ? "결제 관리" : "Manage Billing"}
                </Button>
              ) : !canStartTrial ? (
                <Button 
                  onClick={() => setShowUpgradeDialog(true)}
                  className="gap-2 flex-1"
                >
                  <CreditCard className="w-4 h-4" />
                  {language === "ko" ? "플랜 선택하기" : "Choose a Plan"}
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
