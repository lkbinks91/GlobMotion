import type { EventSourceAdapter, EventDateRange } from "./EventSourceAdapter";
import type { UnifiedEvent } from "../EventAggregatorService";

// ── City → RA Area ID map ─────────────────────────────────────────────────────
// RA numeric area IDs for top party/nightlife destinations.
// Extend this map as needed: find IDs by inspecting https://ra.co/graphql responses.

const CITY_TO_RA_AREA_ID: Record<string, number> = {
  // Europe
  amsterdam:   10,
  barcelona:   13,
  berlin:      29,
  brussels:    36,
  budapest:    93,
  copenhagen:  49,
  dublin:      28,
  glasgow:     34,
  ibiza:       61,
  lisbon:      46,
  london:      13,
  madrid:      37,
  manchester:  31,
  milan:       44,
  mykonos:     48,
  paris:       27,
  prague:      54,
  rome:        45,
  split:       103,
  stockholm:   58,
  vienna:      53,
  warsaw:      76,
  zurich:      55,
  // North America
  chicago:     18,
  detroit:     19,
  "los angeles": 15,
  miami:       22,
  montreal:    25,
  "new york":  8,
  "san francisco": 17,
  toronto:     24,
  // Oceania
  melbourne:   56,
  sydney:      65,
  // Asia
  "hong kong": 86,
  tokyo:       83,
  singapore:   84,
  // South America
  "buenos aires": 78,
  "são paulo": 79,
};

function resolveAreaId(city: string): number | null {
  const lower = city.toLowerCase();
  // Exact match first
  if (CITY_TO_RA_AREA_ID[lower] !== undefined) return CITY_TO_RA_AREA_ID[lower];
  // Partial match
  for (const [key, id] of Object.entries(CITY_TO_RA_AREA_ID)) {
    if (lower.includes(key) || key.includes(lower)) return id;
  }
  return null;
}

// ── GraphQL query ─────────────────────────────────────────────────────────────

const RA_QUERY = `
  query listing($filters: FilterInputDtoInput, $pageSize: Int) {
    listing(filters: $filters, pageSize: $pageSize) {
      data {
        id
        title
        date
        startTime
        endTime
        venue { name address { city country } }
        artists { name }
        images { filename }
        tickets { buyUrl }
      }
    }
  }
`;

// ── Raw RA shape ──────────────────────────────────────────────────────────────

interface RAVenue {
  name?: string;
  address?: { city?: string; country?: string };
}

interface RAEvent {
  id: string | number;
  title?: string;
  date?: string;
  startTime?: string;
  venue?: RAVenue;
  artists?: { name?: string }[];
  images?: { filename?: string }[];
  tickets?: { buyUrl?: string }[];
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalize(e: RAEvent): UnifiedEvent {
  const imageFilename = e.images?.[0]?.filename;
  const imageUrl = imageFilename
    ? `https://ra.co${imageFilename.startsWith("/") ? "" : "/"}${imageFilename}`
    : null;

  const ticketUrl = e.tickets?.[0]?.buyUrl ?? null;
  const date = e.date
    ? (e.startTime ? `${e.date}T${e.startTime}` : e.date)
    : null;

  return {
    id:         `ra-${e.id}`,
    title:      e.title ?? "RA Event",
    type:       "Club Night",
    date,
    venue:      e.venue?.name ?? "",
    url:        ticketUrl ?? `https://ra.co/events/${e.id}`,
    imageUrl,
    priceRange: null,
    vibes:      ["electronic", "nightlife", "party", "club"],
    source:     "resident_advisor",
  };
}

// ── Exponential backoff fetch ─────────────────────────────────────────────────

async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
    try {
      const res = await fetch(url, init);
      if (res.status === 429) {
        lastError = new Error("Rate limited");
        continue; // retry
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class ResidentAdvisorAdapter implements EventSourceAdapter {
  readonly name = "resident_advisor";

  /** RA's GraphQL is public (unofficial) — no API key required */
  isAvailable(): boolean {
    return true;
  }

  async fetch(city: string, _countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]> {
    const areaId = resolveAreaId(city);
    if (!areaId) return []; // unsupported city

    const startDate = dateRange.from?.toISOString().slice(0, 10)
      ?? new Date().toISOString().slice(0, 10);
    const endDate = dateRange.to?.toISOString().slice(0, 10)
      ?? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    const body = JSON.stringify({
      operationName: "listing",
      query: RA_QUERY,
      variables: {
        pageSize: 20,
        filters: {
          areas:       { eq: areaId },
          listingDate: { gte: startDate, lte: endDate },
        },
      },
    });

    try {
      const res = await fetchWithBackoff("https://ra.co/graphql", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Accept:          "application/json",
          // Mimic browser to reduce bot-blocking
          "User-Agent": "Mozilla/5.0 (compatible; GlobMotion/1.0)",
          Referer:      "https://ra.co/events",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const events: RAEvent[] = json?.data?.listing?.data ?? [];
      return events.map(normalize);
    } catch {
      return [];
    }
  }
}
