// ── Types ─────────────────────────────────────────────────────────────────────

export interface UnifiedEvent {
  id: string;
  title: string;
  type: string;
  date: string | null;
  venue: string;
  url: string | null;
  imageUrl: string | null;
  priceRange: string | null;
  vibes: string[];
  source:
    | "ticketmaster"
    | "eventbrite"
    | "seatgeek"
    | "bandsintown"
    | "songkick"
    | "resident_advisor";
  /** Songkick venue capacity bucket */
  scale?: "intimate" | "mid" | "major";
  mood_match_score?: number;
}

export interface EventDateRange {
  from: Date | null;
  to: Date | null;
}

// ── Cache TTL ─────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: UnifiedEvent[];
  ts: number;
}

// ── Mood scoring ──────────────────────────────────────────────────────────────

/**
 * Score a single event against a mood/vibe list.
 * Each matching word in the event's `vibes` array adds 1 point.
 */
function scoreMoodMatch(event: UnifiedEvent, moods: string[]): number {
  if (!moods.length) return 0;
  const eventVibes = event.vibes.join(" ").toLowerCase();
  const eventType = event.type.toLowerCase();
  return moods.reduce((score, mood) => {
    const m = mood.toLowerCase();
    return score + (eventVibes.includes(m) || eventType.includes(m) ? 1 : 0);
  }, 0);
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Fetch events from the /api/events proxy (Ticketmaster + Eventbrite + SeatGeek).
 * Results are cached in sessionStorage for 30 minutes per (city + date range).
 * Optional `moods` list re-scores and re-sorts results without a new network call.
 */
export async function fetchEvents(
  city: string,
  dateRange: EventDateRange,
  moods: string[] = [],
  country = ""
): Promise<UnifiedEvent[]> {
  const from = dateRange.from?.toISOString().slice(0, 10) ?? "";
  const to   = dateRange.to?.toISOString().slice(0, 10)   ?? "";

  const cacheKey = [
    "gevents",
    city.toLowerCase().trim(),
    country.toLowerCase().trim(),
    from,
    to,
  ].join("__");

  // ── Try cache ──────────────────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry;
        if (Date.now() - entry.ts < CACHE_TTL_MS) {
          return applyMoodSort(entry.data, moods);
        }
      }
    } catch { /* quota / parse — ignore */ }
  }

  // ── Fetch from server route ────────────────────────────────────────────────
  try {
    const qs = new URLSearchParams({ city });
    if (country) qs.set("country", country);
    if (from)    qs.set("from", from);
    if (to)      qs.set("to",   to);
    if (moods.length) qs.set("moods", moods.join(","));

    const res = await fetch(`/api/events?${qs}`);
    if (!res.ok) return [];

    const events = (await res.json()) as UnifiedEvent[];

    // Store in sessionStorage
    if (typeof window !== "undefined" && events.length >= 0) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: events, ts: Date.now() } satisfies CacheEntry));
      } catch { /* quota */ }
    }

    return applyMoodSort(events, moods);
  } catch {
    return [];
  }
}

// ── Sort helper ───────────────────────────────────────────────────────────────

function applyMoodSort(events: UnifiedEvent[], moods: string[]): UnifiedEvent[] {
  if (!moods.length) {
    // Sort by date ascending, nulls last
    return [...events].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }

  return [...events]
    .map((ev) => ({ ...ev, mood_match_score: scoreMoodMatch(ev, moods) }))
    .sort((a, b) => {
      const scoreDiff = (b.mood_match_score ?? 0) - (a.mood_match_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      // Secondary: date ascending, nulls last
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
}
