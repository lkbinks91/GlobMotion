import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── Raw API shape ─────────────────────────────────────────────────────────────

interface BITArtist {
  name?: string;
  image_url?: string;
  thumb_url?: string;
  genre?: string;
}

interface BITEvent {
  id: string;
  title?: string;
  url?: string;
  datetime?: string;
  venue?: { name?: string };
  offers?: { url?: string; type?: string; status?: string }[];
  artists?: BITArtist[];
}

// ── Genre → vibe mapping ──────────────────────────────────────────────────────

function extractVibes(genres: string[]): string[] {
  const g = genres.join(" ").toLowerCase();
  const vibes: string[] = [];
  if (/rock|metal|punk|hardcore/.test(g))        vibes.push("live music", "energetic", "rock");
  if (/jazz|blues|soul|r&b/.test(g))             vibes.push("chill", "culture", "intimate");
  if (/electronic|techno|house|edm|trance/.test(g)) vibes.push("party", "nightlife", "electronic");
  if (/classical|opera|symphony|chamber/.test(g)) vibes.push("culture", "elegant", "sophisticated");
  if (/reggae|world|folk|afro/.test(g))          vibes.push("chill", "bohemian", "social");
  if (/hip.?hop|rap|trap/.test(g))               vibes.push("live music", "energetic", "urban");
  if (/country|bluegrass/.test(g))               vibes.push("chill", "social", "live music");
  if (!vibes.length)                             vibes.push("live music", "music");
  return [...new Set(vibes)];
}

function normalize(e: BITEvent): UnifiedEvent {
  const genres   = (e.artists ?? []).map((a) => a.genre ?? "").filter(Boolean);
  const imageUrl = e.artists?.[0]?.image_url ?? e.artists?.[0]?.thumb_url ?? null;
  const ticketUrl = e.offers?.find((o) => o.status === "available")?.url ?? e.url ?? null;
  const artistNames = (e.artists ?? []).map((a) => a.name ?? "").filter(Boolean);
  const title = e.title ?? (artistNames.length ? artistNames.join(", ") : "Concert");

  return {
    id:         `bit-${e.id}`,
    title,
    type:       "Concert",
    date:       e.datetime ?? null,
    venue:      e.venue?.name ?? "",
    url:        ticketUrl,
    imageUrl,
    priceRange: null,
    vibes:      extractVibes(genres),
    source:     "bandsintown",
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

const DEFAULT_APP_ID = "globmotion-app";

export class BandsintownAdapter implements EventSourceAdapter {
  readonly name = "bandsintown";

  /** Bandsintown is free — app_id is just a self-declared identifier, no registration needed */
  isAvailable(): boolean {
    return true;
  }

  async fetch(city: string, countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const appId = process.env.BANDSINTOWN_APP_ID ?? DEFAULT_APP_ID;
    const from  = dateRange.from?.toISOString().slice(0, 10)
      ?? new Date().toISOString().slice(0, 10);
    const to    = dateRange.to?.toISOString().slice(0, 10)
      ?? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    const params = new URLSearchParams({
      location:  `${city},${countryCode}`,
      datetime:  `${from}to${to}`,
      app_id:    appId,
      per_page:  "20",
    });

    try {
      const res = await fetch(`https://rest.bandsintown.com/events/search?${params}`, {
        headers: { Accept: "application/json" },
        signal:  AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json() as BITEvent[];
      return Array.isArray(data) ? data.map(normalize) : [];
    } catch {
      return [];
    }
  }
}
