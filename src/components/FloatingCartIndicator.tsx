import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCartIndicatorProps {
  count: number;
  onClick: () => void;
}

export const FloatingCartIndicator = ({ count, onClick }: FloatingCartIndicatorProps) => {
  if (count === 0) return null;

  return (
    <Button
      onClick={onClick}
      className="h-14 w-14 rounded-full shadow-lg relative"
      size="icon"
    >
      <Music className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {count > 99 ? "99+" : count}
      </span>
    </Button>
  );
};
