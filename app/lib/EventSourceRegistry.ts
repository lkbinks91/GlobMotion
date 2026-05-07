/**
 * Maps geographic regions to their best event sources (ordered by relevance).
 * Source names must match the keys used in RegionalSourceRouter's ALL_ADAPTERS map.
 */

export interface RegionConfig {
  countries?: string[];   // ISO 3166-1 alpha-2 codes
  cities?:    string[];   // lowercase city name fragments
  sources:    string[];   // ordered: most relevant first
}

export const SOURCE_REGISTRY: Record<string, RegionConfig> = {
  // ── Party / nightlife capitals ────────────────────────────────────────────
  EUROPE_PARTY: {
    countries: ["ES", "GR", "HR"],
    cities:    ["ibiza", "mykonos", "santorini", "split", "berlin", "amsterdam"],
    sources:   ["resident_advisor", "bandsintown", "songkick", "ticketmaster", "eventbrite"],
  },

  // ── Broader European culture + music ─────────────────────────────────────
  EUROPE_CULTURE: {
    countries: ["FR", "IT", "DE", "NL", "PT", "AT", "BE", "PL", "CZ", "HU", "SE", "DK", "IE", "RO"],
    sources:   ["resident_advisor", "songkick", "bandsintown", "ticketmaster", "eventbrite"],
  },

  // ── United Kingdom ────────────────────────────────────────────────────────
  UK: {
    countries: ["GB"],
    sources:   ["resident_advisor", "songkick", "bandsintown", "ticketmaster", "eventbrite"],
  },

  // ── North America ─────────────────────────────────────────────────────────
  NORTH_AMERICA: {
    countries: ["US", "CA"],
    sources:   ["ticketmaster", "seatgeek", "eventbrite", "bandsintown", "resident_advisor"],
  },

  // ── Mexico / Central America ──────────────────────────────────────────────
  MEXICO_CA: {
    countries: ["MX", "GT", "CR", "PA", "CU"],
    sources:   ["bandsintown", "eventbrite", "ticketmaster"],
  },

  // ── Latin America ─────────────────────────────────────────────────────────
  LATIN_AMERICA: {
    countries: ["BR", "AR", "CO", "CL", "PE", "UY", "EC", "BO", "VE"],
    sources:   ["bandsintown", "eventbrite", "ticketmaster"],
  },

  // ── Asia ──────────────────────────────────────────────────────────────────
  ASIA: {
    countries: ["TH", "JP", "KR", "ID", "VN", "SG", "MY", "PH", "TW", "CN", "HK", "IN"],
    sources:   ["bandsintown", "ticketmaster", "eventbrite"],
  },

  // ── Oceania ───────────────────────────────────────────────────────────────
  OCEANIA: {
    countries: ["AU", "NZ"],
    sources:   ["resident_advisor", "bandsintown", "ticketmaster", "eventbrite"],
  },

  // ── Middle East + Africa ──────────────────────────────────────────────────
  MENA_AFRICA: {
    countries: ["ZA", "MA", "EG", "AE", "SA", "IL", "NG", "KE"],
    sources:   ["bandsintown", "eventbrite", "ticketmaster"],
  },

  // ── Global fallback ───────────────────────────────────────────────────────
  GLOBAL_FALLBACK: {
    sources: ["ticketmaster", "eventbrite", "bandsintown", "songkick"],
  },
};

/** Mood → adapters that are most relevant (ordered by fit) */
export const MOOD_SOURCE_AFFINITY: Record<string, string[]> = {
  party:      ["resident_advisor", "bandsintown", "ticketmaster"],
  nightlife:  ["resident_advisor", "bandsintown"],
  club:       ["resident_advisor"],
  electronic: ["resident_advisor", "bandsintown", "songkick"],
  culture:    ["songkick", "bandsintown", "ticketmaster", "eventbrite"],
  history:    ["eventbrite", "bandsintown"],
  art:        ["eventbrite", "bandsintown"],
  sports:     ["ticketmaster", "seatgeek"],
  music:      ["bandsintown", "songkick", "resident_advisor"],
  festival:   ["songkick", "bandsintown", "ticketmaster"],
  concert:    ["bandsintown", "songkick", "ticketmaster"],
  adventure:  ["ticketmaster", "eventbrite", "bandsintown"],
  social:     ["eventbrite", "bandsintown", "songkick"],
};
