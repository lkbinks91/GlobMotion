import { SOURCE_REGISTRY, MOOD_SOURCE_AFFINITY } from "./EventSourceRegistry";

// ── Country name → ISO 3166-1 alpha-2 ────────────────────────────────────────
// Maps the English country names returned by Claude to 2-letter codes.

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // Europe
  france: "FR", germany: "DE", spain: "ES", italy: "IT", portugal: "PT",
  netherlands: "NL", belgium: "BE", austria: "AT", switzerland: "CH",
  poland: "PL", "czech republic": "CZ", czechia: "CZ", hungary: "HU",
  romania: "RO", bulgaria: "BG", croatia: "HR", greece: "GR",
  sweden: "SE", norway: "NO", denmark: "DK", finland: "FI",
  ireland: "IE", "united kingdom": "GB", uk: "GB", england: "GB",
  scotland: "GB", wales: "GB", "northern ireland": "GB",
  // Americas
  "united states": "US", usa: "US", "u.s.a.": "US", canada: "CA",
  mexico: "MX", brazil: "BR", argentina: "AR", colombia: "CO",
  chile: "CL", peru: "PE", ecuador: "EC", uruguay: "UY", bolivia: "BO",
  venezuela: "VE", "costa rica": "CR", panama: "PA", cuba: "CU", guatemala: "GT",
  // Asia
  japan: "JP", china: "CN", "south korea": "KR", korea: "KR",
  thailand: "TH", vietnam: "VN", indonesia: "ID", malaysia: "MY",
  singapore: "SG", philippines: "PH", taiwan: "TW", "hong kong": "HK",
  india: "IN", "sri lanka": "LK", cambodia: "KH", myanmar: "MM",
  // Oceania
  australia: "AU", "new zealand": "NZ",
  // Middle East & Africa
  morocco: "MA", egypt: "EG", "south africa": "ZA",
  "united arab emirates": "AE", uae: "AE", dubai: "AE",
  "saudi arabia": "SA", israel: "IL", nigeria: "NG", kenya: "KE",
  // North Africa & Europe (misc)
  turkey: "TR", russia: "RU", ukraine: "UA", iceland: "IS",
};

export function countryNameToCode(name: string): string {
  if (!name) return "US";
  // Already a 2-letter code?
  if (/^[A-Z]{2}$/.test(name)) return name;
  return COUNTRY_NAME_TO_CODE[name.toLowerCase()] ?? "US";
}

// ── Router ────────────────────────────────────────────────────────────────────

/**
 * Returns an ordered list of source names to query for a given destination + mood.
 *  1. City exact/partial match (highest priority)
 *  2. Country code match
 *  3. GLOBAL_FALLBACK
 *  4. Re-order by mood affinity
 */
export function resolveSourcesForDestination(
  city:        string,
  countryCode: string,
  moods:       string[] = []
): string[] {
  const cityLower    = city.toLowerCase();
  const countryUpper = countryCode.toUpperCase();

  const regions = Object.values(SOURCE_REGISTRY);

  // 1. City-level match
  let sources: string[] | null = null;
  for (const region of regions) {
    if (region.cities?.some((c) => cityLower.includes(c) || c.includes(cityLower))) {
      sources = region.sources;
      break;
    }
  }

  // 2. Country-level match
  if (!sources) {
    for (const region of regions) {
      if (region.countries?.includes(countryUpper)) {
        sources = region.sources;
        break;
      }
    }
  }

  // 3. Fallback
  if (!sources) {
    sources = SOURCE_REGISTRY.GLOBAL_FALLBACK.sources;
  }

  // 4. Mood-affinity re-ordering
  if (moods.length === 0) return sources;

  const affinityScore = new Map<string, number>(sources.map((s) => [s, 0]));

  for (const mood of moods) {
    const moodLower = mood.toLowerCase();
    for (const [moodKey, affinitySources] of Object.entries(MOOD_SOURCE_AFFINITY)) {
      if (moodLower.includes(moodKey) || moodKey.includes(moodLower)) {
        affinitySources.forEach((src, i) => {
          const boost = affinitySources.length - i;
          affinityScore.set(src, (affinityScore.get(src) ?? 0) + boost);
        });
      }
    }
  }

  // Merge: region sources (with mood-boosted order) + any mood-only sources not yet included
  const moodExtras: string[] = [];
  for (const mood of moods) {
    const moodLower = mood.toLowerCase();
    for (const [moodKey, affinitySources] of Object.entries(MOOD_SOURCE_AFFINITY)) {
      if (moodLower.includes(moodKey) || moodKey.includes(moodLower)) {
        moodExtras.push(...affinitySources);
      }
    }
  }

  const merged = [...new Set([...sources, ...moodExtras])];
  return merged.sort((a, b) => (affinityScore.get(b) ?? 0) - (affinityScore.get(a) ?? 0));
}
