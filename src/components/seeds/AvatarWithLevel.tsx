import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "./LevelBadge";

interface AvatarWithLevelProps {
  userId: string;
  avatarUrl?: string | null;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  className?: string;
}

export const AvatarWithLevel = ({
  userId,
  avatarUrl,
  fallback,
  size = 'md',
  showLevel = true,
  className
}: AvatarWithLevelProps) => {
  const { data: seedData } = useQuery({
    queryKey: ['user-seeds', userId],
    queryFn: async () => {
      const { data: userSeed, error: seedError } = await supabase
        .from('user_seeds')
        .select('current_level, total_seeds')
        .eq('user_id', userId)
        .single();

      if (seedError) return null;

      const { data: levelData } = await supabase
        .from('seed_levels')
        .select('emoji, badge_color')
        .eq('level', userSeed.current_level)
        .single();

      return {
        level: userSeed.current_level,
        emoji: levelData?.emoji || '🌱',
        badgeColor: levelData?.badge_color || '#a3e635'
      };
    },
    enabled: showLevel
  });

  // Default to Level 1 if no data
  const defaultSeedData = {
    level: 1,
    emoji: '🌱',
    badgeColor: '#a3e635'
  };

  const displayData = seedData || defaultSeedData;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Use className for wrapper sizing when provided (for custom large avatars like profile)
  // Otherwise fall back to default size classes
  const wrapperSizeClass = className ? '' : sizeClasses[size];

  return (
    <div className={`relative inline-block ${wrapperSizeClass} ${className || ''}`}>
      <Avatar className="w-full h-full">
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showLevel && (
        <LevelBadge
          level={displayData.level}
          emoji={displayData.emoji}
          badgeColor={displayData.badgeColor}
          size={size}
        />
      )}
    </div>
  );
};
