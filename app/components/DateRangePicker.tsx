"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const t = date.getTime();
  return t > Math.min(from.getTime(), to.getTime()) &&
         t < Math.max(from.getTime(), to.getTime());
}

/** Returns a Monday-first 7-column grid of Date|null for the given month. */
function getMonthCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  let dow = firstDay.getDay() - 1; // Sunday (0) → -1 → 6
  if (dow < 0) dow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < dow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return cells;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [hovered, setHovered]     = useState<Date | null>(null);

  // Sync selecting step when parent resets value
  useEffect(() => {
    if (!value.from && !value.to) setSelecting("from");
    else if (value.from && !value.to) setSelecting("to");
  }, [value.from, value.to]);

  const cells = useMemo(
    () => getMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleDayClick = useCallback(
    (date: Date) => {
      if (selecting === "from") {
        onChange({ from: date, to: null });
        setSelecting("to");
      } else {
        const base = value.from;
        if (base && date.getTime() < base.getTime()) {
          // Clicked before "from" — swap
          onChange({ from: date, to: base });
        } else {
          onChange({ from: base, to: date });
        }
        setSelecting("from");
        setHovered(null);
      }
    },
    [selecting, value.from, onChange]
  );

  // While selecting "to", preview the range against hovered date
  const previewTo = selecting === "to" ? hovered : null;

  // ── Chip button styles ──────────────────────────────────────────────────────
  const chipStyle = (active: boolean, hasValue: boolean): React.CSSProperties => ({
    flex: 1,
    background: active ? "rgba(78,204,163,0.1)" : "rgba(255,255,255,0.04)",
    border: `0.5px solid ${active ? "rgba(78,204,163,0.4)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "8px",
    padding: "7px 10px",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: "var(--font-body)",
  });

  return (
    <div style={{ padding: "12px 14px", fontFamily: "var(--font-body)" }}>

      {/* ── Date chips ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>

        {/* From chip */}
        <button
          onClick={() => { onChange({ from: null, to: null }); setSelecting("from"); }}
          style={chipStyle(selecting === "from", !!value.from)}
        >
          <span style={{
            display: "block", fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#4a5268", marginBottom: "3px",
          }}>
            Départ
          </span>
          <span style={{
            fontSize: "12px", fontWeight: selecting === "from" ? 700 : 500,
            color: value.from ? "#4ecca3" : "#4a5268",
          }}>
            {fmtDate(value.from)}
          </span>
        </button>

        <span style={{ color: "#4a5268", fontSize: "14px", flexShrink: 0 }}>→</span>

        {/* To chip */}
        <button
          onClick={() => value.from && setSelecting("to")}
          style={{
            ...chipStyle(selecting === "to", !!value.to),
            cursor: value.from ? "pointer" : "default",
          }}
        >
          <span style={{
            display: "block", fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#4a5268", marginBottom: "3px",
          }}>
            Retour
          </span>
          <span style={{
            fontSize: "12px", fontWeight: selecting === "to" ? 700 : 500,
            color: value.to ? "#4ecca3" : "#4a5268",
          }}>
            {fmtDate(value.to)}
          </span>
        </button>
      </div>

      {/* ── Calendar ───────────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(255,255,255,0.025)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "10px",
      }}>
        {/* Month nav */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "8px",
        }}>
          <button
            onClick={prevMonth}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#7a8499", fontSize: "20px", padding: "2px 8px",
              lineHeight: 1, borderRadius: "4px",
            }}
          >
            ‹
          </button>
          <span style={{
            fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
            color: "#e8eaf0",
          }}>
            {MONTHS_FR[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#7a8499", fontSize: "20px", padding: "2px 8px",
              lineHeight: 1, borderRadius: "4px",
            }}
          >
            ›
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "3px" }}>
          {DAYS_SHORT.map((d, i) => (
            <span key={i} style={{
              textAlign: "center", fontSize: "9px", fontWeight: 600,
              color: "#4a5268", letterSpacing: "0.05em", padding: "2px 0",
            }}>
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;

            const isPast   = date.getTime() < today.getTime();
            const isFrom   = !!(value.from && isSameDay(date, value.from));
            const isTo     = !!(value.to   && isSameDay(date, value.to));
            const isPrevEnd = !!(previewTo  && isSameDay(date, previewTo));
            const isInRange = inRange(date, value.from, value.to) ||
                              inRange(date, value.from, previewTo);
            const isToday  = isSameDay(date, today);

            let bg    = "transparent";
            let color = isPast ? "#2a3248" : "#c8d0e0";
            let fontW = 400;
            let border= "none";

            if (isFrom || isTo) {
              bg = "#4ecca3"; color = "#0f1117"; fontW = 700;
            } else if (isPrevEnd) {
              bg = "rgba(78,204,163,0.45)"; color = "#0f1117"; fontW = 700;
            } else if (isInRange) {
              bg = "rgba(78,204,163,0.12)"; color = "#4ecca3";
            } else if (isToday) {
              color = "#4ecca3";
              border = "0.5px solid rgba(78,204,163,0.35)";
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && handleDayClick(date)}
                onMouseEnter={() => !isPast && setHovered(date)}
                onMouseLeave={() => setHovered(null)}
                disabled={isPast}
                style={{
                  background: bg,
                  border,
                  borderRadius: "5px",
                  color,
                  width: "100%",
                  padding: "5px 0",
                  fontSize: "11px",
                  fontWeight: fontW,
                  cursor: isPast ? "default" : "pointer",
                  textAlign: "center",
                  fontFamily: "var(--font-body)",
                  lineHeight: 1,
                  transition: "background 0.1s, color 0.1s",
                  outline: "none",
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instruction hint */}
      <p style={{
        textAlign: "center", fontSize: "9.5px", color: "#4a5268",
        marginTop: "8px", marginBottom: 0, fontStyle: "italic",
        fontFamily: "var(--font-body)",
      }}>
        {selecting === "from"
          ? "Cliquez pour choisir la date de départ"
          : "Cliquez pour choisir la date de retour"}
      </p>
    </div>
  );
}
