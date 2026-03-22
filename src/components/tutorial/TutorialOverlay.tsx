import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialOverlayProps {
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  targetSelector: string;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialOverlay = ({
  isOpen,
  currentStep,
  totalSteps,
  title,
  description,
  targetSelector,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onClose,
}: TutorialOverlayProps) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("bottom");
  const rafRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    const el = document.querySelector(`[data-tutorial="${targetSelector}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isVisible) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          const newRect = el.getBoundingClientRect();
          setTargetRect({
            top: newRect.top,
            left: newRect.left,
            width: newRect.width,
            height: newRect.height,
          });
          setTooltipPosition(newRect.top > window.innerHeight / 2 ? "top" : "bottom");
        }, 400);
      } else {
        setTooltipPosition(rect.top > window.innerHeight / 2 ? "top" : "bottom");
      }
    } else {
      setTargetRect(null);
    }
  }, [targetSelector]);

  const throttledUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      updatePosition();
      rafRef.current = null;
    });
  }, [updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener("resize", throttledUpdate);
    window.addEventListener("scroll", throttledUpdate, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", throttledUpdate);
      window.removeEventListener("scroll", throttledUpdate, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, updatePosition, throttledUpdate, currentStep]);

  if (!isOpen) return null;

  const padding = 8;
  const spotlightStyle = targetRect
    ? {
        clipPath: `polygon(
          0% 0%, 0% 100%, 
          ${targetRect.left - padding}px 100%, 
          ${targetRect.left - padding}px ${targetRect.top - padding}px, 
          ${targetRect.left + targetRect.width + padding}px ${targetRect.top - padding}px, 
          ${targetRect.left + targetRect.width + padding}px ${targetRect.top + targetRect.height + padding}px, 
          ${targetRect.left - padding}px ${targetRect.top + targetRect.height + padding}px, 
          ${targetRect.left - padding}px 100%, 
          100% 100%, 100% 0%
        )`,
      }
    : {};

  // Tooltip positioning
  const tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    tooltipStyle.left = left;
    tooltipStyle.width = tooltipWidth;

    if (tooltipPosition === "bottom") {
      tooltipStyle.top = targetRect.top + targetRect.height + padding + 12;
    } else {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + padding + 12;
    }
  } else {
    // Center fallback
    tooltipStyle.left = "50%";
    tooltipStyle.top = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
    tooltipStyle.width = Math.min(320, window.innerWidth - 32);
  }

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={spotlightStyle}
        onClick={onClose}
      />

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-background border border-border rounded-xl shadow-2xl p-4 z-[91] animate-in fade-in-0 zoom-in-95 duration-200"
        style={tooltipStyle}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentStep
                  ? "w-6 bg-primary"
                  : i < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-bold text-sm text-primary mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isFirstStep}
            className="h-7 text-xs gap-1"
          >
            <ChevronLeft className="w-3 h-3" />
            이전
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            className="h-7 text-xs gap-1"
          >
            {isLastStep ? (
              <>
                <Check className="w-3 h-3" />
                완료
              </>
            ) : (
              <>
                다음
                <ChevronRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
