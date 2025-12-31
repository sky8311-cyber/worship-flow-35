import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Users, Music, UserPlus, X, Sparkles } from "lucide-react";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";

export function WLOnboardingChecklist() {
  const navigate = useNavigate();
  const { user, isWorshipLeader } = useAuth();
  const { language } = useTranslation();
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
      label: language === "ko" ? "예배인도자 승급" : "Become Worship Leader", 
      completed: true, // Always true if showing this component
      icon: Sparkles,
    },
    { 
      id: "community", 
      label: language === "ko" ? "예배공동체 만들기" : "Create Community", 
      completed: !!hasCommunity,
      icon: Users,
      action: () => setShowCreateCommunity(true),
    },
    { 
      id: "set", 
      label: language === "ko" ? "첫 번째 워십세트 만들기" : "Create First Worship Set", 
      completed: !!hasSet,
      icon: Music,
      action: () => navigate("/set-builder"),
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {language === "ko" ? "시작하기" : "Getting Started"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedCount}/{steps.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={step.action}
              disabled={step.completed || !step.action}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                step.completed 
                  ? "text-muted-foreground" 
                  : step.action 
                    ? "hover:bg-background cursor-pointer" 
                    : ""
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-sm ${step.completed ? "line-through" : "font-medium"}`}>
                {step.label}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <CreateCommunityDialog 
        open={showCreateCommunity} 
        onOpenChange={setShowCreateCommunity} 
      />
    </>
  );
}
