"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type MockDestination } from "@/data/mockDestinations";
import ExpandableDestinationDeepDive from "./ExpandableDestinationDeepDive";
import VibeTag from "./VibeTag";
import { searchFlights, type FlightResult } from "@/app/lib/FlightSearchService";
import FlightLinksPanel from "./FlightLinksPanel";


// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = { from: Date | null; to: Date | null };

type DestinationCardProps = {
  data?:        MockDestination | null;
  originCity?:  string;
  dateRange?:   DateRange;
};

// ── Spring config (used on all interactive elements) ─────────────────────────

const SPRING = { type: "spring", stiffness: 320, damping: 28 } as const;

// ── Noise texture (inline SVG filter, no external asset) ─────────────────────
// Dots layer — stays on the card element
const NOISE_DOTS_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
  backgroundSize:  "24px 24px",
};

// SVG noise layer — separate overlay so its opacity can be halved in light mode
const NOISE_SVG_BG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E\")";

// ── Category detection → CSS variable key ─────────────────────────────────────

function detectCategory(vibes: string[]): string {
  const lower = vibes.join(" ").toLowerCase();
  if (/festif|party|nightlife|club/.test(lower)) return "party";
  if (/nature|sauvage|aventure|trek|ocean|beach|forest/.test(lower)) return "nature";
  if (/culturel|historique|art|museum|spirituel/.test(lower)) return "culture";
  if (/urbain|futuriste|city|minimaliste/.test(lower)) return "city";
  if (/calme|détente|zen|luxueux|romantique|spa/.test(lower)) return "beach";
  return "default";
}

// ── Accent colour per category (mirrors CSS custom props, for inline use) ─────

const CATEGORY_ACCENT: Record<string, string> = {
  beach:   "oklch(72% 0.14 52)",
  city:    "oklch(63% 0.16 253)",
  nature:  "oklch(65% 0.17 148)",
  culture: "oklch(67% 0.16 300)",
  party:   "oklch(70% 0.18 30)",
  default: "oklch(63% 0.14 163)",
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Divider = () => (
  <hr className="border-0 my-5" style={{ borderTop: "0.5px solid var(--border-subtle)" }} />
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-[11px] font-bold tracking-[0.13em] uppercase mb-2"
    style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}
  >
    {children}
  </p>
);

const weatherLabel: Record<string, string> = {
  sunny: "Ensoleillé", cloudy: "Nuageux", rainy: "Pluvieux",
  snowy: "Enneigé", humid: "Humide", dry: "Sec", clear: "Dégagé",
};
const timeLabel: Record<string, string> = {
  day: "Jour", night: "Nuit", sunset: "Coucher de soleil", sunrise: "Lever de soleil",
};

// ── Main card ─────────────────────────────────────────────────────────────────

