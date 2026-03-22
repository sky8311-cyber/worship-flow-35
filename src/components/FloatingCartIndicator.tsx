import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCartIndicatorProps {
  count: number;
  onClick: () => void;
  label?: string;
}

export const FloatingCartIndicator = ({ count, onClick, label }: FloatingCartIndicatorProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={onClick}
        className="h-14 w-14 rounded-full shadow-lg relative"
        size="icon"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {count > 99 ? "99+" : count}
        </span>
      </Button>
      {label && (
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
};
