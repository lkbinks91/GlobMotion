// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlightResult {
  id:             string;
  price:          number;
  currency:       string;
  airline:        string;
  airlineLogo?:   string;
  departure:      { airport: string; time: Date };
  arrival:        { airport: string; time: Date };
  /** Human-readable duration, e.g. "7h 35m" */
  duration:       string;
  stops:          number;
  bookingUrl:     string;
  source:         "skyscanner";
  isDirectFlight: boolean;
  co2kg?:         number;
}

export interface FlightSearchParams {
  originCity:      string;
  destinationCity: string;
  departureDate:   Date;
  returnDate:      Date;
  currency?:       string;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: Array<Omit<FlightResult, "departure" | "arrival"> & {
    departure: { airport: string; time: string };
    arrival:   { airport: string; time: string };
  }>;
  ts: number;
}

// ── Main fetch function ───────────────────────────────────────────────────────

/**
 * Search for flights between two cities.
 * Caches results in sessionStorage for 30 min.
 * Always returns [] on any error — never throws.
 */
export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightResult[]> {
  const {
    originCity,
    destinationCity,
    departureDate,
    returnDate,
    currency = "EUR",
  } = params;

  const cacheKey = [
    "flights",
    originCity.toLowerCase().trim(),
    destinationCity.toLowerCase().trim(),
    departureDate.toDateString(),
    returnDate.toDateString(),
    currency,
  ].join("__");

  // ── Try sessionStorage cache ───────────────────────────────────────────────
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry;
        if (Date.now() - entry.ts < CACHE_TTL_MS) {
          return hydrateResults(entry.data);
        }
      }
    } catch { /* quota / parse errors — ignore */ }
  }

  // ── Fetch from server route ────────────────────────────────────────────────
  try {
    const qs = new URLSearchParams({
      from:     originCity,
      to:       destinationCity,
      depart:   departureDate.toISOString(),
      return:   returnDate.toISOString(),
      currency,
    });

    const res = await fetch(`/api/flights?${qs}`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];

    const raw = (await res.json()) as CacheEntry["data"];

    // Cache raw (serializable) form
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: raw, ts: Date.now() } satisfies CacheEntry));
      } catch { /* quota */ }
    }

    return hydrateResults(raw);
  } catch {
    return [];
  }
}

// ── Hydrate ISO strings → Date objects ────────────────────────────────────────

function hydrateResults(raw: CacheEntry["data"]): FlightResult[] {
  return raw.map((f) => ({
    ...f,
    departure: { airport: f.departure.airport, time: new Date(f.departure.time) },
    arrival:   { airport: f.arrival.airport,   time: new Date(f.arrival.time) },
  }));
}

// ── Origin city extraction from user prompt ───────────────────────────────────

/**
 * Best-effort extraction of the departure city from a free-text travel prompt.
 * Handles common French and English patterns:
 *   "depuis Paris", "from London", "au départ de Lyon",
 *   "partant de Montréal", "en partant de Berlin", "flying from Tokyo"
 */
export function extractOriginCity(prompt: string): string | null {
  const patterns = [
    /\bau\s+d[eé]part\s+d[e']\s*([A-Za-zÀ-ÿ\s-]+?)(?=\s*[,.]|\s+(?:pour|vers|en|à|et|le|la|les)\b|$)/i,
    /\bpartant\s+d[e']\s*([A-Za-zÀ-ÿ\s-]+?)(?=\s*[,.]|\s+(?:pour|vers|en|à|et|le|la|les)\b|$)/i,
    /\bdepuis\s+([A-Za-zÀ-ÿ\s-]+?)(?=\s*[,.]|\s+(?:pour|vers|en|à|et|je|je|qui|ou|avec)\b|$)/i,
    /\bfrom\s+([A-Za-zA-Za-z\s-]+?)(?=\s*[,.]|\s+(?:to|for|on|in|at)\b|$)/i,
    /\bflying\s+from\s+([A-Za-z\s-]+?)(?=\s*[,.]|\s+(?:to|for|in|on)\b|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const city = match[1].trim().replace(/\s+/g, " ");
      // Ignore very short/generic matches
      if (city.length >= 2 && city.length <= 40) return city;
    }
  }
  return null;
}
