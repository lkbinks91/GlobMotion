import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── Raw API shape ─────────────────────────────────────────────────────────────

interface EBEvent {
  id: string;
  name: { text: string };
  url?: string;
  start?: { utc: string };
  logo?: { url: string };
  category?: { short_name: string };
  venue?: { name: string };
  ticket_availability?: {
    minimum_ticket_price?: { display: string };
    maximum_ticket_price?: { display: string };
  };
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalize(e: EBEvent): UnifiedEvent {
  const vibes: string[] = [];
  if (e.category?.short_name) vibes.push(e.category.short_name.toLowerCase());

  const prMin = e.ticket_availability?.minimum_ticket_price?.display;
  const prMax = e.ticket_availability?.maximum_ticket_price?.display;
  const priceRange = prMin && prMax ? `${prMin} – ${prMax}` : prMin ?? prMax ?? null;

  return {
    id:         `eb-${e.id}`,
    title:      e.name.text,
    type:       e.category?.short_name ?? "Event",
    date:       e.start?.utc ?? null,
    venue:      e.venue?.name ?? "",
    url:        e.url ?? null,
    imageUrl:   e.logo?.url ?? null,
    priceRange,
    vibes,
    source:     "eventbrite",
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class EventbriteAdapter implements EventSourceAdapter {
  readonly name = "eventbrite";

  isAvailable(): boolean {
    return !!process.env.EVENTBRITE_API_KEY;
  }

  async fetch(city: string, _countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const key  = process.env.EVENTBRITE_API_KEY!;
    const from = dateRange.from?.toISOString() ?? "";
    const to   = dateRange.to?.toISOString()   ?? "";

    const params = new URLSearchParams({
      "location.address": city,
      "location.within": "50km",
      expand: "venue,category,ticket_availability",
      page_size: "20",
    });
    if (from) params.set("start_date.range_start", from.slice(0, 19) + "Z");
    if (to)   params.set("start_date.range_end",   to.slice(0, 19)   + "Z");

    try {
      const res = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params}`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const events: EBEvent[] = data?.events ?? [];
      return events.map(normalize);
    } catch {
      return [];
    }
  }
}
