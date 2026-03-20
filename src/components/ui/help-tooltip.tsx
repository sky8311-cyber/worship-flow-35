import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  text: string;
  helpLink?: string;
  side?: "top" | "bottom" | "left" | "right";
  size?: number;
  className?: string;
}

export const HelpTooltip = ({ text, helpLink, side = "top", size = 14, className }: HelpTooltipProps) => {
  const icon = (
    <HelpCircle
      size={size}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors cursor-help shrink-0",
        helpLink && "cursor-pointer",
        className
      )}
    />
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {helpLink ? (
            <Link
              to={helpLink}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex"
            >
              {icon}
            </Link>
          ) : (
            <span className="inline-flex">{icon}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs">
          <p>{text}</p>
          {helpLink && (
            <p className="text-[10px] text-muted-foreground mt-1">
              💡 클릭하여 자세히 보기
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
