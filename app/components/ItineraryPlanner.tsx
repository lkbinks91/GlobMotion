"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateItinerary,
  type GeneratedItinerary,
  type ItineraryDay,
  type TimeBlock,
} from "@/app/lib/ItineraryService";
import VibeSelector, { TRAVELER_VIBES } from "./VibeSelector";
import GoogleMap3DView from "./GoogleMap3DView";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  NIGHTLIFE: "oklch(70% 0.14 300)",
  CULTURE:   "oklch(63% 0.16 253)",
  FOOD:      "oklch(72% 0.14 52)",
  NATURE:    "oklch(65% 0.17 148)",
  CHILL:     "oklch(63% 0.14 163)",
  SPORT:     "oklch(70% 0.18 30)",
  UNIQUE:    "oklch(70% 0.16 340)",
};

const CATEGORY_ICON: Record<string, string> = {
  NIGHTLIFE: "🌙",
  CULTURE:   "🏛️",
  FOOD:      "🍽️",
  NATURE:    "🌿",
  CHILL:     "🧘",
  SPORT:     "⚡",
  UNIQUE:    "✨",
};

const PERIOD_META = {
  morning:   { icon: "🌅", label: "Matin" },
  afternoon: { icon: "☀️", label: "Après-midi" },
  evening:   { icon: "🌙", label: "Soir" },
} as const;

