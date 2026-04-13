import { useState, useCallback, useRef, useEffect } from "react";
import { getSignedScoreUrl } from "@/utils/scoreUrl";
import { cn } from "@/lib/utils";

interface SignedScoreImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * An <img> wrapper that automatically converts a score URL to a signed URL.
 * On load failure (e.g. expired URL), it auto-retries once with a fresh signed URL.
 */
export function SignedScoreImage({
  src,
  alt,
  className,
  loading = "lazy",
  draggable,
  style,
  onClick,
}: SignedScoreImageProps) {
  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const retryCount = useRef(0);

  // Resolve signed URL when src changes (using useEffect instead of render-time state setting)
  useEffect(() => {
    let cancelled = false;
    retryCount.current = 0;
    setResolved(false);
    setSignedSrc(null);

    if (src) {
      getSignedScoreUrl(src).then((url) => {
        if (!cancelled) {
          setSignedSrc(url);
          setResolved(true);
        }
      });
    } else {
      setResolved(true);
    }

    return () => { cancelled = true; };
  }, [src]);

  const handleError = useCallback(() => {
    if (retryCount.current < 2 && src) {
      retryCount.current += 1;
      getSignedScoreUrl(src).then((url) => {
        setSignedSrc(url);
      });
    }
  }, [src]);

  if (!resolved || !signedSrc) {
    // Show a minimal placeholder while loading
    return (
      <div className={cn("bg-muted animate-pulse", className)} style={style} />
    );
  }

  return (
    <img
      src={signedSrc}
      alt={alt}
      className={className}
      loading={loading}
      draggable={draggable}
      style={style}
      onClick={onClick}
      onError={handleError}
    />
  );
}
