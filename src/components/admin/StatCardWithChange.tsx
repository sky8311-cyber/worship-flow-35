import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface StatCardWithChangeProps {
  title: string;
  currentValue: number;
  previousValue: number;
  icon: LucideIcon;
  color: string;
  compareLabel: string;
  isLoading?: boolean;
}

export function StatCardWithChange({
  title,
  currentValue,
  previousValue,
  icon: Icon,
  color,
  compareLabel,
  isLoading = false,
}: StatCardWithChangeProps) {
  const { language } = useTranslation();

  const change = currentValue - previousValue;
  const changePercent = previousValue > 0
    ? ((change / previousValue) * 100).toFixed(1)
    : currentValue > 0 ? "100" : "0";

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-muted rounded-lg" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <div className="text-2xl font-bold">{formatNumber(currentValue)}</div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">{title}</p>
        
        <div className="flex items-center gap-1.5">
          {isPositive && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">+{change} (+{changePercent}%)</span>
            </div>
          )}
          {isNegative && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{change} ({changePercent}%)</span>
            </div>
          )}
          {isNeutral && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Minus className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">0 (0%)</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">
          {compareLabel}: {formatNumber(previousValue)}
        </p>
      </CardContent>
    </Card>
  );
}
