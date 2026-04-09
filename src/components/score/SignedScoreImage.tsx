import { useState, useCallback, useRef } from "react";
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
  const lastSrc = useRef<string | null>(null);

  // Resolve signed URL when src changes
  if (src !== lastSrc.current) {
    lastSrc.current = src;
    retryCount.current = 0;
    setResolved(false);
    setSignedSrc(null);

    if (src) {
      getSignedScoreUrl(src).then((url) => {
        // Only update if src hasn't changed since
        if (lastSrc.current === src) {
          setSignedSrc(url);
          setResolved(true);
        }
      });
    } else {
      setResolved(true);
    }
  }

  const handleError = useCallback(() => {
    if (retryCount.current < 2 && lastSrc.current) {
      retryCount.current += 1;
      const currentSrc = lastSrc.current;
      getSignedScoreUrl(currentSrc).then((url) => {
        if (lastSrc.current === currentSrc) {
          setSignedSrc(url);
        }
      });
    }
  }, []);

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
