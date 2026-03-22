import { useState, useCallback, useEffect } from "react";

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

  const storageKey = `tutorial_seen_${key}`;

  const shouldAutoStart = useCallback(() => {
    return !localStorage.getItem(storageKey);
  }, [storageKey]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
    localStorage.setItem(storageKey, "true");
  }, [storageKey]);

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

  // Auto-start on first visit
  useEffect(() => {
    if (autoStart && shouldAutoStart()) {
      const timer = setTimeout(() => {
        start();
      }, autoStartDelay);
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, start, autoStartDelay]);

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
