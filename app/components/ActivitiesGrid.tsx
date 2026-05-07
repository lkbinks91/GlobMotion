"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getContextualActivities,
  type ContextualActivity,
  type ActivityCategory,
} from "@/app/lib/ActivityRecommendationEngine";

// ── Category config ───────────────────────────────────────────────────────────

const CAT: Record<ActivityCategory, { color: string; icon: string; label: string }> = {
  NATURE:    { color: "oklch(65% 0.17 148)",  icon: "🌿", label: "Nature"       },
  CULTURE:   { color: "oklch(67% 0.16 300)",  icon: "🏛️",  label: "Culture"      },
  NIGHTLIFE: { color: "oklch(70% 0.14 270)",  icon: "🌙", label: "Nightlife"    },
  FOOD:      { color: "oklch(72% 0.14 52)",   icon: "🍽️",  label: "Gastronomie"  },
  SPORT:     { color: "oklch(70% 0.18 30)",   icon: "⚡", label: "Sport"        },
  FESTIVAL:  { color: "oklch(63% 0.14 163)",  icon: "🎪", label: "Festival"     },
};

// ── ActivityCard ──────────────────────────────────────────────────────────────

function ActivityCard({ activity, index }: { activity: ContextualActivity; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CAT[activity.category] ?? CAT.CULTURE;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((e) => !e)}
      onKeyDown={(e) => e.key === "Enter" && setExpanded((x) => !x)}
      style={{
        background:    "rgba(255,255,255,0.03)",
        borderTop:     "0.5px solid rgba(255,255,255,0.07)",
        borderRight:   "0.5px solid rgba(255,255,255,0.07)",
        borderBottom:  "0.5px solid rgba(255,255,255,0.07)",
        borderLeft:    `2px solid ${cat.color}`,
        borderRadius:  "10px",
        padding:       "16px 18px",
        cursor:        "pointer",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        gap:           "10px",
      }}
    >
      {/* ── Row 1: icon + category label + time ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "13px", lineHeight: 1 }}>{cat.icon}</span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700,
            color: cat.color, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {cat.label}
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "11px",
          color: "var(--text-muted, rgba(255,255,255,0.45))", whiteSpace: "nowrap",
        }}>
          {activity.best_time_of_day}
        </span>
      </div>

      {/* ── Row 2: title ── */}
      <p style={{
        fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700,
        color: "var(--text-primary, #e8eaf0)", margin: 0, lineHeight: 1.35,
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {activity.name}
      </p>

      {/* ── Row 3: why now (1 line) ── */}
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500,
        color: cat.color, margin: 0, lineHeight: 1.5,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        ✦ {activity.why_now}
      </p>

      {/* ── Divider ── */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", margin: "0 -2px" }} />

      {/* ── Expand toggle ── */}
      <div style={{
        fontSize: "11px", fontFamily: "var(--font-body)",
        color: "var(--text-muted, rgba(255,255,255,0.35))",
        display: "flex", alignItems: "center", gap: "4px",
      }}>
        {expanded ? "Réduire ↑" : "Détails ↓"}
      </div>

      {/* ── Expandable tip ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="tip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "13px",
              color: "rgba(210,222,240,0.92)", margin: 0,
              lineHeight: 1.75, paddingTop: "6px",
            }}>
              {activity.insider_tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ActivitiesSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: "110px", borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            borderLeft: "2px solid rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
  );
}

// ── Empty / no-date placeholder ───────────────────────────────────────────────

function DatePrompt() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      paddingTop: "24px", gap: "10px", color: "#4a5268",
    }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.3" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "11px",
        textAlign: "center", lineHeight: 1.6,
      }}>
        Sélectionnez vos dates pour voir<br />les activités de saison
      </span>
    </div>
  );
}

// ── ActivitiesGrid (main export) ──────────────────────────────────────────────

interface ActivitiesGridProps {
  city?: string | null;
  country?: string | null;
  dateRange: { from: Date | null; to: Date | null };
  moods?: string[];
}

export default function ActivitiesGrid({
  city,
  country,
  dateRange,
  moods,
}: ActivitiesGridProps) {
  const [activities, setActivities] = useState<ContextualActivity[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fromMs = dateRange.from?.getTime() ?? null;
  const toMs   = dateRange.to?.getTime()   ?? null;

  useEffect(() => {
    if (!city || !fromMs || !toMs) {
      setActivities([]);
      return;
    }

    setLoading(true);
    setError(null);

    getContextualActivities(
      { city, country: country ?? "" },
      { from: new Date(fromMs), to: new Date(toMs) },
      moods
    )
      .then((items) => {
        if (items.length === 0) setError("Impossible de générer les activités.");
        else setActivities(items);
      })
      .catch(() => setError("Erreur lors de la récupération."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, country, fromMs, toMs]);

  if (!fromMs || !toMs) return <DatePrompt />;
  if (loading) return <ActivitiesSkeleton />;

  if (error) {
    return (
      <p style={{
        textAlign: "center", color: "#4a5268",
        fontSize: "11px", fontFamily: "var(--font-body)",
        padding: "20px 14px",
      }}>
        {error}
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", alignItems: "stretch" }}>
      {activities.map((act, i) => (
        <ActivityCard
          key={`${act.name}-${i}`}
          activity={act}
          index={i}
        />
      ))}
    </div>
  );
}
