import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = "scores";
const SIGNED_URL_EXPIRY = 14400; // 4 hours in seconds

// In-memory cache for signed URLs to avoid redundant API calls
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_BUFFER = 300_000; // 5 minutes buffer before expiry

/**
 * Synchronously check if a signed URL is already cached.
 * Returns the cached URL or null if not cached / expired.
 */
export function getCachedSignedUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  // External URLs (e.g. naver blog hotlinks) are used as-is — no signing needed
  if (isExternalUrl(urlOrPath)) return urlOrPath;
  const path = extractScorePath(urlOrPath);
  if (!path) return null;
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + CACHE_BUFFER) {
    return cached.url;
  }
  return null;
}

/**
 * Extract the storage path from a full public URL or return the path as-is.
 * Handles both old public URLs and new path-only values.
 * 
 * Examples:
 *   "https://xxx.supabase.co/storage/v1/object/public/scores/abc.png" → "abc.png"
 *   "abc.png" → "abc.png"
 *   "/scores/abc.png" → "abc.png"
 *   null → null
 */
export function extractScorePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath || urlOrPath.trim() === "") return null;

  // Full public URL pattern
  const publicPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = urlOrPath.indexOf(publicPrefix);
  if (idx !== -1) {
    return decodeURIComponent(urlOrPath.slice(idx + publicPrefix.length));
  }

  // Signed URL pattern (also contains the path)
  const signedPrefix = `/storage/v1/object/sign/${BUCKET}/`;
  const signedIdx = urlOrPath.indexOf(signedPrefix);
  if (signedIdx !== -1) {
    const pathWithQuery = urlOrPath.slice(signedIdx + signedPrefix.length);
    return decodeURIComponent(pathWithQuery.split("?")[0]);
  }

  // External URL (not our storage) — not a storage path
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return null;
  }

  // Already a path (no http)
  // Remove leading bucket name if present
  if (urlOrPath.startsWith(`${BUCKET}/`)) {
    return urlOrPath.slice(BUCKET.length + 1);
  }
  return urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
}

/**
 * Returns true if value is an external (non-Supabase-storage) URL.
 */
export function isExternalUrl(urlOrPath: string | null | undefined): boolean {
  if (!urlOrPath) return false;
  if (!urlOrPath.startsWith("http://") && !urlOrPath.startsWith("https://")) return false;
  // It's http(s) — only "ours" if it contains our storage prefix
  return urlOrPath.indexOf(`/storage/v1/object/public/${BUCKET}/`) === -1
    && urlOrPath.indexOf(`/storage/v1/object/sign/${BUCKET}/`) === -1;
}

/**
 * Generate a signed URL for a score file.
 * Accepts either a full public URL or a storage path.
 * Returns the original value if path extraction fails.
 * Includes in-memory caching to avoid redundant API calls.
 */
export async function getSignedScoreUrl(urlOrPath: string | null | undefined): Promise<string | null> {
  if (!urlOrPath) return null;

  // External URL — return as-is, no signing needed
  if (isExternalUrl(urlOrPath)) return urlOrPath;

  const path = extractScorePath(urlOrPath);
  if (!path) return null;

  // Check cache
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + CACHE_BUFFER) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) {
      console.warn("[scoreUrl] Failed to create signed URL for:", path, error);
      // Fallback: return original URL (works while bucket is still public)
      return urlOrPath;
    }

    // Cache the result
    signedUrlCache.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_EXPIRY * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.warn("[scoreUrl] Error creating signed URL:", err);
    return urlOrPath;
  }
}

/**
 * Batch-generate signed URLs for multiple score files.
 * Returns a Map from original URL/path to signed URL.
 */
export async function getSignedScoreUrls(
  urls: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const toSign: Array<{ original: string; path: string }> = [];

  for (const url of urls) {
    if (!url) continue;
    // External URL — pass through
    if (isExternalUrl(url)) {
      result.set(url, url);
      continue;
    }
    const path = extractScorePath(url);
    if (!path) continue;

    // Check cache first
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > Date.now() + CACHE_BUFFER) {
      result.set(url, cached.url);
    } else {
      toSign.push({ original: url, path });
    }
  }

  if (toSign.length === 0) return result;

  // Use batch API
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        toSign.map((s) => s.path),
        SIGNED_URL_EXPIRY
      );

    if (error || !data) {
      console.warn("[scoreUrl] Batch signed URL error:", error);
      // Fallback: return originals
      toSign.forEach((s) => result.set(s.original, s.original));
      return result;
    }

    data.forEach((item, idx) => {
      const { original, path } = toSign[idx];
      if (item.signedUrl) {
        result.set(original, item.signedUrl);
        signedUrlCache.set(path, {
          url: item.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_EXPIRY * 1000,
        });
      } else {
        result.set(original, original);
      }
    });
  } catch (err) {
    console.warn("[scoreUrl] Batch error:", err);
    toSign.forEach((s) => result.set(s.original, s.original));
  }

  return result;
}

/**
 * Fetch signed score URLs for PublicBandView (unauthenticated).
 * Calls the get-signed-score-urls Edge Function.
 */
export async function getPublicSignedScoreUrls(
  shareToken: string,
  paths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-signed-score-urls`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_token: shareToken, paths }),
      }
    );

    if (!response.ok) {
      console.warn("[scoreUrl] Public signed URL fetch failed:", response.status);
      paths.forEach((p) => result.set(p, p));
      return result;
    }

    const data = await response.json();
    if (data.urls) {
      for (const [path, signedUrl] of Object.entries(data.urls)) {
        result.set(path, signedUrl as string);
      }
    }
  } catch (err) {
    console.warn("[scoreUrl] Public signed URL error:", err);
    paths.forEach((p) => result.set(p, p));
  }

  return result;
}
