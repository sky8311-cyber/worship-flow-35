import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TutorialStep {
  targetSelector: string;
  title: string;
  description: string;
}

interface UseTutorialOptions {
  key: string;
  steps: TutorialStep[];
  autoStart?: boolean;
  autoStartDelay?: number;
}

export const useTutorial = ({ key, steps, autoStart = true, autoStartDelay = 800 }: UseTutorialOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dbChecked, setDbChecked] = useState(false);
  const completedRef = useRef(false);

  const storageKey = `tutorial_seen_${key}`;

  // Check completion from localStorage (fast) then DB (source of truth)
  useEffect(() => {
    // Fast path: localStorage cache
    if (localStorage.getItem(storageKey)) {
      completedRef.current = true;
      setDbChecked(true);
      return;
    }

    // DB check
    const checkDb = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setDbChecked(true);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("tutorial_completed")
          .eq("id", user.id)
          .single();

        const completed = (data?.tutorial_completed as Record<string, boolean>) || {};
        if (completed[key]) {
          completedRef.current = true;
          // Sync to localStorage cache
          localStorage.setItem(storageKey, "true");
        } else {
          // Sync existing localStorage entries to DB (backward compat)
          // Already checked localStorage above, so nothing to sync here
        }
      } catch {
        // DB unavailable — rely on localStorage
      }
      setDbChecked(true);
    };

    checkDb();
  }, [key, storageKey]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const markComplete = useCallback(async () => {
    localStorage.setItem(storageKey, "true");
    completedRef.current = true;

    // Save to DB (fire-and-forget)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("tutorial_completed")
        .eq("id", user.id)
        .single();

      const current = (data?.tutorial_completed as Record<string, boolean>) || {};
      await (supabase.from("profiles") as any)
        .update({ tutorial_completed: { ...current, [key]: true } })
        .eq("id", user.id);
    } catch {
      // localStorage already set — session is safe
    }
  }, [key, storageKey]);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
    markComplete();
  }, [markComplete]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      close();
    }
  }, [currentStep, steps.length, close]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Auto-start on first visit (after DB check completes)
  useEffect(() => {
    if (!autoStart || !dbChecked || completedRef.current) return;

    const timer = setTimeout(() => {
      start();
    }, autoStartDelay);
    return () => clearTimeout(timer);
  }, [autoStart, dbChecked, autoStartDelay, start]);

  return {
    isOpen,
    currentStep,
    currentStepData: steps[currentStep] || null,
    totalSteps: steps.length,
    start,
    next,
    prev,
    close,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
  };
};
