import { NextRequest, NextResponse } from "next/server";
import type { FlightResult } from "@/app/lib/FlightSearchService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Serializable form (Date → string) for JSON transport ─────────────────────

type FlightResultRaw = Omit<FlightResult, "departure" | "arrival"> & {
  departure: { airport: string; time: string };
  arrival:   { airport: string; time: string };
};

// ── Sky Scrapper (Skyscanner via RapidAPI) ────────────────────────────────────

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const LOC_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface LocEntry { skyId: string; entityId: string; ts: number }
const locCache = new Map<string, LocEntry>();

function rapidHeaders(): Record<string, string> {
  return {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key":  process.env.RAPIDAPI_KEY ?? "",
  };
}

// ── Location resolution (city → skyId + entityId) ────────────────────────────

interface SkyLocation {
  skyId:    string;
  entityId: string;
}

async function resolveLocation(city: string): Promise<SkyLocation | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  const key = city.toLowerCase().trim();
  const cached = locCache.get(key);
  if (cached && Date.now() - cached.ts < LOC_CACHE_TTL_MS) {
    return { skyId: cached.skyId, entityId: cached.entityId };
  }

  try {
    const params = new URLSearchParams({ query: city, locale: "fr-FR" });
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport?${params}`,
      { headers: rapidHeaders(), signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      status: boolean;
      data?: Array<{ skyId: string; entityId: string }>;
    };
    const first = data.data?.[0];
    if (!first) return null;

    locCache.set(key, { skyId: first.skyId, entityId: first.entityId, ts: Date.now() });
    return { skyId: first.skyId, entityId: first.entityId };
  } catch {
    return null;
  }
}

// ── Duration helper ───────────────────────────────────────────────────────────

function minsToHuman(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Skyscanner flight search ──────────────────────────────────────────────────

interface SkyCarrier  { alternateId: string; logoUrl: string; name: string }
interface SkyLeg {
  origin:            { displayCode: string };
  destination:       { displayCode: string };
  durationInMinutes: number;
  stopCount:         number;
  departure:         string;
  arrival:           string;
  carriers:          { marketing: SkyCarrier[] };
}
interface SkyItinerary {
  id:       string;
  price:    { raw: number; formatted: string };
  legs:     SkyLeg[];
  deeplink: string;
}

async function searchSkyscanner(
  origin:        SkyLocation,
  dest:          SkyLocation,
  departureDate: Date,
  returnDate:    Date,
  currency:      string,
): Promise<FlightResultRaw[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    originSkyId:         origin.skyId,
    destinationSkyId:    dest.skyId,
    originEntityId:      origin.entityId,
    destinationEntityId: dest.entityId,
    date:                departureDate.toISOString().slice(0, 10),
    returnDate:          returnDate.toISOString().slice(0, 10),
    adults:              "1",
    currency,
    market:              "FR",
    locale:              "fr-FR",
    cabinClass:          "economy",
    countryCode:         "FR",
  });

  try {
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlightsComplete?${params}`,
      { headers: rapidHeaders(), signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data?: { itineraries?: SkyItinerary[] };
    };
    const itineraries = json.data?.itineraries ?? [];

    return itineraries.map((it): FlightResultRaw => {
      const outbound = it.legs[0];
      const carrier  = outbound?.carriers.marketing[0];
      const stops    = outbound?.stopCount ?? 0;
      return {
        id:             `sky-${it.id}`,
        price:          it.price.raw,
        currency,
        airline:        carrier?.alternateId ?? "??",
        airlineLogo:    carrier?.logoUrl,
        departure:      { airport: outbound?.origin.displayCode ?? "",      time: outbound?.departure ?? departureDate.toISOString() },
        arrival:        { airport: outbound?.destination.displayCode ?? "", time: outbound?.arrival   ?? returnDate.toISOString() },
        duration:       minsToHuman(outbound?.durationInMinutes ?? 0),
        stops,
        bookingUrl:     safeBookingUrl(it.deeplink),
        source:         "skyscanner",
        isDirectFlight: stops === 0,
      };
    });
  } catch {
    return [];
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateFlights(flights: FlightResultRaw[]): FlightResultRaw[] {
  const seen = new Set<string>();
  return flights.filter((f) => {
    const key = `${f.airline}-${f.departure.time.slice(0, 16)}-${f.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

const ALLOWED_CURRENCIES = new Set(["EUR", "USD", "GBP", "CAD", "AUD", "CHF", "JPY", "SEK", "NOK", "DKK"]);

function safeCurrency(raw: string | null): string {
  const upper = (raw ?? "EUR").trim().toUpperCase();
  return ALLOWED_CURRENCIES.has(upper) ? upper : "EUR";
}

function safeBookingUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    return url;
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fromCity  = (searchParams.get("from")   ?? "").trim().slice(0, 100);
  const toCity    = (searchParams.get("to")     ?? "").trim().slice(0, 100);
  const departStr = (searchParams.get("depart") ?? "").trim().slice(0, 30);
  const returnStr = (searchParams.get("return") ?? "").trim().slice(0, 30);
  const currency  = safeCurrency(searchParams.get("currency"));

  if (!fromCity || !toCity || !departStr || !returnStr) {
    return NextResponse.json([], { status: 400 });
  }

  const departureDate = new Date(departStr);
  const returnDate    = new Date(returnStr);
  if (isNaN(departureDate.getTime()) || isNaN(returnDate.getTime())) {
    return NextResponse.json([], { status: 400 });
  }

  // 1. Resolve Skyscanner location IDs in parallel
  const [originLoc, destLoc] = await Promise.all([
    resolveLocation(fromCity),
    resolveLocation(toCity),
  ]);

  if (!originLoc || !destLoc) {
    console.warn(`FlightsRoute: could not resolve Skyscanner location for "${fromCity}" or "${toCity}"`);
    return NextResponse.json([]);
  }

  // 2. Search via Skyscanner
  const results = await searchSkyscanner(originLoc, destLoc, departureDate, returnDate, currency);

  // 3. Deduplicate → sort by price → top 5
  const final = deduplicateFlights(results)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);

  return NextResponse.json(final);
}
