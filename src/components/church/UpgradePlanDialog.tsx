import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Music, Building2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChurchSubscription } from "@/hooks/useChurchSubscription";
import { useTranslation } from "@/hooks/useTranslation";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
  onSubscribe?: () => void;
}

export function UpgradePlanDialog({ open, onOpenChange, onStartTrial, onSubscribe }: UpgradePlanDialogProps) {
  const { t } = useTranslation();
  const { isWorshipLeader, isAdmin } = useAuth();
  const { isSubscriptionActive, isInTrial, canStartTrial } = useChurchSubscription();

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
      name: t("churchAccount.planMember"),
      price: t("churchAccount.planMemberPrice"),
      description: t("churchAccount.planMemberDescription"),
      features: [
        t("churchAccount.featureJoinCommunity"),
        t("churchAccount.featureViewSets"),
        t("churchAccount.featureTeamComm"),
      ],
      icon: Users,
      isCurrent: currentPlan === "member",
    },
    {
      id: "worship-leader",
      name: t("churchAccount.planWorshipLeader"),
      price: t("churchAccount.planWorshipLeaderPrice"),
      description: t("churchAccount.planWorshipLeaderDescription"),
      features: [
        t("churchAccount.featureCreateCommunity"),
        t("churchAccount.featureManageSets"),
        t("churchAccount.featureManageLibrary"),
        t("churchAccount.featureTemplates"),
      ],
      icon: Music,
      isCurrent: currentPlan === "worship-leader",
    },
    {
      id: "church",
      name: t("churchAccount.planChurch"),
      price: t("churchAccount.planChurchPrice"),
      description: t("churchAccount.planChurchDescription"),
      features: [
        t("churchAccount.featureCustomRoles"),
        t("churchAccount.featureTeamRotation"),
        t("churchAccount.featurePositionSignup"),
        t("churchAccount.featureWhiteLabel"),
        t("churchAccount.featureCustomDomain"),
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
            {t("churchAccount.choosePlan")}
          </DialogTitle>
          <DialogDescription>
            {t("churchAccount.choosePlanDescription")}
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
                    {t("churchAccount.currentPlan")}
                  </Badge>
                )}
                {plan.isHighlighted && !plan.isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent">
                    {t("churchAccount.recommended")}
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
                          {t("churchAccount.startTrial")}
                        </Button>
                      )}
                      <Button 
                        onClick={onSubscribe} 
                        className="w-full"
                        variant={canStartTrial ? "outline" : "default"}
                      >
                        {t("churchAccount.subscribeNow")}
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
                        {t("churchAccount.upgradeToPaid")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("churchAccount.trialNote")}
        </p>
      </DialogContent>
    </Dialog>
  );
}