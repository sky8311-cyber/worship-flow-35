import { useState, useEffect, useCallback, useRef } from "react";
import { getSignedScoreUrl, getSignedScoreUrls, extractScorePath } from "@/utils/scoreUrl";

/**
 * Hook to convert a single score URL to a signed URL.
 * Includes automatic retry on image load failure (for expired URLs).
 */
export function useSignedScoreUrl(originalUrl: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const retryCount = useRef(0);

  const refresh = useCallback(async () => {
    if (!originalUrl) {
      setSignedUrl(null);
      return;
    }
    setLoading(true);
    try {
      const url = await getSignedScoreUrl(originalUrl);
      setSignedUrl(url);
      retryCount.current = 0;
    } finally {
      setLoading(false);
    }
  }, [originalUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // onError handler for <img> tags — auto-regenerates signed URL
  const handleImageError = useCallback(() => {
    if (retryCount.current < 2) {
      retryCount.current += 1;
      refresh();
    }
  }, [refresh]);

  return { signedUrl, loading, handleImageError, refresh };
}

/**
 * Hook to batch-convert multiple score URLs to signed URLs.
 * Returns a Map from original URL → signed URL.
 */
export function useSignedScoreUrls(originalUrls: string[]) {
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const prevKey = useRef("");

  const refresh = useCallback(async () => {
    if (originalUrls.length === 0) {
      setUrlMap(new Map());
      return;
    }
    setLoading(true);
    try {
      const map = await getSignedScoreUrls(originalUrls);
      setUrlMap(map);
    } finally {
      setLoading(false);
    }
  }, [originalUrls.join(",")]);

  useEffect(() => {
    const key = originalUrls.join(",");
    if (key !== prevKey.current) {
      prevKey.current = key;
      refresh();
    }
  }, [originalUrls.join(","), refresh]);

  const getSignedUrl = useCallback(
    (original: string) => urlMap.get(original) || original,
    [urlMap]
  );

  return { urlMap, getSignedUrl, loading, refresh };
}
