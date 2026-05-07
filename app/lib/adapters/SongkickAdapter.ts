import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface SKLocation {
  metroArea: { id: number; displayName: string };
}

interface SKVenue {
  displayName?: string;
  capacity?: number;
}

interface SKArtist {
  displayName?: string;
}

interface SKEvent {
  id: string | number;
  displayName?: string;
  type?: string;
  start?: { date?: string; datetime?: string };
  uri?: string;
  venue?: SKVenue;
  performance?: { artist?: SKArtist; billing?: string }[];
}

// ── Capacity → event scale ───────────────────────────────────────────────────

function capacityToScale(capacity?: number): "intimate" | "mid" | "major" | undefined {
  if (!capacity) return undefined;
  if (capacity < 500)  return "intimate";
  if (capacity < 5000) return "mid";
  return "major";
}

// ── Event type → vibes ────────────────────────────────────────────────────────

function typeToVibes(type?: string): string[] {
  if (type === "Festival") return ["festival", "social", "music"];
  return ["live music", "concert", "music"];
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalize(e: SKEvent): UnifiedEvent {
  const artists = (e.performance ?? []).map((p) => p.artist?.displayName ?? "").filter(Boolean);
  const title   = e.displayName ?? (artists.length ? artists.join(", ") : "Event");
  const scale   = capacityToScale(e.venue?.capacity);

  const vibes   = typeToVibes(e.type);
  if (scale === "intimate") vibes.push("intimate");
  if (scale === "major")    vibes.push("festival", "crowd");

  return {
    id:         `sk-${e.id}`,
    title,
    type:       e.type ?? "Concert",
    date:       e.start?.datetime ?? e.start?.date ?? null,
    venue:      e.venue?.displayName ?? "",
    url:        e.uri ?? null,
    imageUrl:   null,
    priceRange: null,
    vibes,
    scale,
    source:     "songkick",
  };
}

// ── In-memory metro area cache (per process) ──────────────────────────────────

const metroCache = new Map<string, number | null>();

async function resolveMetroId(apiKey: string, city: string): Promise<number | null> {
  const cacheKey = city.toLowerCase();
  if (metroCache.has(cacheKey)) return metroCache.get(cacheKey)!;

  try {
    const params = new URLSearchParams({ query: city, apikey: apiKey });
    const res = await fetch(`https://api.songkick.com/api/3.0/search/locations.json?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) { metroCache.set(cacheKey, null); return null; }
    const data = await res.json();
    const locations: SKLocation[] = data?.resultsPage?.results?.location ?? [];
    const id = locations[0]?.metroArea?.id ?? null;
    metroCache.set(cacheKey, id);
    return id;
  } catch {
    metroCache.set(cacheKey, null);
    return null;
  }
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class SongkickAdapter implements EventSourceAdapter {
  readonly name = "songkick";

  isAvailable(): boolean {
    return !!process.env.SONGKICK_API_KEY;
  }

  async fetch(city: string, _countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const apiKey = process.env.SONGKICK_API_KEY!;
    const from   = dateRange.from?.toISOString().slice(0, 10) ?? "";
    const to     = dateRange.to?.toISOString().slice(0, 10)   ?? "";

    // Step 1: resolve metro area
    const metroId = await resolveMetroId(apiKey, city);
    if (!metroId) return [];

    // Step 2: fetch festivals first, then concerts — merge, dedup
    const fetchType = async (type: "Festival" | "Concert") => {
      const params = new URLSearchParams({ apikey: apiKey, type });
      if (from) params.set("min_date", from);
      if (to)   params.set("max_date", to);

      const res = await fetch(
        `https://api.songkick.com/api/3.0/metro_areas/${metroId}/calendar.json?${params}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [] as SKEvent[];
      const data = await res.json();
      return (data?.resultsPage?.results?.event ?? []) as SKEvent[];
    };

    try {
      const [festivals, concerts] = await Promise.allSettled([
        fetchType("Festival"),
        fetchType("Concert"),
      ]);

      const all: SKEvent[] = [
        ...(festivals.status === "fulfilled" ? festivals.value : []),
        ...(concerts.status  === "fulfilled" ? concerts.value  : []),
      ];

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = all.filter((e) => {
        const key = String(e.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique.map(normalize);
    } catch {
      return [];
    }
  }
}