export default function DestinationCard({ data, originCity, dateRange }: DestinationCardProps) {
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [flights,       setFlights]      = useState<FlightResult[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);

  // Trigger flight search whenever destination / origin / dates change
  useEffect(() => {
    if (!data || !originCity || !dateRange?.from || !dateRange?.to) {
      setFlights([]);
      return;
    }
    let cancelled = false;
    setFlightsLoading(true);
    searchFlights({
      originCity,
      destinationCity: data.destination.city,
      departureDate:   dateRange.from,
      returnDate:      dateRange.to,
      currency:        "EUR",
    }).then((results) => {
      if (!cancelled) setFlights(results);
    }).finally(() => {
      if (!cancelled) setFlightsLoading(false);
    });
    return () => { cancelled = true; };
  }, [
    data?.destination.city,
    originCity,
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
  ]);

  const category = useMemo(() => (data ? detectCategory(data.vibe) : "default"), [data]);
  const accent   = CATEGORY_ACCENT[category] ?? CATEGORY_ACCENT.default;

  if (!data) return null;

  const destinationId = `${data.destination.city}-${data.destination.country}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={SPRING}
      data-category={category}
      className="destination-card relative w-full max-w-2xl rounded-[16px] p-5 sm:p-7 overflow-hidden"
      style={{
        ...NOISE_DOTS_STYLE,
        backgroundColor:     "var(--bg-card)",
        border:              "0.5px solid var(--border-subtle)",
        backdropFilter:      "blur(14px)",
        WebkitBackdropFilter:"blur(14px)",
        fontFamily:          "var(--font-body)",
      }}
    >
      {/* SVG noise overlay — opacity halved in light mode via CSS class */}
      <div
        aria-hidden
        className="destination-card-noise absolute inset-0 pointer-events-none"
        style={{ backgroundImage: NOISE_SVG_BG, backgroundSize: "160px 160px" }}
      />
      {/* Subtle top gradient line — accent-coloured */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[1px] rounded-t-[16px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.5 }}
      />

      {/* ── HERO: City + Country ─────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <h2
            className="m-0 leading-[0.95]"
            style={{
              fontFamily:    "var(--font-editorial), Georgia, serif",
              fontSize:      "clamp(32px, 5vw, 44px)",
              fontWeight:    600,
              letterSpacing: "-0.01em",
              color:         "var(--text-primary)",
            }}
          >
            {data.destination.city}
          </h2>
          <p
            className="m-0 mt-1 text-[14px]"
            style={{
              fontFamily: "var(--font-editorial), Georgia, serif",
              fontStyle: "italic",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {data.destination.country}
          </p>
        </div>


      </div>

      {/* ── VIBE TAGS ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mt-4">
        {data.vibe.map((v) => (
          <VibeTag key={v} label={v} />
        ))}
      </div>

      {/* ── CONTEXT PILLS (time + weather) ──────────────────────────── */}
      <div className="flex flex-wrap gap-3 mt-4">
        {[
          timeLabel[data.local_context.time_of_day]    ?? data.local_context.time_of_day,
          weatherLabel[data.local_context.weather_vibe] ?? data.local_context.weather_vibe,
        ].map((label) => (
          <span
            key={label}
            className="rounded-full px-3 py-1 text-[13px] font-medium"
            style={{
              color:      "oklch(75% 0.12 72)",
              background: "oklch(75% 0.12 72 / 0.1)",
              border:     "0.5px solid oklch(75% 0.12 72 / 0.25)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <Divider />

      {/* ── POURQUOI CE MATCH ────────────────────────────────────────── */}
      <div>
        <SectionLabel>Pourquoi ce match</SectionLabel>
        <p className="text-[15px] leading-[1.85] m-0 max-w-[680px]" style={{ color: "var(--text-primary)" }}>
          {data.why_it_matches}
        </p>
      </div>

      <Divider />

      {/* ── ACTIVITIES ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {data.activities.map((act, i) => (
          <motion.div
            key={act}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING, delay: 0.05 * i }}
            className="rounded-md px-4 py-3 text-[14px] leading-relaxed break-words min-h-[44px]"
            style={{
              background:   "var(--bg-surface)",
              borderTop:    "0.5px solid var(--border-subtle)",
              borderRight:  "0.5px solid var(--border-subtle)",
              borderBottom: "0.5px solid var(--border-subtle)",
              borderLeft:   `2px solid ${accent}`,
              color:        "var(--text-primary)",
            }}
          >
            {act}
          </motion.div>
        ))}
      </div>

      <Divider />

      {/* ── ZONE IDÉALE ─────────────────────────────────────────────── */}
      <div
        className="rounded-r-lg px-4 py-3"
        style={{
          background:  "var(--bg-surface)",
          borderLeft:  `3px solid oklch(75% 0.12 72)`,
        }}
      >
        <span
          className="block text-[12px] font-bold tracking-[0.12em] uppercase mb-2"
          style={{ fontFamily: "var(--font-display)", color: "oklch(75% 0.12 72)" }}
        >
          Zone idéale
        </span>
        <span className="text-[14px]" style={{ color: "var(--text-primary)" }}>
          {data.best_area_to_stay}
        </span>
      </div>

      <Divider />

      {/* ── HOTSPOTS ────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Hotspots</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {data.popular_hotspots.map((spot) => (
            <motion.span
              key={spot}
              whileHover={{ scale: 1.04, y: -1 }}
              transition={SPRING}
              className="rounded-full px-3 py-1.5 text-[13px]"
              style={{
                background: "var(--bg-surface)",
                border:     "0.5px solid var(--border-subtle)",
                color:      "var(--text-primary)",
              }}
            >
              {spot}
            </motion.span>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── QUOTE ───────────────────────────────────────────────────── */}
      <div className="text-center py-3">
        <span
          aria-hidden="true"
          className="block leading-none mb-2"
          style={{
            fontFamily: "var(--font-editorial), Georgia, serif",
            fontSize:   "52px",
            color:      accent,
            opacity:    0.6,
          }}
        >
          &ldquo;
        </span>
        <p
          className="italic text-[14px] leading-[1.85] mx-auto max-w-[560px] m-0"
          style={{
            fontFamily: "var(--font-editorial), Georgia, serif",
            color:      "var(--text-secondary)",
          }}
        >
          {data.traveler_vibe_quote}
        </p>
      </div>

      <Divider />

      {/* ── HIDDEN GEM ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Hidden gem</SectionLabel>
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={SPRING}
          className="rounded-[10px] p-3.5 flex gap-2.5 items-start"
          style={{
            background: `${accent}0d`,
            border:     `0.5px solid ${accent}30`,
          }}
        >
          <span className="text-lg leading-none mt-0.5">💎</span>
          <div>
            <span
              className="block text-[13px] font-semibold mb-1"
              style={{ color: accent }}
            >
              {data.hidden_gem.name}
            </span>
            <span className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {data.hidden_gem.description}
            </span>
          </div>
        </motion.div>
      </div>

      <Divider />
      <FlightLinksPanel
        destinationCity={data.destination.city}
        destinationCountry={data.destination.country}
        originCity={originCity}
        departureDate={dateRange?.from ?? undefined}
        returnDate={dateRange?.to ?? undefined}
      />

      {/* ── VOLS DISPONIBLES ─────────────────────────────────────── */}
      {(flightsLoading || flights.length > 0) && originCity && dateRange?.from && dateRange?.to && (
        <>
          <Divider />
          <div>
            <SectionLabel>Vols disponibles</SectionLabel>

            {flightsLoading ? (
              // Skeleton rows
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg animate-pulse"
                    style={{ background: "var(--bg-surface)" }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {flights.slice(0, 3).map((f) => (
                  <a
                    key={f.id}
                    href={f.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-opacity hover:opacity-80"
                    style={{
                      background:  "var(--bg-surface)",
                      border:      "0.5px solid var(--border-subtle)",
                      textDecoration: "none",
                    }}
                  >
                    {/* Airline logo */}
                    {f.airlineLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.airlineLogo}
                        alt={f.airline}
                        width={24}
                        height={24}
                        className="flex-shrink-0 rounded-sm object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    {/* Airline code */}
                    <span
                      className="text-[12px] font-bold w-8 flex-shrink-0"
                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}
                    >
                      {f.airline}
                    </span>

                    {/* Duration */}
                    <span
                      className="text-[13px] font-medium flex-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {f.duration}
                    </span>

                    {/* Stops badge */}
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: f.isDirectFlight ? `${accent}18` : "var(--bg-surface)",
                        border:     `0.5px solid ${f.isDirectFlight ? accent + "50" : "var(--border-subtle)"}`,
                        color:      f.isDirectFlight ? accent : "var(--text-muted)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {f.isDirectFlight ? "Direct" : `${f.stops} escale${f.stops > 1 ? "s" : ""}`}
                    </span>

                    {/* Price */}
                    <span
                      className="text-[14px] font-bold flex-shrink-0"
                      style={{ color: accent, fontFamily: "var(--font-display)" }}
                    >
                      {f.price.toLocaleString("fr-FR")} {f.currency}
                    </span>

                    {/* Book arrow */}
                    <span className="text-[12px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      →
                    </span>
                  </a>
                ))}

                <p
                  className="text-[10px] mt-2 leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Prix indicatifs · finalisation sur le site partenaire
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <Divider />

      {/* ── EN SAVOIR PLUS trigger ───────────────────────────────────── */}
      <div className="flex justify-center">
        <motion.button
          onClick={() => setDeepDiveOpen((v) => !v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING}
          className="group flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase py-2"
          style={{
            fontFamily: "var(--font-display)",
            color:      deepDiveOpen ? accent : "var(--text-muted, rgba(74,82,104,0.9))",
          }}
        >
          <span style={{ transition: "color 0.2s" }}>
            {deepDiveOpen ? "Réduire ↑" : "En savoir plus →"}
          </span>
        </motion.button>
      </div>

      {/* ── DEEP DIVE expand ────────────────────────────────────────── */}
      <AnimatePresence>
        {deepDiveOpen && (
          <ExpandableDestinationDeepDive
            city={data.destination.city}
            country={data.destination.country}
            vibes={data.vibe}
            activities={data.activities}
            destinationId={destinationId}
            onClose={() => setDeepDiveOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

