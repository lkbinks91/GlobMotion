// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "NATURE"
  | "CULTURE"
  | "NIGHTLIFE"
  | "FOOD"
  | "SPORT"
  | "FESTIVAL";

export interface ContextualActivity {
  name: string;
  why_now: string;
  category: ActivityCategory;
  best_time_of_day: string;
  insider_tip: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Fetches season-aware activity recommendations from the /api/activities route.
 * Results are cached in sessionStorage per (city + date range) to avoid
 * redundant Claude API calls when the user switches tabs.
 */
export async function getContextualActivities(
  destination: { city: string; country: string },
  dateRange: DateRange,
  userMoods?: string[]
): Promise<ContextualActivity[]> {
  const cacheKey = [
    "gact",
    destination.city.toLowerCase().trim(),
    dateRange.from.toDateString(),
    dateRange.to.toDateString(),
  ].join("__");

  if (typeof window !== "undefined") {
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) return JSON.parse(hit) as ContextualActivity[];
    } catch { /* quota / parse — ignore */ }
  }

  try {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: destination.city,
        country: destination.country,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        moods: userMoods ?? [],
      }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { activities?: ContextualActivity[] };
    const items = Array.isArray(data.activities) ? data.activities : [];

    if (typeof window !== "undefined" && items.length > 0) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* quota */ }
    }

    return items;
  } catch {
    return [];
  }
}
