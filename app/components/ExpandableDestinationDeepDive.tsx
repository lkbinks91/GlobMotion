"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeepDiveData {
  vibe_check:      string[];
  when_to_go:      { profile: string; window: string; reason: string }[];
  local_secrets:   { tip: string; detail: string }[];
  budget_reality:  { tier: string; range: string; details: string }[];
  vibes_map:       { neighborhood: string; mood: string; description: string }[];
}

export interface ExpandableDestinationDeepDiveProps {
  city:          string;
  country:       string;
  vibes:         string[];
  activities:    string[];
  destinationId: string;
  onClose:       () => void;
}

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTION_META = [
  {
    key:     "vibe_check"     as const,
    label:   "VIBE CHECK",
    icon:    "◈",
    color:   "#4ecca3",
    tagline: "Ambiance authentique",
  },
  {
    key:     "when_to_go"    as const,
    label:   "WHEN TO GO",
    icon:    "◷",
    color:   "#f0b429",
    tagline: "Selon votre profil voyageur",
  },
  {
    key:     "local_secrets" as const,
    label:   "LOCAL SECRETS",
    icon:    "◉",
    color:   "#a78bfa",
    tagline: "Tips des initiés",
  },
  {
    key:     "budget_reality" as const,
    label:   "BUDGET REALITY",
    icon:    "◈",
    color:   "#60a5fa",
    tagline: "Fourchette réaliste",
  },
  {
    key:     "vibes_map"     as const,
    label:   "VIBES MAP",
    icon:    "◎",
    color:   "#fb923c",
    tagline: "Quartiers par mood",
  },
] as const;

type SectionKey = typeof SECTION_META[number]["key"];

/** Libellés courts pour la navigation rapide entre sections */
const SECTION_NAV_SHORT: Record<SectionKey, string> = {
  vibe_check:     "Ambiance",
  when_to_go:     "Quand partir",
  local_secrets:  "Secrets",
  budget_reality: "Budget",
  vibes_map:      "Quartiers",
};

// ── Mood colours ──────────────────────────────────────────────────────────────

const MOOD_COLORS: Record<string, string> = {
  party:   "#f0b429",
  chill:   "#4ecca3",
  culture: "#a78bfa",
  food:    "#fb923c",
  design:  "#60a5fa",
  nature:  "#34d399",
};

