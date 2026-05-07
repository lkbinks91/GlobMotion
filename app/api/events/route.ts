import { NextRequest, NextResponse } from "next/server";
import { resolveSourcesForDestination, countryNameToCode } from "@/app/lib/RegionalSourceRouter";
import { TicketmasterAdapter }    from "@/app/lib/adapters/TicketmasterAdapter";
import { EventbriteAdapter }      from "@/app/lib/adapters/EventbriteAdapter";
import { SeatGeekAdapter }        from "@/app/lib/adapters/SeatGeekAdapter";
import { BandsintownAdapter }     from "@/app/lib/adapters/BandsintownAdapter";
import { SongkickAdapter }        from "@/app/lib/adapters/SongkickAdapter";
import { ResidentAdvisorAdapter } from "@/app/lib/adapters/ResidentAdvisorAdapter";
import type { EventSourceAdapter } from "@/app/lib/adapters/EventSourceAdapter";
import type { UnifiedEvent }       from "@/app/lib/EventAggregatorService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Adapter registry ──────────────────────────────────────────────────────────

const ALL_ADAPTERS: Record<string, EventSourceAdapter> = {
  ticketmaster:     new TicketmasterAdapter(),
  eventbrite:       new EventbriteAdapter(),
  seatgeek:         new SeatGeekAdapter(),
  bandsintown:      new BandsintownAdapter(),
  songkick:         new SongkickAdapter(),
  resident_advisor: new ResidentAdvisorAdapter(),
};

// ── Deduplication by normalised (title + date) ────────────────────────────────

function deduplicate(events: UnifiedEvent[]): UnifiedEvent[] {
  const seen = new Set<string>();
  return events.filter((ev) => {
    const titleSlug = ev.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    const dateSlug  = (ev.date ?? "").slice(0, 10);
    const key = `${titleSlug}__${dateSlug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Mood scoring ──────────────────────────────────────────────────────────────

function scoreEvent(ev: UnifiedEvent, moods: string[]): number {
  if (!moods.length) return 0;
  const haystack = `${ev.vibes.join(" ")} ${ev.type}`.toLowerCase();
  return moods.reduce((s, m) => s + (haystack.includes(m.toLowerCase()) ? 1 : 0), 0);
}

// ── Route handler ─────────────────────────────────────────────────────────────

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const city       = (searchParams.get("city")    ?? "").trim();
  const countryRaw = (searchParams.get("country") ?? "").trim();
  const from       = (searchParams.get("from")    ?? "").trim();
  const to         = (searchParams.get("to")      ?? "").trim();
  const moodsParam = (searchParams.get("moods")   ?? "").trim();

  if (!city) return NextResponse.json([], { status: 400 });

  const countryCode = countryNameToCode(countryRaw || "US");
  const moods       = moodsParam ? moodsParam.split(",").filter(Boolean) : [];
  const dateRange   = {
    from: from ? new Date(from) : null,
    to:   to   ? new Date(to)   : null,
  };

  // 1. Resolve best sources for this destination + mood profile
  const sourceNames = resolveSourcesForDestination(city, countryCode, moods);
  const sources = sourceNames
    .map((name) => ALL_ADAPTERS[name])
    .filter((s): s is EventSourceAdapter => !!s && s.isAvailable());

  // 2. Fetch all in parallel — one failing source must NEVER crash the rest
  const results = await Promise.allSettled(
    sources.map((s) => s.fetch(city, countryCode, dateRange))
  );

  const allEvents: UnifiedEvent[] = results
    .filter((r): r is PromiseFulfilledResult<UnifiedEvent[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // 3. Deduplicate → score → sort → top 20
  const deduped = deduplicate(allEvents);
  const scored  = deduped.map((ev) => ({ ...ev, mood_match_score: scoreEvent(ev, moods) }));

  scored.sort((a, b) => {
    const sd = (b.mood_match_score ?? 0) - (a.mood_match_score ?? 0);
    if (sd !== 0) return sd;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return NextResponse.json(scored.slice(0, 20));
}
