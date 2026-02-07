import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Circle, Users, Music, X, Sparkles, ChevronRight, UserPlus, Gift } from "lucide-react";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WLOnboardingChecklist() {
  const navigate = useNavigate();
  const { user, isWorshipLeader, profile } = useAuth();
  const { t, language } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wl-onboarding-dismissed') === 'true';
    }
    return false;
  });
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('wl-onboarding-dismissed', 'true');
  };

  // Check if user has communities and get the first one
  const { data: communityData } = useQuery({
    queryKey: ["wl-onboarding-community", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user && !!profile && isWorshipLeader,
    staleTime: 60 * 1000,
  });

  const hasCommunity = !!communityData;
  const firstCommunityId = communityData?.community_id;

  // Check if user has invited team members (community has more than 1 member)
  const { data: hasInvitedMembers } = useQuery({
    queryKey: ["wl-onboarding-invited", firstCommunityId],
    queryFn: async () => {
      if (!firstCommunityId) return false;
      const { count, error } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("community_id", firstCommunityId);
      if (error) throw error;
      return (count || 0) > 1;
    },
    enabled: !!firstCommunityId,
    staleTime: 60 * 1000,
  });

  // Check if user has created any worship sets
  const { data: hasSet } = useQuery({
    queryKey: ["wl-onboarding-set", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("service_sets")
        .select("id")
        .eq("created_by", user.id)
        .limit(1);
      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!user && !!profile && isWorshipLeader,
    staleTime: 60 * 1000,
  });

  // Don't show if profile not loaded, not worship leader, dismissed, or already completed all steps
  if (!profile || !isWorshipLeader || dismissed || (hasCommunity && hasInvitedMembers && hasSet)) {
    return null;
  }

  const steps = [
    { 
      id: "wl", 
      label: t("onboarding.steps.worshipLeader"),
      description: t("onboarding.steps.worshipLeaderDesc"),
      completed: true,
      icon: Sparkles,
    },
    { 
      id: "community", 
      label: t("onboarding.steps.createCommunity"),
      description: t("onboarding.steps.createCommunityDesc"),
      completed: !!hasCommunity,
      icon: Users,
      action: () => setShowCreateCommunity(true),
    },
    { 
      id: "invite", 
      label: t("onboarding.steps.inviteTeam"),
      description: t("onboarding.steps.inviteTeamDesc"),
      completed: !!hasInvitedMembers,
      icon: UserPlus,
      action: firstCommunityId 
        ? () => navigate(`/community/${firstCommunityId}`)
        : () => setShowCreateCommunity(true),
      showReward: true,
    },
    { 
      id: "set", 
      label: t("onboarding.steps.createFirstSet"),
      description: t("onboarding.steps.createFirstSetDesc"),
      completed: !!hasSet,
      icon: Music,
      action: () => navigate("/set-builder"),
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  
  // Find the first incomplete step (current step to work on)
  const currentStepIndex = steps.findIndex(s => !s.completed);

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{t("onboarding.title")}</h3>
                <p className="text-xs text-muted-foreground">{t("onboarding.subtitle")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completedCount}/{steps.length} {t("onboarding.progress")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = index === currentStepIndex;
            const isPending = !step.completed && !isCurrent;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                  step.completed && "bg-green-500/10 border border-green-500/20",
                  isCurrent && "bg-primary/10 border border-primary/30 shadow-sm",
                  isPending && "bg-muted/30 opacity-60"
                )}
              >
                {/* Status Icon */}
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  step.completed && "bg-green-500/20",
                  isCurrent && "bg-primary/20",
                  isPending && "bg-muted"
                )}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Icon className={cn(
                      "w-4 h-4",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      step.completed && "text-green-700 dark:text-green-400 line-through",
                      isCurrent && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}>
                      {step.label}
                    </p>
                    {step.showReward && !step.completed && (
                      <Badge variant="secondary" className="text-xs gap-1 py-0">
                        <Gift className="w-3 h-3" />
                        +30
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs",
                    step.completed ? "text-green-600/70 dark:text-green-500/70" : "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                </div>
                
                {/* Action Button */}
                {isCurrent && step.action && (
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={step.action}
                      className="gap-1"
                    >
                      {t("onboarding.start")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox 
                        checked={dontShowAgain}
                        onCheckedChange={(checked) => {
                          setDontShowAgain(checked === true);
                          if (checked === true) {
                            handleDismiss();
                          }
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs text-muted-foreground">
                        {language === "ko" ? "더이상 보지 않기" : "Don't show again"}
                      </span>
                    </label>
                  </div>
                )}
                
                {/* Pending indicator */}
                {isPending && (
                  <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <CreateCommunityDialog 
        open={showCreateCommunity} 
        onOpenChange={setShowCreateCommunity} 
      />
    </>
  );
}
