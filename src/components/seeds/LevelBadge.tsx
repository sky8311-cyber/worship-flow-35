import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  emoji: string;
  badgeColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LevelBadge = ({ level, emoji, badgeColor, size = 'md', className }: LevelBadgeProps) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-6 h-6 text-[9px]',
    lg: 'w-8 h-8 text-xs'
  };

  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 rounded-full border-2 border-background bg-white flex items-center justify-center font-bold shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      <span>
        {emoji}
      </span>
    </div>
  );
};
