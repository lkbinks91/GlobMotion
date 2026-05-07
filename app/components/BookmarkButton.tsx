"use client";

import { useState, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useFavorites, type FavoriteDestination } from "@/app/hooks/useFavorites";

export type BookmarkButtonSize = "sm" | "md" | "lg";

interface BookmarkButtonProps {
  destination: Omit<FavoriteDestination, "savedAt">;
  size?: BookmarkButtonSize;
  /** Override default absolute positioning — useful when embedding inline */
  className?: string;
}

const SIZE_MAP: Record<BookmarkButtonSize, number> = { sm: 14, md: 18, lg: 22 };
const PAD_MAP: Record<BookmarkButtonSize, string> = { sm: "4px", md: "6px", lg: "8px" };

export default function BookmarkButton({
  destination,
  size = "md",
  className,
}: BookmarkButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  const active = isFavorite(destination.id);
  const px = SIZE_MAP[size];

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: "fixed",
        top: rect.top - 34,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        background: "rgba(15,17,23,0.94)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        padding: "4px 9px",
        fontSize: "11px",
        fontFamily: "var(--font-body)",
        color: "#c8d0e0",
        pointerEvents: "none",
        zIndex: 9999,
      });
    }
    setShowTooltip(true);
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (active) {
      removeFavorite(destination.id);
    } else {
      addFavorite(destination);
    }
  };

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        ref={buttonRef}
        onClick={toggle}
        aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={active}
        aria-describedby={tooltipId}
        whileTap={{ scale: 0.88 }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: PAD_MAP[size],
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          transition: "background 0.18s ease",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
        }
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          overflow="visible"
        >
          {/* Background path — always visible */}
          <path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            stroke={active ? "#4ecca3" : "rgba(255,255,255,0.38)"}
            strokeWidth="2"
            fill="none"
            style={{ transition: "stroke 0.22s ease" }}
          />
          {/* Fill layer — animates in/out */}
          <motion.path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            fill="#4ecca3"
            initial={false}
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "50% 60%" }}
          />
        </svg>
      </motion.button>

      {/* Tooltip — rendered via portal so it escapes any overflow:hidden/auto parent */}
      {showTooltip && typeof window !== "undefined"
        ? createPortal(
            <div id={tooltipId} role="tooltip" style={tooltipStyle}>
              {active ? "Retirer des favoris" : "Ajouter aux favoris"}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