const LOADING_MESSAGES = [
  "Analyse de vos préférences…",
  "Sélection des meilleurs spots…",
  "Organisation jour par jour…",
  "Touches finales…",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function withAlpha(oklchColor: string, alpha: number) {
  return oklchColor.replace(")", ` / ${alpha})`);
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function fmtHeaderDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function dayCount(dep: Date, ret: Date) {
  return Math.max(1, Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

// ── Sub‑components ────────────────────────────────────────────────────────────

function SkeletonBlock({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="animate-pulse space-y-2 rounded-r-[8px] p-3"
      style={{
        borderLeft:       "2px solid var(--border-subtle)",
        background:       "var(--bg-surface)",
        animationDelay:   `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-14 rounded" style={{ background: "var(--border-subtle)" }} />
        <div className="h-2.5 w-10 rounded" style={{ background: "var(--border-subtle)" }} />
      </div>
      <div className="h-3.5 w-44 rounded" style={{ background: "var(--border-subtle)" }} />
      <div className="h-2.5 w-full rounded" style={{ background: "var(--border-subtle)" }} />
      <div className="h-2.5 w-3/4 rounded" style={{ background: "var(--border-subtle)" }} />
    </div>
  );
}

// ── TimeBlock card ────────────────────────────────────────────────────────────

function TimeBlockCard({
  block,
  period,
  onView3D,
}: {
  block:     TimeBlock | null;
  period:    "morning" | "afternoon" | "evening";
  onView3D?: (location: string, title: string) => void;
}) {
  const [tipOpen, setTipOpen] = useState(false);
  if (!block) return null;
  const color = CATEGORY_COLOR[block.category] ?? CATEGORY_COLOR.CHILL;
  const icon  = CATEGORY_ICON[block.category]  ?? "✦";
  const { icon: pIcon, label: pLabel } = PERIOD_META[period];

  return (
    <div
      className="rounded-r-[8px] p-3"
      style={{
        borderLeft: `2px solid ${color}`,
        background: withAlpha(color, 0.04),
      }}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-[11px]">{pIcon}</span>
          <span
            className="text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ color, fontFamily: "var(--font-display)" }}
          >
            {pLabel}
          </span>
          <span
            className="rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide uppercase"
            style={{ background: withAlpha(color, 0.15), color }}
          >
            {icon} {block.category}
          </span>
        </div>
        <span
          className="shrink-0 text-[11px] tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {block.time}
        </span>
      </div>

      {/* Title */}
      <p
        className="m-0 mb-1 text-[14px] font-semibold leading-snug"
        style={{ color: "var(--text-primary)" }}
      >
        {block.title}
      </p>

      {/* Description */}
      <p
        className="m-0 mb-2 text-[12px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {block.description}
      </p>

      {/* Location */}
      {block.location && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="m-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
            📍 {block.location}
          </p>
          {onView3D && (
            <button
              onClick={() => onView3D(block.location!, block.title)}
              title="Vue satellite 3D"
              className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
            >
              🌐 3D
            </button>
          )}
        </div>
      )}

      {/* Expandable tip */}
      {block.tip && (
        <>
          <button
            onClick={() => setTipOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[11px] transition-opacity hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            💡 {tipOpen ? "Masquer" : "Conseil insider"}
            <span className="text-[9px]">{tipOpen ? " ↑" : " ↓"}</span>
          </button>
          <AnimatePresence>
            {tipOpen && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="m-0 mt-1 overflow-hidden text-[11px] italic"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-editorial), Georgia, serif" }}
              >
                {block.tip}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── Highlight badge ───────────────────────────────────────────────────────────

function HighlightBadge({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-3"
      style={{ background: "var(--accent-dim)", border: "0.5px solid var(--accent-border)" }}
    >
      <span className="shrink-0 text-base leading-none">⭐</span>
      <div>
        <p
          className="m-0 mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}
        >
          À ne pas manquer
        </p>
        <p
          className="m-0 text-[12px] italic leading-relaxed"
          style={{
            color:      "var(--text-secondary)",
            fontFamily: "var(--font-editorial), Georgia, serif",
          }}
        >
          «&thinsp;{text}&thinsp;»
        </p>
      </div>
    </div>
  );
}

// ── Travel tips section ───────────────────────────────────────────────────────

function TravelTips({
  tips,
  packing,
  bestTime,
}: {
  tips:     string[];
  packing:  string[];
  bestTime: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 pb-2"
      >
        <span
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}
        >
          Conseils pratiques
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {open ? "↑" : "↓"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden space-y-2"
          >
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-2 text-[12px]">
                <span style={{ color: "var(--accent)" }}>✦</span>
                <span style={{ color: "var(--text-secondary)" }}>{tip}</span>
              </div>
            ))}

            {bestTime && (
              <p className="m-0 text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                🕐 {bestTime}
              </p>
            )}

            {packing.length > 0 && (
              <div className="pt-1">
                <p
                  className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}
                >
                  À emporter
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {packing.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{
                        background: "var(--bg-surface)",
                        border:     "0.5px solid var(--border-subtle)",
                        color:      "var(--text-secondary)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Compact grid ─────────────────────────────────────────────────────────────

function CompactGrid({
  days,
  onSelect,
}: {
  days:     ItineraryDay[];
  onSelect: (day: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {days.map((day) => (
        <motion.button
          key={day.day}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          onClick={() => onSelect(day.day)}
          className="cursor-pointer rounded-[10px] border p-3 text-left"
          style={{
            background:   "var(--bg-surface)",
            borderColor:  "var(--border-subtle)",
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-base leading-none">{day.emoji}</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}
            >
              J{day.day} · {fmtDate(day.date)}
            </span>
          </div>
          <p
            className="m-0 mb-1 text-[12px] font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {day.theme}
          </p>
          <p
            className="m-0 line-clamp-2 text-[10px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {day.highlight}
          </p>
        </motion.button>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ItineraryPlannerProps {
  city:          string;
  country:       string;
  departureDate: Date | null;
  returnDate:    Date | null;
  userPrompt:    string;
  vibes:         string[];
  activities:    string[];
  hotspots:      string[];
  bestArea:      string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ItineraryPlanner({
  city,
  country,
  departureDate,
  returnDate,
  userPrompt,
  vibes,
  activities,
  hotspots,
  bestArea,
}: ItineraryPlannerProps) {
  const [itinerary,     setItinerary]     = useState<GeneratedItinerary | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [activeDay,     setActiveDay]     = useState(1);
  const [viewMode,      setViewMode]      = useState<"timeline" | "compact">("timeline");
  const [msgIdx,        setMsgIdx]        = useState(0);
  const [progress,      setProgress]      = useState(0);
  const [travelerVibes, setTravelerVibes] = useState<string[]>([]);
  const [vibeStep,      setVibeStep]      = useState<"select" | "ready">("select");
  const [immersion,     setImmersion]     = useState<{ location: string; title: string } | null>(null);

  const pillsRef     = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);

  // ── Rotating loading messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading) return;
    const tid = setInterval(
      () => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      2000,
    );
    return () => clearInterval(tid);
  }, [loading]);

  // ── Fetch itinerary ───────────────────────────────────────────────────────
  const fetchItinerary = useCallback(async (selectedVibes: string[]) => {
    if (!departureDate || !returnDate || !city) return;
    setLoading(true);
    setError(null);
    setMsgIdx(0);
    setProgress(0);
    try {
      const result = await generateItinerary(
        {
          city,
          country,
          departureDate,
          returnDate,
          userPrompt,
          vibes,
          travelerVibes: selectedVibes,
          activities,
          hotspots,
          bestArea,
        },
        (pct) => setProgress(pct),
      );
      setItinerary(result);
      setActiveDay(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [city, country, departureDate, returnDate, userPrompt, vibes, activities, hotspots, bestArea]);

  useEffect(() => {
    if (!departureDate || !returnDate) return;
    // Reset to vibe selection when destination/dates change.
    setVibeStep("select");
    setItinerary(null);
    setTravelerVibes([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, country, departureDate?.toISOString(), returnDate?.toISOString()]);

  // ── Scroll active pill into view ──────────────────────────────────────────
  useEffect(() => {
    activePillRef.current?.scrollIntoView({
      behavior: "smooth",
      block:    "nearest",
      inline:   "center",
    });
  }, [activeDay]);

  // ── No dates placeholder ──────────────────────────────────────────────────
  if (!departureDate || !returnDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">📅</span>
        <p
          className="m-0 text-[14px] font-semibold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
        >
          Ajoutez vos dates de séjour
        </p>
        <p
          className="m-0 max-w-[220px] text-[12px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          pour générer votre itinéraire personnalisé basé sur vos envies
        </p>
      </div>
    );
  }

  // ── Vibe selection step ────────────────────────────────────────────────────
  if (vibeStep === "select") {
    return (
      <VibeSelector
        city={city}
        hasDates={!!(departureDate && returnDate)}
        initialVibes={travelerVibes}
        onConfirm={(vibes) => {
          setTravelerVibes(vibes);
          setVibeStep("ready");
          fetchItinerary(vibes);
        }}
      />
    );
  }

  const nDays = dayCount(departureDate, returnDate);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar p-4">
        <div className="mb-4 text-center">
          <p
            className="m-0 mb-2 text-[13px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            ✨ Création de votre itinéraire personnalisé…
          </p>
          {/* Progress bar */}
          <div
            className="mx-auto mb-2 h-1 w-40 overflow-hidden rounded-full"
            style={{ background: "var(--border-subtle)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
          <p className="m-0 text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {progress > 0 ? `${progress}%` : "Connexion…"}
          </p>
        </div>
        <div className="space-y-3">
          <SkeletonBlock delay={0} />
          <SkeletonBlock delay={120} />
          <SkeletonBlock delay={240} />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="m-0 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {error}
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={fetchItinerary.bind(null, travelerVibes)}
          className="cursor-pointer rounded-lg border px-4 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80"
          style={{
            background:  "var(--accent-dim)",
            borderColor: "var(--accent-border)",
            color:       "var(--accent)",
          }}
        >
          Réessayer
        </motion.button>
      </div>
    );
  }

  // ── Empty (not yet fetched) ───────────────────────────────────────────────
  if (!itinerary) return null;

  const currentDay = itinerary.days.find((d) => d.day === activeDay) ?? itinerary.days[0];

  return (
    <>
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b px-4 py-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p
              className="m-0 truncate text-[13px] font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              📅 Séjour à {city}
            </p>
            <p className="m-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {fmtHeaderDate(departureDate)} → {fmtHeaderDate(returnDate)} · {nDays} jour{nDays > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Change vibes button */}
            {travelerVibes.length > 0 && (
              <button
                onClick={() => setVibeStep("select")}
                title="Changer mes vibes"
                className="flex cursor-pointer items-center gap-1 rounded-[7px] border px-2 py-1 text-[10px] font-semibold transition-opacity hover:opacity-80"
                style={{
                  background:  "rgba(124,58,237,0.1)",
                  borderColor: "rgba(124,58,237,0.3)",
                  color:       "#A78BFA",
                  fontFamily:  "var(--font-display)",
                }}
              >
                {travelerVibes
                  .map((id) => TRAVELER_VIBES.find((v) => v.id === id)?.emoji ?? "")
                  .join("")}
                <span className="ml-0.5">✎</span>
              </button>
            )}
            {/* View mode toggle */}
            <div
              className="flex shrink-0 gap-0.5 rounded-[7px] p-0.5"
              style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border-subtle)" }}
            >
              {(["timeline", "compact"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (mode === "timeline") setActiveDay(activeDay);
                  }}
                  title={mode === "timeline" ? "Vue détaillée" : "Vue compacte"}
                  className="cursor-pointer rounded-[5px] border-none px-2 py-1 text-[11px] transition-all"
                  style={{
                    background: viewMode === mode ? "var(--accent-dim)"     : "transparent",
                    color:      viewMode === mode ? "var(--accent)"         : "var(--text-muted)",
                    border:     viewMode === mode ? "0.5px solid var(--accent-border)" : "0.5px solid transparent",
                  }}
                >
                  {mode === "timeline" ? "≡" : "⊞"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Day selector pills ─────────────────────────────────────────────── */}
      {viewMode === "timeline" && (
        <div
          ref={pillsRef}
          className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto px-4 py-2"
          style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
        >
          {itinerary.days.map((d) => {
            const isActive = d.day === activeDay;
            return (
              <button
                key={d.day}
                ref={isActive ? activePillRef : undefined}
                onClick={() => setActiveDay(d.day)}
                className="flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 text-center transition-all cursor-pointer border"
                style={{
                  background:  isActive ? "var(--accent-dim)"  : "var(--bg-surface)",
                  borderColor: isActive ? "var(--accent-border)" : "var(--border-subtle)",
                  color:       isActive ? "var(--accent)"       : "var(--text-muted)",
                  minWidth:    "42px",
                }}
              >
                <span className="text-[9px] leading-none">{d.emoji}</span>
                <span
                  className="mt-0.5 text-[11px] font-bold leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  J{d.day}
                </span>
                <span className="mt-0.5 text-[9px] leading-none opacity-70">
                  {fmtDate(d.date)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="no-scrollbar flex-1 overflow-y-auto">
        {viewMode === "compact" ? (
          <CompactGrid
            days={itinerary.days}
            onSelect={(n) => {
              setActiveDay(n);
              setViewMode("timeline");
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDay.day}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 p-4"
            >
              {/* Day theme */}
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{currentDay.emoji}</span>
                <div>
                  <p
                    className="m-0 text-[13px] font-bold leading-snug"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                  >
                    Jour {currentDay.day} · {currentDay.theme}
                  </p>
                  <p className="m-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {fmtDate(currentDay.date)}
                  </p>
                </div>
              </div>

              {/* Time blocks */}
              {currentDay.morning   && <TimeBlockCard block={currentDay.morning}   period="morning"   onView3D={(loc, ttl) => setImmersion({ location: loc, title: ttl })} />}
              {currentDay.afternoon && <TimeBlockCard block={currentDay.afternoon} period="afternoon" onView3D={(loc, ttl) => setImmersion({ location: loc, title: ttl })} />}
              {currentDay.evening   && <TimeBlockCard block={currentDay.evening}   period="evening"   onView3D={(loc, ttl) => setImmersion({ location: loc, title: ttl })} />}

              {/* Highlight */}
              <HighlightBadge text={currentDay.highlight} />

              {/* Travel tips (only on last day to avoid repetition) */}
              {currentDay.day === itinerary.days.length && (
                <TravelTips
                  tips={itinerary.travelTips}
                  packing={itinerary.packingEssentials}
                  bestTime={itinerary.bestTimeToArrive}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Travel tips in compact mode */}
        {viewMode === "compact" && (
          <div className="px-3 pb-4">
            <TravelTips
              tips={itinerary.travelTips}
              packing={itinerary.packingEssentials}
              bestTime={itinerary.bestTimeToArrive}
            />
          </div>
        )}
      </div>
    </div>

    {/* 3D Immersion overlay */}
    <AnimatePresence>
      {immersion && (
        <GoogleMap3DView
          location={immersion.location}
          city={city}
          country={country}
          activityTitle={immersion.title}
          onClose={() => setImmersion(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
