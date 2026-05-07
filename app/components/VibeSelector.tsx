"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ───────────────────────────────────────────────────────────────────────

export interface VibeOption {
  id:    string;
  emoji: string;
  label: string;
  sub:   string;
  color: string;
}

export const TRAVELER_VIBES: VibeOption[] = [
  { id: "adrenaline", emoji: "🏄", label: "Adrénaline",  sub: "Sports extrêmes & aventure",  color: "#FF4D00" },
  { id: "nightlife",  emoji: "🎉", label: "Nightlife",   sub: "Bars, clubs & fêtes",          color: "#7C3AED" },
  { id: "food",       emoji: "🍜", label: "Gastronomie", sub: "Food scene & restos locaux",   color: "#F59E0B" },
  { id: "nature",     emoji: "🌿", label: "Nature",      sub: "Randonnée & grand air",        color: "#10B981" },
  { id: "culture",    emoji: "🏛️", label: "Culture",    sub: "Musées & histoire",            color: "#3B82F6" },
  { id: "beach",      emoji: "🌊", label: "Plage",       sub: "Beach clubs & mer",            color: "#06B6D4" },
  { id: "wellness",   emoji: "🧘", label: "Bien-être",   sub: "Spa, yoga & détente",          color: "#EC4899" },
  { id: "music",      emoji: "🎵", label: "Musique",     sub: "Concerts & festivals",         color: "#F97316" },
  { id: "art",        emoji: "🎨", label: "Art & Créa",  sub: "Galeries & street art",        color: "#8B5CF6" },
  { id: "shopping",   emoji: "🛍️", label: "Shopping",   sub: "Mode & marchés locaux",        color: "#EF4444" },
  { id: "urban",      emoji: "🏙️", label: "Urban",      sub: "Exploration & architecture",   color: "#64748B" },
  { id: "family",     emoji: "👨‍👩‍👧", label: "Famille",   sub: "Activités pour tous",          color: "#84CC16" },
];

// ── Props ───────────────────────────────────────────────────────────────────────

interface VibeSelectorProps {
  city:          string;
  onConfirm:     (vibes: string[]) => void;
  hasDates:      boolean;
  initialVibes?: string[];
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function VibeSelector({
  city,
  onConfirm,
  hasDates,
  initialVibes = [],
}: VibeSelectorProps) {
  const [selected, setSelected] = useState<string[]>(initialVibes);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev,
    );
  };

  const selectedVibes = TRAVELER_VIBES.filter((v) => selected.includes(v.id));

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar p-4">
      {/* Header */}
      <div className="mb-4 text-center">
        {city && (
          <div
            className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest uppercase"
            style={{
              background:  "rgba(124,58,237,0.12)",
              border:      "1px solid rgba(124,58,237,0.28)",
              color:       "#A78BFA",
              fontFamily:  "var(--font-display)",
            }}
          >
            {city}
          </div>
        )}
        <p
          className="m-0 mb-1 text-[14px] font-bold leading-snug"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
        >
          Quel est ton vibe pour ce voyage ?
        </p>
        <p className="m-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Choisis jusqu'à <strong style={{ color: "var(--text-secondary)" }}>4 catégories</strong> — l'itinéraire sera entièrement adapté.
        </p>
      </div>

      {/* Grid */}
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {TRAVELER_VIBES.map((vibe) => {
          const isSelected = selected.includes(vibe.id);
          const isDisabled = !isSelected && selected.length >= 4;

          return (
            <motion.button
              key={vibe.id}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              onClick={() => !isDisabled && toggle(vibe.id)}
              className="relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-[12px] border px-2 py-2.5 text-center transition-all"
              style={{
                background:  isSelected ? `${vibe.color}18` : "var(--bg-surface)",
                borderColor: isSelected ? `${vibe.color}55` : "var(--border-subtle)",
                opacity:     isDisabled ? 0.4 : 1,
                cursor:      isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {/* Selected check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: vibe.color }}
                >
                  ✓
                </motion.div>
              )}

              <span className="text-[20px] leading-none">{vibe.emoji}</span>
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {vibe.label}
              </span>
              <span
                className="text-[9px] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                {vibe.sub}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected pills */}
      <AnimatePresence>
        {selectedVibes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex flex-wrap gap-1.5 overflow-hidden"
          >
            {selectedVibes.map((v) => (
              <motion.span
                key={v.id}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background:  `${v.color}18`,
                  border:      `1px solid ${v.color}40`,
                  color:       v.color,
                }}
              >
                {v.emoji} {v.label}
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(v.id); }}
                  className="cursor-pointer border-none bg-transparent p-0 text-[10px] opacity-60 hover:opacity-100"
                  style={{ color: v.color }}
                >
                  ✕
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      {!hasDates && (
        <p className="mb-2 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          Sélectionne d'abord tes dates dans l'onglet Activités.
        </p>
      )}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={selected.length === 0 || !hasDates}
        onClick={() => onConfirm(selected)}
        className="w-full cursor-pointer rounded-[10px] border-none py-3 text-[13px] font-bold text-white transition-all"
        style={{
          background: selected.length === 0 || !hasDates
            ? "var(--border-subtle)"
            : "linear-gradient(135deg, #7C3AED, #FF4D00)",
          color:   selected.length === 0 || !hasDates ? "var(--text-muted)" : "#fff",
          cursor:  selected.length === 0 || !hasDates ? "not-allowed" : "pointer",
          fontFamily: "var(--font-display)",
        }}
      >
        {!hasDates
          ? "Ajoute tes dates pour continuer"
          : selected.length === 0
          ? "Sélectionne au moins 1 vibe"
          : `Générer mon itinéraire (${selected.length} vibe${selected.length > 1 ? "s" : ""})`}
      </motion.button>
    </div>
  );
}
