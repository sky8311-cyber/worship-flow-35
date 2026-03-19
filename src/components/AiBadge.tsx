import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function AiBadge({ size = "sm", className }: AiBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-medium bg-gradient-to-r from-violet-100 to-blue-100 text-violet-700 dark:from-violet-900/40 dark:to-blue-900/40 dark:text-violet-300",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Sparkles className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      AI
    </span>
  );
}
