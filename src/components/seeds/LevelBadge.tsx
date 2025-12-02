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
    sm: 'w-3 h-3 text-[6px]',
    md: 'w-3.5 h-3.5 text-[7px]',
    lg: 'w-4 h-4 text-[8px]'
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