// ── Budget tier colours ───────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  budget:  "#4ecca3",
  mid:     "#f0b429",
  luxury:  "#fb923c",
};

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function SkeletonBar({ width = "100%", height = "11px" }: { width?: string; height?: string }) {
  return (
    <div
      className="rounded animate-pulse bg-[var(--bg-surface)]"
      style={{ width, height }}
    />
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  const widths = ["75%", "100%", "58%", "90%", "68%"];
  return (
    <div className="space-y-2.5 pt-0.5">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBar key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  );
}

// ── Glass panel ───────────────────────────────────────────────────────────────
// Kept as constant only for the dynamic borderLeft spread; static styles moved to className
// Section cards: className="rounded-[10px] p-[14px_16px] bg-card border-t-subtle border-r-subtle border-b-subtle backdrop-blur-[10px]"

// ── Section content renderers ─────────────────────────────────────────────────

function VibeCheckContent({ data }: { data: DeepDiveData }) {
  return (
    <div className="space-y-4 max-w-[52ch]">
      {(data.vibe_check ?? []).map((para, i) => (
        <p
          key={i}
          className="text-[14px] sm:text-[15px] text-[var(--text-secondary)] leading-[1.7] m-0"
        >
          {para}
        </p>
      ))}
    </div>
  );
}

function WhenToGoContent({ data }: { data: DeepDiveData }) {
  return (
    <div className="space-y-4">
      {(data.when_to_go ?? []).map((item, i) => (
        <div
          key={i}
          className="rounded-[12px] px-4 py-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "#f0b429" }}>
              {item.profile}
            </span>
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {item.window}
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed m-0">
            {item.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

function LocalSecretsContent({ data }: { data: DeepDiveData }) {
  return (
    <div className="space-y-5">
      {(data.local_secrets ?? []).map((item, i) => (
        <div key={i} className="flex gap-4 items-start">
          <span
            className="text-[12px] font-bold tabular-nums mt-1 shrink-0 min-w-[1.75rem]"
            style={{ color: "#a78bfa" }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-primary)] m-0 leading-snug">
              {item.tip}
            </p>
            <p className="text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed m-0">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetRealityContent({ data }: { data: DeepDiveData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {(data.budget_reality ?? []).map((item) => (
        <div
          key={item.tier}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[12px] px-4 py-3.5"
          style={{ borderTop: `3px solid ${TIER_COLORS[item.tier] ?? "#7a8499"}` }}
        >
          <span
            className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: TIER_COLORS[item.tier] ?? "#7a8499" }}
          >
            {item.tier}
          </span>
          <span className="block text-[15px] font-semibold text-[var(--text-primary)] mb-2 leading-tight">
            {item.range}
          </span>
          <p className="text-[12px] sm:text-[13px] text-[var(--text-secondary)] leading-relaxed m-0">
            {item.details}
          </p>
        </div>
      ))}
    </div>
  );
}

function VibesMapContent({ data }: { data: DeepDiveData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(data.vibes_map ?? []).map((item, i) => {
        const accent = MOOD_COLORS[item.mood] ?? "#7a8499";
        return (
          <div
            key={i}
            className="bg-[var(--bg-surface)] border-t border-r border-b border-[var(--border-subtle)] rounded-[12px] p-4"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <span className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2 leading-snug">
              {item.neighborhood}
            </span>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.1em] rounded-full px-2 py-1 mb-3"
              style={{
                color:      accent,
                background: `${accent}18`,
                border:     `0.5px solid ${accent}40`,
              }}
            >
              {item.mood}
            </span>
            <p className="text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed m-0">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const SECTION_CONTENT_MAP: Record<SectionKey, (data: DeepDiveData) => React.ReactNode> = {
  vibe_check:     (d) => <VibeCheckContent data={d} />,
  when_to_go:     (d) => <WhenToGoContent data={d} />,
  local_secrets:  (d) => <LocalSecretsContent data={d} />,
  budget_reality: (d) => <BudgetRealityContent data={d} />,
  vibes_map:      (d) => <VibesMapContent data={d} />,
};

const SKELETON_ROWS: Record<SectionKey, number> = {
  vibe_check:     4,
  when_to_go:     4,
  local_secrets:  4,
  budget_reality: 2,
  vibes_map:      3,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function ExpandableDestinationDeepDive({
  city,
  country,
  vibes,
  activities,
  destinationId,
  onClose,
}: ExpandableDestinationDeepDiveProps) {
  const [data,    setData]    = useState<DeepDiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<SectionKey>>(new Set());
  const [copied,  setCopied]  = useState(false);

  const sectionRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({});

  const cacheKey = `deepdive-${destinationId}`;

  const scrollToSection = (key: SectionKey) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setRevealed(new Set());
    setData(null);

    // Check sessionStorage
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: DeepDiveData = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    // Fetch API
    fetch("/api/deepdive", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ city, country, vibes, activities }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Erreur serveur");
        return r.json() as Promise<DeepDiveData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch { /* ignore */ }
      })
      .catch(() => {
        setError("Impossible de charger le deep-dive.");
        setLoading(false);
      });
  }, [cacheKey, city, country, vibes, activities]);

  useEffect(() => { load(); }, [load]);

  // Stagger-reveal sections once data arrives
  useEffect(() => {
    if (!data) return;
    const timeouts = SECTION_META.map((s, i) =>
      window.setTimeout(() => {
        setRevealed((prev) => new Set([...prev, s.key]));
      }, i * 190)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [data]);

  // Share handler
  const handleShare = () => {
    if (!data) return;
    const lines = [
      `🌍 ${city}, ${country} — Deep Dive GlobMotion`,
      "",
      `🎭 Vibe : ${data.vibe_check?.[0] ?? ""}`,
      "",
      `🗓️ Idéal pour : ${data.when_to_go?.[0]?.profile} — ${data.when_to_go?.[0]?.window}`,
      `   ${data.when_to_go?.[0]?.reason ?? ""}`,
      "",
      `🤫 Secret local : ${data.local_secrets?.[0]?.tip} — ${data.local_secrets?.[0]?.detail ?? ""}`,
      "",
      `💰 Budget : dès ${data.budget_reality?.[0]?.range}`,
    ].join("\n");

    navigator.clipboard.writeText(lines)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); })
      .catch(() => {});
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: "hidden" }}
    >
      <div className="pt-5 pb-2 space-y-5">

        {/* ── Header bar ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-[2px] h-6 rounded-full shrink-0"
              style={{ background: "linear-gradient(to bottom, #4ecca3, #60a5fa)" }}
            />
            <div className="min-w-0">
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)] block">
                En savoir plus
              </span>
              <span className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">
                {city}
                <span className="text-[13px] font-normal text-[var(--text-muted)]"> · {country}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
          >
            Réduire
          </button>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed m-0 -mt-2 mb-1 max-w-[52ch]">
          Parcourez les sections ci-dessous ou utilisez les raccourcis pour aller directement au thème qui vous intéresse.
        </p>

        {/* ── Navigation rapide (ancres) ─────────────────────────────── */}
        <nav
          className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin [scrollbar-width:thin]"
          aria-label="Sections du guide destination"
        >
          {SECTION_META.map((meta) => (
            <button
              key={meta.key}
              type="button"
              onClick={() => scrollToSection(meta.key)}
              className="shrink-0 rounded-full px-3.5 py-2 text-[12px] font-medium border transition-colors"
              style={{
                borderColor: `${meta.color}55`,
                color:       meta.color,
                background:  `${meta.color}10`,
              }}
            >
              {SECTION_NAV_SHORT[meta.key]}
            </button>
          ))}
        </nav>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {error && (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-red-400/80">{error}</p>
            <button
              onClick={load}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Sections ────────────────────────────────────────────────── */}
        {!error && SECTION_META.map((meta) => {
          const isRevealed = revealed.has(meta.key);

          return (
            <div
              key={meta.key}
              id={`deepdive-section-${meta.key}`}
              ref={(el) => { sectionRefs.current[meta.key] = el; }}
              className="scroll-mt-4 rounded-[14px] p-5 sm:p-6 bg-card border border-[var(--border-subtle)] backdrop-blur-[10px]"
              style={{ borderLeft: `3px solid ${meta.color}` }}
            >
              {/* Section header */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-4">
                <span style={{ color: meta.color, fontSize: "15px", lineHeight: 1 }} aria-hidden>
                  {meta.icon}
                </span>
                <span
                  className="text-[11px] sm:text-[12px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] opacity-60 hidden sm:inline">—</span>
                <span className="text-[12px] sm:text-[13px] text-[var(--text-secondary)] w-full sm:w-auto mt-0.5 sm:mt-0">
                  {meta.tagline}
                </span>
              </div>

              {/* Content / skeleton */}
              <AnimatePresence mode="wait">
                {!isRevealed || !data ? (
                  <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <SectionSkeleton rows={SKELETON_ROWS[meta.key]} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {SECTION_CONTENT_MAP[meta.key](data)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* ── Footer: Share + Collapse ─────────────────────────────────── */}
        {!error && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-[var(--border-subtle)] mt-2">
            <button
              onClick={handleShare}
              disabled={!data}
              className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={copied ? "copied" : "share"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  style={{ color: copied ? "#4ecca3" : undefined }}
                >
                  {copied ? "Copié ✓" : "Partager ce condensé"}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-[13px] font-medium text-[#8a96b0] hover:text-[#c8d4e8] transition-colors"
            >
              <span>Réduire tout</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
