"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchEvents, type UnifiedEvent, type EventDateRange } from "@/app/lib/EventAggregatorService";

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  FESTIVAL:    { icon: "🎪", color: "oklch(70% 0.18 30)"  },
  CONCERT:     { icon: "🎵", color: "oklch(63% 0.16 253)" },
  CLUB_NIGHT:  { icon: "🎧", color: "oklch(70% 0.14 300)" },
  BEACH_PARTY: { icon: "🌊", color: "oklch(72% 0.14 52)"  },
  SPORTS:      { icon: "⚽", color: "oklch(65% 0.17 148)" },
  DEFAULT:     { icon: "✨", color: "oklch(63% 0.14 163)" },
};

function getCategory(type: string) {
  const key = type?.toUpperCase().replace(/[\s-]+/g, "_");
  return CATEGORY_CONFIG[key] ?? CATEGORY_CONFIG.DEFAULT;
}

// ── Source badge config ───────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  ticketmaster:     { label: "TM",  color: "#0065ff" },
  eventbrite:       { label: "EB",  color: "#f05537" },
  seatgeek:         { label: "SG",  color: "#d4253b" },
  bandsintown:      { label: "BIT", color: "#00b4b3" },
  songkick:         { label: "SK",  color: "#f80046" },
  resident_advisor: { label: "RA",  color: "#ff6b35" },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBD";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short",
    });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function getTimeSlot(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const h = new Date(dateStr).getHours();
    if (h < 12) return "Matin";
    if (h < 17) return "Après-midi";
    return "Soir";
  } catch {
    return null;
  }
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function EventSkeleton() {
  return (
    <div
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        background: "oklch(9% 0.01 260 / 0.96)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        animation: "pulse 1.6s ease-in-out infinite",
      }}
    >
      <div style={{ height: "160px", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", marginBottom: "8px", width: "40%" }} />
        <div style={{ height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", marginBottom: "5px", width: "90%" }} />
        <div style={{ height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", marginBottom: "10px", width: "65%" }} />
        <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", width: "50%" }} />
      </div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: UnifiedEvent;
  index: number;
}

function EventCard({ event, index }: EventCardProps) {
  const src = SOURCE_CONFIG[event.source] ?? { label: "??", color: "#555" };
  const cat = getCategory(event.type);
  const timeSlot = getTimeSlot(event.date);

  return (
    <motion.a
      href={event.url ?? "#"}
      target={event.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02 }}
      style={{
        display: "block",
        borderRadius: "12px",
        overflow: "hidden",
        background: "oklch(9% 0.01 260 / 0.96)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        textDecoration: "none",
        cursor: event.url ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      {/* ── Image area ─────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${cat.color}40 0%, ${cat.color}18 50%, oklch(9% 0.01 260) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "38px",
            }}
          >
            {cat.icon}
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "64px",
            background: "linear-gradient(to bottom, transparent, oklch(9% 0.01 260 / 0.97))",
            pointerEvents: "none",
          }}
        />

        {/* Source badge */}
        <span
          style={{
            position: "absolute", top: "8px", right: "8px",
            background: src.color, color: "#fff",
            fontSize: "9px", fontWeight: 700,
            padding: "3px 7px", borderRadius: "6px",
            fontFamily: "var(--font-body)", letterSpacing: "0.05em",
          }}
        >
          {src.label}
        </span>
      </div>

      {/* ── Info area ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 14px" }}>

        {/* Category icon + label + time slot */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", lineHeight: 1 }}>{cat.icon}</span>
          <span
            style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em",
              color: cat.color, fontFamily: "var(--font-body)", textTransform: "uppercase",
            }}
          >
            {event.type || "Événement"}
          </span>
          {timeSlot && (
            <>
              <span style={{ color: "var(--text-muted, rgba(255,255,255,0.38))", fontSize: "11px" }}>·</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted, rgba(255,255,255,0.38))", fontFamily: "var(--font-body)" }}>
                {timeSlot}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <p
          style={{
            margin: "0 0 5px",
            fontSize: "14px", fontWeight: 600,
            color: "var(--text-primary, #e8eaf0)", fontFamily: "var(--font-display)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.title}
        </p>

        {/* Venue */}
        {event.venue && (
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px", color: "var(--text-muted, rgba(255,255,255,0.45))",
              fontFamily: "var(--font-body)",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            📍 {event.venue}
          </p>
        )}

        {/* Date + price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: "12px", fontWeight: 500,
              color: cat.color, fontFamily: "var(--font-body)",
            }}
          >
            {formatEventDate(event.date)}
          </span>
          {event.priceRange && (
            <span
              style={{
              fontSize: "12px", fontWeight: 600,
                color: "#e9a23b", fontFamily: "var(--font-body)",
              }}
            >
              {event.priceRange}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasDateRange }: { hasDateRange: boolean }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "12px", padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "36px" }}>🎟️</span>
      <p
        style={{
          margin: 0, color: "var(--text-muted, rgba(255,255,255,0.3))",
          fontSize: "13px", fontFamily: "var(--font-body)", lineHeight: 1.6,
        }}
      >
        Aucun événement trouvé pour ces dates.
      </p>
      {!hasDateRange && (
        <p
          style={{
            margin: 0, color: "var(--text-muted, rgba(255,255,255,0.25))",
            fontSize: "12px", fontFamily: "var(--font-body)", lineHeight: 1.5,
          }}
        >
          Essayez d&apos;ajouter une plage de dates pour obtenir de meilleurs résultats.
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

interface EventsPanelProps {
  city?: string;
  country?: string;
  dateRange: EventDateRange;
  moods?: string[];
}

export default function EventsPanel({ city, country, dateRange, moods }: EventsPanelProps) {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!city) return;

    setLoading(true);
    setFetched(false);
    setShowAll(false);
    fetchEvents(city, dateRange, moods ?? [], country ?? "")
      .then((data) => {
        setEvents(data);
        setFetched(true);
      })
      .catch(() => {
        setEvents([]);
        setFetched(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, dateRange.from?.toISOString(), dateRange.to?.toISOString()]);

  // Re-sort when moods change (no new fetch needed — scored in service)
  useEffect(() => {
    if (!city || !fetched) return;
    fetchEvents(city, dateRange, moods ?? [], country ?? "").then(setEvents).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(moods)]);

  const noCity = !city;
  const hasDateRange = !!(dateRange.from || dateRange.to);
  const displayed = showAll ? events : events.slice(0, PAGE_SIZE);

  if (noCity) {
    return (
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", fontFamily: "var(--font-body)" }}>
          Sélectionnez une destination pour découvrir les événements.
        </p>
      </div>
    );
  }

  return (
    <div
      className="no-scrollbar"
      style={{
        height: "100%", overflowY: "auto",
        padding: "16px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}
    >
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {Array.from({ length: 6 }).map((_, i) => <EventSkeleton key={i} />)}
        </div>
      ) : events.length === 0 && fetched ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
          <EmptyState hasDateRange={hasDateRange} />
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div
              key="event-grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}
            >
              {displayed.map((ev, i) => (
                <EventCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {!showAll && events.length > PAGE_SIZE && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                alignSelf: "center",
                padding: "8px 22px",
                borderRadius: "20px",
                border: "0.5px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "11px",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Voir plus · {events.length - PAGE_SIZE} événements
            </button>
          )}
        </>
      )}
    </div>
  );
}
