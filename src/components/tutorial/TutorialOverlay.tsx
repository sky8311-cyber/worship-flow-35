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

const PADDING = 8;
const TOOLTIP_GAP = 12;
const SAFE_MARGIN = 16;

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
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = document.querySelector(`[data-tutorial="${targetSelector}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const newRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!isVisible) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        decidePosition(r);
      }, 400);
    } else {
      setTargetRect(newRect);
      decidePosition(rect);
    }
  }, [targetSelector]);

  const decidePosition = (rect: DOMRect) => {
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Prefer bottom, but flip if not enough space
    setTooltipPosition(spaceBelow >= 140 ? "bottom" : spaceAbove >= 140 ? "top" : "bottom");
  };

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

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spotlightStyle = targetRect
    ? {
        clipPath: `polygon(
          0% 0%, 0% 100%, 
          ${targetRect.left - PADDING}px 100%, 
          ${targetRect.left - PADDING}px ${targetRect.top - PADDING}px, 
          ${targetRect.left + targetRect.width + PADDING}px ${targetRect.top - PADDING}px, 
          ${targetRect.left + targetRect.width + PADDING}px ${targetRect.top + targetRect.height + PADDING}px, 
          ${targetRect.left - PADDING}px ${targetRect.top + targetRect.height + PADDING}px, 
          ${targetRect.left - PADDING}px 100%, 
          100% 100%, 100% 0%
        )`,
      }
    : {};

  // Tooltip positioning with viewport clamping
  const tooltipStyle: React.CSSProperties = {};
  const tooltipWidth = Math.min(300, vw - 32);

  if (targetRect) {
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    left = Math.max(SAFE_MARGIN, Math.min(left, vw - tooltipWidth - SAFE_MARGIN));
    tooltipStyle.left = left;
    tooltipStyle.width = tooltipWidth;

    if (tooltipPosition === "bottom") {
      let top = targetRect.top + targetRect.height + PADDING + TOOLTIP_GAP;
      // Clamp: don't let tooltip go below viewport
      const maxTop = vh - SAFE_MARGIN - 180; // reserve ~180px for tooltip
      top = Math.min(top, maxTop);
      top = Math.max(SAFE_MARGIN, top);
      tooltipStyle.top = top;
    } else {
      let bottom = vh - targetRect.top + PADDING + TOOLTIP_GAP;
      const maxBottom = vh - SAFE_MARGIN - 180;
      bottom = Math.min(bottom, maxBottom);
      bottom = Math.max(SAFE_MARGIN, bottom);
      tooltipStyle.bottom = bottom;
    }
  } else {
    tooltipStyle.left = "50%";
    tooltipStyle.top = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
    tooltipStyle.width = tooltipWidth;
  }

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={spotlightStyle}
        onClick={onClose}
      />

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-background border border-border rounded-xl shadow-2xl p-3 z-[91] animate-in fade-in-0 zoom-in-95 duration-200 max-h-[60vh] overflow-y-auto"
        style={{
          ...tooltipStyle,
          paddingBottom: `max(12px, env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full",
                i === currentStep
                  ? "w-5 bg-primary"
                  : i < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto pr-5">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-bold text-sm text-primary mb-0.5">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isFirstStep}
            className="h-7 text-xs gap-1 px-2"
          >
            <ChevronLeft className="w-3 h-3" />
            이전
          </Button>

          <button
            onClick={onClose}
            className="text-[10px] text-muted-foreground underline hover:text-foreground"
          >
            건너뛰기
          </button>

          <Button
            size="sm"
            onClick={onNext}
            className="h-7 text-xs gap-1 px-2"
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
