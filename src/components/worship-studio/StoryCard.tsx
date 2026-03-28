import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Music, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import type { StoryStudio } from "@/hooks/useStoryBarStudios";
import { cn } from "@/lib/utils";

interface StoryCardProps {
  studios: StoryStudio[];
  initialIndex: number;
  onClose: () => void;
  onVisit: (roomId: string) => void;
}

const AUTO_ADVANCE_MS = 4000;

export function StoryCard({ studios, initialIndex, onClose, onVisit }: StoryCardProps) {
  const { language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const studio = studios[currentIndex];
  if (!studio) {
    onClose();
    return null;
  }

  const goNext = useCallback(() => {
    if (currentIndex < studios.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, studios.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (AUTO_ADVANCE_MS / 50));
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [paused, goNext, currentIndex]);

  // Reset progress on index change
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const timeAgo = studio.latestPostAt
    ? formatDistanceToNow(new Date(studio.latestPostAt), {
        addSuffix: true,
        locale: language === "ko" ? ko : enUS,
      })
    : null;

  const handleTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else if (x > (rect.width * 2) / 3) {
      goNext();
    } else {
      setPaused(p => !p);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      {/* Card */}
      <div
        className="relative w-full max-w-md h-[85vh] max-h-[700px] mx-4 rounded-2xl overflow-hidden bg-card flex flex-col"
        onClick={handleTap}
      >
        {/* Background */}
        {studio.coverImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${studio.coverImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-muted" />
        )}

        {/* Progress bars */}
        <div className="relative z-10 flex gap-1 px-3 pt-3">
          {studios.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-foreground/20 overflow-hidden">
              <div
                className="h-full bg-foreground/80 transition-none"
                style={{
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-2">
          <Avatar className="h-10 w-10 border-2 border-background/50">
            <AvatarImage src={studio.avatarUrl || undefined} />
            <AvatarFallback className="text-sm">
              {studio.isSelf ? "나" : (studio.ownerName?.charAt(0) || "?")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-semibold text-sm truncate",
              studio.coverImageUrl ? "text-white" : "text-foreground"
            )}>
              {studio.isSelf
                ? (language === "ko" ? "나의 스튜디오" : "My Studio")
                : (studio.ownerName || "")}
            </p>
            {timeAgo && (
              <p className={cn(
                "text-xs truncate",
                studio.coverImageUrl ? "text-white/70" : "text-muted-foreground"
              )}>
                {timeAgo}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0",
              studio.coverImageUrl ? "text-white hover:bg-white/20" : ""
            )}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 gap-4">
          {studio.latestPostTitle ? (
            <>
              <h2 className={cn(
                "text-2xl font-bold leading-tight",
                studio.coverImageUrl ? "text-white" : "text-foreground"
              )}>
                {studio.latestPostTitle}
              </h2>
              {studio.latestPostContent && (
                <p className={cn(
                  "text-sm leading-relaxed line-clamp-4",
                  studio.coverImageUrl ? "text-white/80" : "text-muted-foreground"
                )}>
                  {studio.latestPostContent.slice(0, 100)}
                </p>
              )}
            </>
          ) : (
            <p className={cn(
              "text-lg text-center",
              studio.coverImageUrl ? "text-white/60" : "text-muted-foreground"
            )}>
              {language === "ko" ? "아직 게시물이 없습니다" : "No posts yet"}
            </p>
          )}

          {/* Status */}
          {studio.statusEmoji && studio.statusText && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              studio.coverImageUrl ? "text-white/70" : "text-muted-foreground"
            )}>
              <span className="text-lg">{studio.statusEmoji}</span>
              <span>{studio.statusText}</span>
            </div>
          )}

          {/* BGM */}
          {studio.bgmSongTitle && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              studio.coverImageUrl ? "text-white/70" : "text-muted-foreground"
            )}>
              <Music className="h-4 w-4 shrink-0" />
              <span className="truncate">♪ {studio.bgmSongTitle}</span>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="relative z-10 px-6 pb-6">
          <Button
            className="w-full gap-2"
            onClick={(e) => { e.stopPropagation(); onVisit(studio.id); }}
          >
            {language === "ko" ? "스튜디오 방문하기" : "Visit Studio"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
