import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── Raw API shape ─────────────────────────────────────────────────────────────

interface SGEvent {
  id: string | number;
  title: string;
  url?: string;
  datetime_utc?: string;
  performers?: { image?: string; genres?: { name: string }[] }[];
  venue?: { name_v2?: string; display_location?: string };
  stats?: { lowest_price?: number; highest_price?: number };
  type?: string;
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalize(e: SGEvent): UnifiedEvent {
  const genres   = (e.performers ?? []).flatMap((p) => (p.genres ?? []).map((g) => g.name));
  const vibes    = genres.length ? genres.map((g) => g.toLowerCase()) : ["live event"];
  const imageUrl = e.performers?.[0]?.image ?? null;
  const lo       = e.stats?.lowest_price;
  const hi       = e.stats?.highest_price;
  const priceRange = lo != null ? (hi != null && hi !== lo ? `$${lo}–$${hi}` : `$${lo}`) : null;

  return {
    id:         `sg-${e.id}`,
    title:      e.title,
    type:       e.type ?? "Event",
    date:       e.datetime_utc ?? null,
    venue:      e.venue?.name_v2 ?? e.venue?.display_location ?? "",
    url:        e.url ?? null,
    imageUrl,
    priceRange,
    vibes,
    source:     "seatgeek",
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class SeatGeekAdapter implements EventSourceAdapter {
  readonly name = "seatgeek";

  isAvailable(): boolean {
    return !!process.env.SEATGEEK_CLIENT_ID;
  }

  async fetch(city: string, _countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const clientId     = process.env.SEATGEEK_CLIENT_ID!;
    const clientSecret = process.env.SEATGEEK_CLIENT_SECRET ?? "";
    const from = dateRange.from?.toISOString().slice(0, 10) ?? "";
    const to   = dateRange.to?.toISOString().slice(0, 10)   ?? "";

    const params = new URLSearchParams({
      "venue.city": city,
      client_id:     clientId,
      client_secret: clientSecret,
      per_page:      "20",
    });
    if (from) params.set("datetime_utc.gte", from);
    if (to)   params.set("datetime_utc.lte", to);

    try {
      const res = await fetch(`https://api.seatgeek.com/2/events?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const events: SGEvent[] = data?.events ?? [];
      return events.map(normalize);
    } catch {
      return [];
    }
  }
}
