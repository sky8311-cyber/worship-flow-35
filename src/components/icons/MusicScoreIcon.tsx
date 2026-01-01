import musicScoreIcon from "@/assets/icons/music-score.png";

interface MusicScoreIconProps {
  className?: string;
}

export const MusicScoreIcon = ({ className = "w-4 h-4" }: MusicScoreIconProps) => (
  <img 
    src={musicScoreIcon} 
    alt="Score" 
    className={className}
  />
);
