// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "CULTURE"
  | "FOOD"
  | "NATURE"
  | "NIGHTLIFE"
  | "CHILL"
  | "SPORT"
  | "UNIQUE";

export interface TimeBlock {
  time:        string;
  title:       string;
  description: string;
  location?:   string;
  category:    ActivityCategory;
  tip?:        string;
}

export interface ItineraryDay {
  day:       number;
  date:      string;   // ISO date "2026-06-15"
  theme:     string;
  emoji:     string;
  morning:   TimeBlock;
  afternoon: TimeBlock;
  evening:   TimeBlock;
  highlight: string;
}

export interface GeneratedItinerary {
  days:              ItineraryDay[];
  travelTips:        string[];
  bestTimeToArrive:  string;
  packingEssentials: string[];
}

export interface ItineraryParams {
  city:           string;
  country:        string;
  departureDate:  Date;
  returnDate:     Date;
  userPrompt:     string;
  vibes:          string[];
  travelerVibes:  string[];
  activities:     string[];
  hotspots:       string[];
  bestArea:       string;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function cacheKey(p: ItineraryParams): string {
  return [
    "itinerary",
    p.city.toLowerCase().trim(),
    p.country.toLowerCase().trim(),
    p.departureDate.toDateString(),
    p.returnDate.toDateString(),
    [...p.travelerVibes].sort().join(","),
  ].join("__");
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate (or retrieve from 24 h session-cache) a day-by-day itinerary.
 * Calls /api/itinerary on the server — never exposes the API key client-side.
 * @param onProgress - optional callback receiving 0-100 progress estimate
 */
export async function generateItinerary(
  params: ItineraryParams,
  onProgress?: (pct: number) => void,
): Promise<GeneratedItinerary> {
  const key = cacheKey(params);

  // ── Try cache ──────────────────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: GeneratedItinerary; ts: number };
        if (Date.now() - ts < CACHE_TTL_MS) {
          onProgress?.(100);
          return data;
        }
      }
    } catch { /* quota / parse – ignore */ }
  }

  // ── Fetch SSE stream from server route ─────────────────────────────────────
  const res = await fetch("/api/itinerary", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      departureDate: params.departureDate.toISOString(),
      returnDate:    params.returnDate.toISOString(),
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
    throw new Error((err as { error?: string }).error ?? "Erreur serveur");
  }

  // ── Read chunks ────────────────────────────────────────────────────────────
  const days = Math.max(
    1,
    Math.ceil((params.returnDate.getTime() - params.departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const estimatedChars = days * 650 + 400;

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer      = "";

  outer: while (true) {
    const { done, value } = await reader.read();

    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break outer;
      try {
        const parsed = JSON.parse(payload) as { t?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.t) {
          accumulated += parsed.t;
          onProgress?.(Math.min(90, Math.round((accumulated.length / estimatedChars) * 90)));
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }

    if (done) break;
  }

  onProgress?.(95);

  // ── Parse JSON ─────────────────────────────────────────────────────────────
  const cleaned   = accumulated.replace(/```(?:json)?\n?/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse JSON invalide du modèle");

  const data = JSON.parse(jsonMatch[0]) as GeneratedItinerary;

  // ── Persist ────────────────────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* storage quota */ }
  }

  onProgress?.(100);
  return data;
}
