import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Users, Music, X, Sparkles, ChevronRight } from "lucide-react";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { cn } from "@/lib/utils";

export function WLOnboardingChecklist() {
  const navigate = useNavigate();
  const { user, isWorshipLeader } = useAuth();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);

  // Check if user has communities
  const { data: hasCommunity } = useQuery({
    queryKey: ["wl-onboarding-community", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("community_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!user && isWorshipLeader,
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
    enabled: !!user && isWorshipLeader,
    staleTime: 60 * 1000,
  });

  // Don't show if not worship leader, dismissed, or already completed all steps
  if (!isWorshipLeader || dismissed || (hasCommunity && hasSet)) {
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
              onClick={() => setDismissed(true)}
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
                  <p className={cn(
                    "text-sm font-medium",
                    step.completed && "text-green-700 dark:text-green-400 line-through",
                    isCurrent && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-xs",
                    step.completed ? "text-green-600/70 dark:text-green-500/70" : "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                </div>
                
                {/* Action Button */}
                {isCurrent && step.action && (
                  <Button
                    size="sm"
                    onClick={step.action}
                    className="shrink-0 gap-1"
                  >
                    {t("onboarding.start")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
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
