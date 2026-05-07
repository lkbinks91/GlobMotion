"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type MockDestination } from "@/data/mockDestinations";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface AlternativeDestination {
  /** Unique identifier for the alternative entry */
  id: string;
  /** Full destination data (same shape as the main API response) */
  data: MockDestination;
  /** Computed similarity score, 0–100 */
  matchScore: number;
}

export interface AlternativeDestinationsCarouselProps {
  destinations: AlternativeDestination[];
  /** Called when the user clicks "Choisir cette destination" — triggers main-card swap */
  onSelect: (destination: AlternativeDestination) => void;
  /** Called when the user toggles the bookmark icon */
  onFavorite: (destination: AlternativeDestination) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookmark SVG icon
// ─────────────────────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "#4ecca3" : "none"}
      stroke={filled ? "#4ecca3" : "rgba(255,255,255,0.38)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  dest: AlternativeDestination;
  isActive: boolean;
  isFav: boolean;
  onSelect: () => void;
  onFavorite: (e: React.MouseEvent) => void;
}

function AltCard({ dest, isActive, isFav, onSelect, onFavorite }: CardProps) {
  const moods = dest.data.vibe.slice(0, 3);

  return (
    <article
      style={{
        flexShrink: 0,
        width: "min(280px, calc(100vw - 52px))",
        minWidth: "min(280px, calc(100vw - 52px))",
        scrollSnapAlign: "start",
        borderRadius: "12px",
        padding: "14px 14px 12px",
        background: "rgba(28, 34, 48, 0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: isActive
          ? "1px solid rgba(78, 204, 163, 0.55)"
          : "0.5px solid rgba(255, 255, 255, 0.08)",
        boxShadow: isActive
          ? "0 0 0 1px rgba(78,204,163,0.18), 0 0 28px rgba(78,204,163,0.16), inset 0 0 20px rgba(78,204,163,0.04)"
          : "none",
        transition: "border 0.25s ease, box-shadow 0.25s ease",
        position: "relative",
      }}
    >
      {/* Match % chip — top left */}
      <div
        style={{
          position: "absolute",
          top: "11px",
          left: "11px",
          background: isActive ? "rgba(78,204,163,0.18)" : "rgba(26,158,110,0.1)",
          border: `0.5px solid rgba(78,204,163,${isActive ? "0.45" : "0.22"})`,
          borderRadius: "999px",
          padding: "2px 8px",
          fontSize: "10px",
          fontWeight: 700,
          color: "#4ecca3",
          letterSpacing: "0.04em",
          fontFamily: "var(--font-body)",
          lineHeight: 1.4,
        }}
      >
        {dest.matchScore}% match
      </div>

      {/* Bookmark — top right */}
      <button
        onClick={onFavorite}
        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFav}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "5px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.18s ease",
          lineHeight: 0,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
        }
      >
        <BookmarkIcon filled={isFav} />
      </button>

      {/* City name */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "16px",
          fontWeight: 800,
          color: "#e8eaf0",
          margin: "28px 0 2px",
          lineHeight: 1.2,
        }}
      >
        {dest.data.destination.city}
      </h3>

      {/* Country */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          color: "#7a8499",
          margin: "0 0 10px",
        }}
      >
        {dest.data.destination.country}
      </p>

      {/* Mood tags (max 3) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "13px",
        }}
      >
        {moods.map((tag) => (
          <span
            key={tag}
            style={{
              borderRadius: "999px",
              padding: "2px 8px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "#4ecca3",
              border: "0.5px solid rgba(78,204,163,0.28)",
              background: "rgba(26,158,110,0.12)",
              fontFamily: "var(--font-body)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA — framer-motion tap feedback, click triggers card swap in parent */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "8px 0",
          border: isActive
            ? "1px solid rgba(78,204,163,0.45)"
            : "0.5px solid rgba(255,255,255,0.11)",
          borderRadius: "8px",
          background: isActive ? "rgba(78,204,163,0.13)" : "rgba(255,255,255,0.04)",
          color: isActive ? "#4ecca3" : "#b0bad0",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s ease, border 0.2s ease, color 0.2s ease",
          fontFamily: "var(--font-body)",
          letterSpacing: "0.01em",
        }}
      >
        {isActive ? "✓ Destination choisie" : "Choisir cette destination"}
      </motion.button>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function AlternativeDestinationsCarousel({
  destinations,
  onSelect,
  onFavorite,
}: AlternativeDestinationsCarouselProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  if (!destinations.length) return null;

  const handleSelect = (dest: AlternativeDestination) => {
    setActiveId(dest.id);
    onSelect(dest);
  };

  const handleFavorite = (e: React.MouseEvent, dest: AlternativeDestination) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(dest.id) ? next.delete(dest.id) : next.add(dest.id);
      return next;
    });
    onFavorite(dest);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Destinations alternatives"
      style={{ marginTop: "20px", width: "100%" }}
    >
      {/* Section label */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4a5268",
          margin: "0 0 10px 0",
        }}
      >
        Alternatives à explorer
      </p>

      {/* Horizontal scroll track — uses no-scrollbar utility from globals.css */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "4px",
        }}
      >
        {destinations.map((dest) => (
          <AltCard
            key={dest.id}
            dest={dest}
            isActive={activeId === dest.id}
            isFav={favorites.has(dest.id)}
            onSelect={() => handleSelect(dest)}
            onFavorite={(e) => handleFavorite(e, dest)}
          />
        ))}
      </div>
    </motion.section>
  );
}
