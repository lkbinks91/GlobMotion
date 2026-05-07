import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── Raw API shape ─────────────────────────────────────────────────────────────

interface TMEvent {
  id: string;
  name: string;
  url?: string;
  images?: { url: string; width: number }[];
  dates?: { start?: { dateTime?: string; localDate?: string } };
  priceRanges?: { min: number; max: number; currency: string }[];
  classifications?: { segment?: { name: string }; genre?: { name: string } }[];
  _embedded?: { venues?: { name: string; city?: { name: string } }[] };
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalize(e: TMEvent): UnifiedEvent {
  const cls = e.classifications?.[0];
  const vibes: string[] = [];
  if (cls?.segment?.name) vibes.push(cls.segment.name.toLowerCase());
  if (cls?.genre?.name)   vibes.push(cls.genre.name.toLowerCase());

  const imageUrl = [...(e.images ?? [])].sort((a, b) => b.width - a.width)[0]?.url ?? null;
  const pr       = e.priceRanges?.[0];
  const priceRange = pr ? `${Math.round(pr.min)}–${Math.round(pr.max)} ${pr.currency}` : null;

  return {
    id:         `tm-${e.id}`,
    title:      e.name,
    type:       cls?.segment?.name ?? "Event",
    date:       e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null,
    venue:      e._embedded?.venues?.[0]?.name ?? "",
    url:        e.url ?? null,
    imageUrl,
    priceRange,
    vibes,
    source:     "ticketmaster",
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class TicketmasterAdapter implements EventSourceAdapter {
  readonly name = "ticketmaster";

  isAvailable(): boolean {
    return !!process.env.TICKETMASTER_API_KEY;
  }

  async fetch(city: string, _countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const key  = process.env.TICKETMASTER_API_KEY!;
    const from = dateRange.from?.toISOString() ?? "";
    const to   = dateRange.to?.toISOString()   ?? "";

    const params = new URLSearchParams({ apikey: key, city, size: "20" });
    if (from) params.set("startDateTime", from.slice(0, 19) + "Z");
    if (to)   params.set("endDateTime",   to.slice(0, 19)   + "Z");

    try {
      const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const events: TMEvent[] = data?._embedded?.events ?? [];
      return events.map(normalize);
    } catch {
      return [];
    }
  }
}
