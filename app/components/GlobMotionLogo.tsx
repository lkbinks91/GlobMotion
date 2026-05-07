"use client";

import { useId } from "react";
import { motion } from "framer-motion";

type GlobMotionLogoProps = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export default function GlobMotionLogo({
  className = "",
  compact = false,
  iconOnly = false,
}: GlobMotionLogoProps) {
  const rid = useId().replace(/:/g, "");
  const iconSize = compact ? 34 : 42;

  const globeRing = `gmGlobeRing-${rid}`;
  const motionTrail = `gmMotionTrail-${rid}`;
  const globeFill = `gmGlobeFill-${rid}`;
  const softGlow = `gmSoftGlow-${rid}`;

  const innerPad = iconOnly
    ? compact
      ? "p-2"
      : "p-2.5"
    : compact
      ? "px-3 py-2"
      : "px-4 py-2.5 sm:px-5 sm:py-3";

  return (
    <motion.div
      className={`select-none ${className}`}
      role={iconOnly ? "img" : undefined}
      aria-label={iconOnly ? "GlobMotion" : undefined}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <div
        className={[
          "rounded-full p-[1.5px] sm:p-0.5",
          "bg-gradient-to-br from-cyan-200/55 via-slate-300/35 to-teal-300/50",
          "shadow-[0_4px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]",
        ].join(" ")}
      >
        <div
          className={[
            "h-full w-full rounded-full p-[1px]",
            "bg-gradient-to-b from-white/25 via-transparent to-black/30",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center justify-center gap-2 rounded-full sm:gap-3",
              innerPad,
              "bg-gradient-to-b from-[#1a2332]/95 via-[#0f141c]/98 to-[#080b10]/99",
              "backdrop-blur-xl",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_20px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.04)]",
            ].join(" ")}
          >
            <div className="relative shrink-0" style={{ width: iconSize, height: iconSize }}>
              <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_14px_rgba(34,211,238,0.4)]"
                aria-hidden
              >
                <defs>
                  <linearGradient id={globeRing} x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" />
                    <stop offset="0.5" stopColor="#4ecca3" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id={motionTrail} x1="0" y1="24" x2="28" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" stopOpacity="0" />
                    <stop offset="0.35" stopColor="#67e8f9" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#4ecca3" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id={globeFill} x1="18" y1="12" x2="34" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0e7490" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#042f2e" stopOpacity="0.55" />
                  </linearGradient>
                  <filter id={softGlow} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M2 28 Q12 18 22 24 T42 20"
                  stroke={`url(#${motionTrail})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M4 32 Q14 26 24 30 T44 26"
                  stroke={`url(#${motionTrail})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />

                <ellipse
                  cx="26"
                  cy="24"
                  rx="18"
                  ry="8"
                  stroke={`url(#${globeRing})`}
                  strokeWidth="1.25"
                  strokeOpacity="0.55"
                  transform="rotate(-18 26 24)"
                />

                <circle
                  cx="28"
                  cy="24"
                  r="11.5"
                  stroke={`url(#${globeRing})`}
                  strokeWidth="1.5"
                  fill={`url(#${globeFill})`}
                />
                <ellipse
                  cx="28"
                  cy="24"
                  rx="11.5"
                  ry="4.2"
                  stroke={`url(#${globeRing})`}
                  strokeWidth="1"
                  opacity="0.75"
                />
                <path
                  d="M16.5 24 H39.5"
                  stroke={`url(#${globeRing})`}
                  strokeWidth="0.9"
                  opacity="0.65"
                />
                <path
                  d="M28 12.5 Q34 24 28 35.5 Q22 24 28 12.5"
                  stroke={`url(#${globeRing})`}
                  strokeWidth="0.85"
                  opacity="0.55"
                />

                <circle cx="41" cy="19" r="2.2" fill="#67e8f9" filter={`url(#${softGlow})`} />
                <circle cx="41" cy="19" r="1" fill="#ecfeff" />
              </svg>
            </div>

            {!iconOnly && (
              <div className="flex min-w-0 flex-col justify-center leading-none [font-family:var(--font-syne)]">
                <span
                  className={`font-extrabold tracking-[-0.03em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${
                    compact ? "text-[15px] sm:text-[17px]" : "text-[clamp(16px,4.2vw,21px)]"
                  }`}
                >
                  Glob
                  <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                    Motion
                  </span>
                </span>
                {!compact ? (
                  <span className="mt-1 hidden text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/45 sm:block">
                    voyage & humeur
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
