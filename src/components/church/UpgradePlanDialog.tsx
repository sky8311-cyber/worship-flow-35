import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Music, Building2, Sparkles } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChurchSubscription } from "@/hooks/useChurchSubscription";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
  onSubscribe?: () => void;
}

export function UpgradePlanDialog({ open, onOpenChange, onStartTrial, onSubscribe }: UpgradePlanDialogProps) {
  const { language } = useLanguageContext();
  const { isWorshipLeader, isAdmin } = useAuth();
  const { isSubscriptionActive, isInTrial, canStartTrial, subscriptionStatus } = useChurchSubscription();

  // Determine current plan
  const getCurrentPlan = () => {
    if (isSubscriptionActive && !isInTrial) return "church";
    if (isInTrial) return "church-trial";
    if (isWorshipLeader || isAdmin) return "worship-leader";
    return "member";
  };

  const currentPlan = getCurrentPlan();

  const plans = [
    {
      id: "member",
      name: language === "ko" ? "팀 멤버" : "Team Member",
      price: language === "ko" ? "무료" : "Free",
      description: language === "ko" 
        ? "예배공동체에 참여하고 워십세트를 확인하세요"
        : "Join communities and view worship sets",
      features: [
        language === "ko" ? "예배공동체 가입" : "Join worship communities",
        language === "ko" ? "게시된 워십세트 보기" : "View published worship sets",
        language === "ko" ? "팀 소통" : "Team communication",
      ],
      icon: Users,
      isCurrent: currentPlan === "member",
    },
    {
      id: "worship-leader",
      name: language === "ko" ? "예배인도자" : "Worship Leader",
      price: language === "ko" ? "베타 무료" : "Beta Free",
      description: language === "ko" 
        ? "예배공동체를 만들고 워십세트를 관리하세요"
        : "Create communities and manage worship sets",
      features: [
        language === "ko" ? "예배공동체 생성" : "Create worship communities",
        language === "ko" ? "워십세트 생성 및 관리" : "Create & manage worship sets",
        language === "ko" ? "곡 라이브러리 관리" : "Manage song library",
        language === "ko" ? "템플릿 및 반복 예배" : "Templates & recurring sets",
      ],
      icon: Music,
      isCurrent: currentPlan === "worship-leader",
    },
    {
      id: "church",
      name: language === "ko" ? "교회 계정" : "Church Account",
      price: "$39.99 / " + (language === "ko" ? "월" : "month"),
      description: language === "ko" 
        ? "팀 협업과 고급 기능으로 교회 전체를 관리하세요"
        : "Manage your entire church with team collaboration",
      features: [
        language === "ko" ? "커스텀 역할 라벨" : "Custom role labels",
        language === "ko" ? "팀 로테이션 시스템" : "Team rotation system",
        language === "ko" ? "포지션 사인업 관리" : "Position sign-up management",
        language === "ko" ? "화이트 라벨 브랜딩" : "White-label branding",
        language === "ko" ? "커스텀 도메인 연결" : "Custom domain connection",
      ],
      icon: Building2,
      isCurrent: currentPlan === "church" || currentPlan === "church-trial",
      isHighlighted: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {language === "ko" ? "플랜 선택" : "Choose Your Plan"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "교회의 필요에 맞는 플랜을 선택하세요"
              : "Select the plan that fits your church's needs"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.isHighlighted ? "border-primary shadow-md" : ""} ${plan.isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {plan.isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    {language === "ko" ? "현재 플랜" : "Your Plan"}
                  </Badge>
                )}
                {plan.isHighlighted && !plan.isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent">
                    {language === "ko" ? "추천" : "Recommended"}
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${plan.isHighlighted ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-5 h-5 ${plan.isHighlighted ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold">{plan.price}</p>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === "church" && !plan.isCurrent && (
                    <div className="mt-4 space-y-2">
                      {canStartTrial && (
                        <Button 
                          onClick={onStartTrial} 
                          className="w-full"
                          variant="default"
                        >
                          {language === "ko" ? "30일 무료 체험 시작" : "Start 30-Day Free Trial"}
                        </Button>
                      )}
                      <Button 
                        onClick={onSubscribe} 
                        className="w-full"
                        variant={canStartTrial ? "outline" : "default"}
                      >
                        {language === "ko" ? "지금 구독하기" : "Subscribe Now"}
                      </Button>
                    </div>
                  )}

                  {plan.id === "church" && currentPlan === "church-trial" && (
                    <div className="mt-4">
                      <Button 
                        onClick={onSubscribe} 
                        className="w-full"
                        variant="default"
                      >
                        {language === "ko" ? "유료 플랜으로 업그레이드" : "Upgrade to Paid Plan"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {language === "ko" 
            ? "30일 무료 체험 - 신용카드 필요 없음"
            : "30-day free trial - No credit card required"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
