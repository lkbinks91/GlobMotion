export interface MediaItem {
  id: string;
  url: string;
  thumbUrl: string;
  author: string;
  authorUrl?: string | null;
  source: "unsplash" | "pexels";
  alt: string;
  type: "photo" | "video";
  videoUrl?: string | null;
}

/**
 * Fetches destination media (photos + optional videos) from the server-side
 * /api/media route. Results are cached in sessionStorage per city+country pair
 * to avoid redundant API calls during the same browser session.
 */
export async function fetchDestinationMedia(
  cityName: string,
  count = 7,
  country?: string | null
): Promise<MediaItem[]> {
  if (!cityName.trim()) return [];

  const cacheKey = `gmedia__${cityName.toLowerCase().trim()}__${(country ?? "").toLowerCase()}__${count}`;

  // ── sessionStorage cache ──────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) return JSON.parse(hit) as MediaItem[];
    } catch { /* ignore quota / parse errors */ }
  }

  // ── Fetch from API route ──────────────────────────────────────────────────
  try {
    const params = new URLSearchParams({ city: cityName, count: String(count) });
    if (country) params.set("country", country);

    const res = await fetch(`/api/media?${params.toString()}`);
    if (!res.ok) return [];

    const items: MediaItem[] = await res.json();

    // Persist to cache
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* quota */ }
    }

    return items;
  } catch {
    return [];
  }
}
