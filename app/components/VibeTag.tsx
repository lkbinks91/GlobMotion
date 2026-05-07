"use client";

import { motion } from "framer-motion";

// ── Vibe → SVG icon map ───────────────────────────────────────────────────────
// All icons: 16×16 viewBox, 1.5px stroke, no fill (except where noted)

const VIBE_ICONS: Record<string, React.ReactNode> = {
  // ── Party / Night ────────
  festif: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M4.1 11.9l1.4-1.4M10.5 5.5l1.4-1.4" />
      <circle cx="8" cy="8" r="2.5" />
    </svg>
  ),
  // ── Chill / Relax ────────
  calme: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 10 Q5 6 8 10 Q11 14 14 10" />
      <path d="M2 7 Q5 3 8 7 Q11 11 14 7" opacity="0.4" />
    </svg>
  ),
  détente: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 10 Q5 6 8 10 Q11 14 14 10" />
      <path d="M2 7 Q5 3 8 7 Q11 11 14 7" opacity="0.4" />
    </svg>
  ),
  zen: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5 8 Q6.5 5.5 8 8 Q9.5 10.5 11 8" />
    </svg>
  ),
  // ── Nature ────────
  nature: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14V8" />
      <path d="M8 8 C8 8 3 6 3 2 C5.5 2 7 4 8 5.5 C9 4 10.5 2 13 2 C13 6 8 8 8 8Z" />
    </svg>
  ),
  sauvage: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14V8" />
      <path d="M8 8 C8 8 3 6 3 2 C5.5 2 7 4 8 5.5 C9 4 10.5 2 13 2 C13 6 8 8 8 8Z" />
    </svg>
  ),
  aventure: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,2 14,13 2,13" />
      <line x1="8" y1="6" x2="8" y2="10" />
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  // ── Culture / History ────────
  culturel: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14h12" />
      <path d="M3 14V8l5-5 5 5v6" />
      <rect x="6" y="10" width="4" height="4" />
    </svg>
  ),
  historique: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <polyline points="8,5 8,8 10,9" />
    </svg>
  ),
  // ── Urban ────────
  urbain: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="8" width="5" height="6" />
      <rect x="6" y="4" width="4" height="10" />
      <rect x="10" y="6" width="5" height="8" />
      <line x1="1" y1="14" x2="15" y2="14" />
    </svg>
  ),
  futuriste: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="8,2 14,11 2,11" />
      <line x1="8" y1="11" x2="8" y2="14" />
      <line x1="5" y1="14" x2="11" y2="14" />
    </svg>
  ),
  // ── Gastronomy ────────
  gastronomie: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 2v5a3 3 0 0 0 6 0V2" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="5" y1="14" x2="11" y2="14" />
    </svg>
  ),
  // ── Spiritual ────────
  spirituel: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="6" r="3.5" />
      <path d="M8 9.5v4" />
      <path d="M5.5 11.5h5" />
    </svg>
  ),
  // ── Sport ────────
  sportif: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5.5 5.5 Q8 8 10.5 5.5" />
      <path d="M5.5 10.5 Q8 8 10.5 10.5" />
    </svg>
  ),
  // ── Luxury ────────
  luxueux: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,2 10,6.5 15,6.5 11,9.5 12.5,14 8,11 3.5,14 5,9.5 1,6.5 6,6.5" />
    </svg>
  ),
  // ── Romantic ────────
  romantique: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5 C8 13.5 2 9.5 2 5.5 C2 3.5 3.5 2 5.5 2 C6.8 2 8 3 8 3 C8 3 9.2 2 10.5 2 C12.5 2 14 3.5 14 5.5 C14 9.5 8 13.5 8 13.5Z" />
    </svg>
  ),
  // ── Bohemian ────────
  bohème: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M4.1 11.9l1.4-1.4M10.5 5.5l1.4-1.4" opacity="0.5" />
    </svg>
  ),
  // ── Minimalist ────────
  minimaliste: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="5" x2="9" y2="5" />
      <line x1="3" y1="11" x2="11" y2="11" />
    </svg>
  ),
  // ── Mysterious ────────
  mystérieux: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6 6.5 C6 5 7 4.5 8 4.5 C9.2 4.5 10 5.2 10 6.3 C10 7.8 8 8 8 9.5" />
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// Fallback icon for unknown vibes
const DefaultIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="5.5" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// ── Accent hue per vibe (used for gradient border & text tint) ───────────────
const VIBE_ACCENT: Record<string, string> = {
  festif:      "oklch(70% 0.18 30)",
  calme:       "oklch(63% 0.14 200)",
  détente:     "oklch(63% 0.14 200)",
  zen:         "oklch(65% 0.16 175)",
  nature:      "oklch(65% 0.17 148)",
  sauvage:     "oklch(62% 0.16 130)",
  aventure:    "oklch(70% 0.15 55)",
  culturel:    "oklch(67% 0.16 300)",
  historique:  "oklch(65% 0.14 290)",
  urbain:      "oklch(63% 0.16 253)",
  futuriste:   "oklch(65% 0.18 240)",
  gastronomie: "oklch(72% 0.14 52)",
  spirituel:   "oklch(68% 0.16 320)",
  sportif:     "oklch(70% 0.16 200)",
  luxueux:     "oklch(78% 0.12 72)",
  romantique:  "oklch(67% 0.18 10)",
  bohème:      "oklch(70% 0.13 75)",
  minimaliste: "oklch(58% 0.03 250)",
  mystérieux:  "oklch(60% 0.18 285)",
};

interface VibeTagProps {
  label: string;
}

export default function VibeTag({ label }: VibeTagProps) {
  const lower  = label.toLowerCase();
  const icon   = VIBE_ICONS[lower] ?? <DefaultIcon />;
  const accent = VIBE_ACCENT[lower] ?? "oklch(63% 0.14 163)";

  return (
    <motion.span
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold tracking-[0.02em] relative select-none cursor-default"
      style={{
        color:      accent,
        background: `color-mix(in oklch, ${accent} 12%, transparent)`,
        border:     `0.5px solid color-mix(in oklch, ${accent} 35%, transparent)`,
        boxShadow:  `0 0 0 0.5px color-mix(in oklch, ${accent} 12%, transparent) inset`,
      }}
    >
      <span style={{ opacity: 0.85, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      {label}
    </motion.span>
  );
}
