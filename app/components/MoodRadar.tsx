"use client";

import { useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RadarScores {
  party:   number; // 0-1
  chill:   number;
  culture: number;
  nature:  number;
  social:  number;
}

interface MoodRadarProps {
  scores:  RadarScores;
  size?:   number;
  accent?: string;
}

// ── Axes meta ─────────────────────────────────────────────────────────────────

const AXES: { key: keyof RadarScores; label: string; icon: string }[] = [
  { key: "party",   label: "Party",   icon: "◈" },
  { key: "chill",   label: "Chill",   icon: "∿" },
  { key: "culture", label: "Culture", icon: "◎" },
  { key: "nature",  label: "Nature",  icon: "⌘" },
  { key: "social",  label: "Social",  icon: "◉" },
];

const N = AXES.length; // 5

// ── Radar math ────────────────────────────────────────────────────────────────

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);  // start from top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildPolygon(values: number[], maxR: number, cx: number, cy: number): string {
  return values
    .map((v, i) => {
      const angle = (360 / N) * i;
      const { x, y } = polarToXY(angle, v * maxR, cx, cy);
      return `${x},${y}`;
    })
    .join(" ");
}

// ── Vibe → score inference ────────────────────────────────────────────────────

export function vibesToRadarScores(vibes: string[]): RadarScores {
  const scores: RadarScores = { party: 0, chill: 0, culture: 0, nature: 0, social: 0 };
  const inc = 0.35;

  const lower = vibes.join(" ").toLowerCase();

  if (/festif|party|nightlife|club|electro/.test(lower))              scores.party   = Math.min(1, scores.party   + inc * 2.5);
  if (/calme|détente|zen|relax|cozy|quiet|spa/.test(lower))           scores.chill   = Math.min(1, scores.chill   + inc * 2.5);
  if (/culturel|historique|art|museum|baroque|theater/.test(lower))   scores.culture = Math.min(1, scores.culture + inc * 2.5);
  if (/nature|sauvage|aventure|trek|forest|ocean|beach/.test(lower))  scores.nature  = Math.min(1, scores.nature  + inc * 2.5);
  if (/social|urbain|gastronomie|bohème|romantique/.test(lower))      scores.social  = Math.min(1, scores.social  + inc * 2.5);

  // Secondary bumps
  if (/luxueux|luxury/.test(lower))      scores.social  = Math.min(1, scores.social  + inc);
  if (/mystérieux|futuriste/.test(lower)) scores.culture = Math.min(1, scores.culture + inc);
  if (/sportif|aventure/.test(lower))    scores.nature  = Math.min(1, scores.nature  + inc);
  if (/minimaliste|zen/.test(lower))     scores.chill   = Math.min(1, scores.chill   + inc);
  if (/spirituel/.test(lower))           scores.culture = Math.min(1, scores.culture + inc);

  // Ensure no axis is zero — baseline 0.18
  for (const k of Object.keys(scores) as (keyof RadarScores)[]) {
    if (scores[k] === 0) scores[k] = 0.18;
  }

  return scores;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MoodRadar({ scores, size = 140, accent = "#4ecca3" }: MoodRadarProps) {
  const canvasRef = useRef<SVGSVGElement>(null);

  const PAD    = 22;                  // viewBox padding so labels never clip
  const cx     = size / 2;
  const cy     = size / 2;
  const maxR   = size * 0.40;        // slightly tighter so labels stay inside padded area
  const values = AXES.map((a) => scores[a.key]);

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Axis endpoint labels
  const labelR = maxR + 16;

  // Use a deferred animation on mount via useEffect to avoid SSR diff
  useEffect(() => {
    const svg = canvasRef.current;
    if (!svg) return;
    const poly = svg.querySelector<SVGPolygonElement>(".radar-shape");
    if (!poly) return;
    poly.style.animation = "none";
    void poly.getBoundingClientRect(); // reflow
    poly.style.animation = "";
  }, [scores]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={canvasRef}
        width={size}
        height={size}
        viewBox={`${-PAD} ${-PAD} ${size + PAD * 2} ${size + PAD * 2}`}
        aria-label="Mood resonance radar"
        role="img"
      >
        {/* ── Grid rings ── */}
        {rings.map((r) => {
          const pts = Array.from({ length: N }, (_, i) => {
            const angle = (360 / N) * i;
            const { x, y } = polarToXY(angle, r * maxR, cx, cy);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon
              key={r}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.75"
            />
          );
        })}

        {/* ── Axis spokes ── */}
        {AXES.map((axis, i) => {
          const angle = (360 / N) * i;
          const { x, y } = polarToXY(angle, maxR, cx, cy);
          return (
            <line
              key={axis.key}
              x1={cx} y1={cy}
              x2={x}  y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.75"
            />
          );
        })}

        {/* ── Data shape (filled) ── */}
        <polygon
          className="radar-shape"
          points={buildPolygon(values, maxR, cx, cy)}
          fill={`${accent}26`}
          stroke={accent}
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: "radar-draw 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        />

        {/* ── Axis dots ── */}
        {AXES.map((axis, i) => {
          const angle = (360 / N) * i;
          const v     = scores[axis.key];
          const { x, y } = polarToXY(angle, v * maxR, cx, cy);
          return (
            <circle
              key={axis.key}
              cx={x} cy={y} r="2.5"
              fill={accent}
              opacity="0.9"
            />
          );
        })}

        {/* ── Labels ── */}
        {AXES.map((axis, i) => {
          const angle = (360 / N) * i;
          const { x, y } = polarToXY(angle, labelR, cx, cy);
          // Nudge text anchor based on quadrant
          const textAnchor = Math.abs(x - cx) < 4 ? "middle" : x < cx ? "end" : "start";
          const dy         = y < cy - 2 ? -3 : y > cy + 2 ? 10 : 4;

          return (
            <g key={axis.key}>
              <text
                x={x} y={y + dy}
                textAnchor={textAnchor}
                fontSize="7.5"
                fontFamily="var(--font-display)"
                fontWeight="700"
                letterSpacing="0.06em"
                fill="rgba(255,255,255,0.32)"
                style={{ textTransform: "uppercase" }}
              >
                {axis.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Score legend ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-center">
        {AXES.map((axis) => {
          const v = Math.round(scores[axis.key] * 100);
          return (
            <span key={axis.key} className="text-[9px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-display)" }}>
              {axis.icon} {v}
            </span>
          );
        })}
      </div>
    </div>
  );
}
