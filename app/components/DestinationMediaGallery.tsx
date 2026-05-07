"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { fetchDestinationMedia, type MediaItem } from "@/app/lib/fetchDestinationMedia";

// ─────────────────────────────────────────────────────────────────────────────
// LazyImage — blur-up placeholder while full-res loads
// ─────────────────────────────────────────────────────────────────────────────

function LazyImage({
  src,
  thumb,
  alt,
}: {
  src: string;
  thumb: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: "relative", overflow: "hidden", display: "block" }}>
      {/* Blurred thumbnail — absolute, fills space set by the main img below */}
      <img
        src={thumb}
        aria-hidden
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(12px)",
          transform: "scale(1.08)",
          opacity: loaded ? 0 : 1,
          transition: "opacity 0.45s ease",
          pointerEvents: "none",
        }}
      />
      {/* Full-res — its natural size determines container height (no layout shift) */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          display: "block",
          width: "100%",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryItem — photo or video card with hover credit overlay
// ─────────────────────────────────────────────────────────────────────────────

function GalleryItem({
  item,
  isHero,
  onClick,
}: {
  item: MediaItem;
  isHero?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Voir ${item.alt}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: isHero ? "10px" : "7px",
        overflow: "hidden",
        cursor: "pointer",
        flexShrink: 0,
        ...(isHero
          ? { aspectRatio: "16/9", width: "100%" }
          : {}),
      }}
    >
      {isHero ? (
        /* Hero: fixed 16:9 crop */
        <>
          <img
            src={item.url}
            alt={item.alt}
            loading="eager"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Permanent bottom gradient for hero */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : (
        /* Grid items: natural aspect ratio → organic masonry heights */
        <LazyImage src={item.url} thumb={item.thumbUrl} alt={item.alt} />
      )}

      {/* Video play overlay */}
      {item.type === "video" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {/* Hover credit overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "5px 8px",
          background: "linear-gradient(to top, rgba(0,0,0,0.70), transparent)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.18s ease",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "9.5px",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          © {item.author} ·{" "}
          {item.source === "unsplash" ? "Unsplash" : "Pexels"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox — full-screen portal with keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: MediaItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const item    = items[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowRight" && hasNext) setIdx((i) => i + 1);
      if (e.key === "ArrowLeft"  && hasPrev) setIdx((i) => i - 1);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [hasPrev, hasNext, onClose]);

  const navBtn = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    [side]: side === "left" ? "-52px" : "-52px",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    cursor: (side === "left" ? hasPrev : hasNext) ? "pointer" : "default",
    background: (side === "left" ? hasPrev : hasNext)
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.04)",
    color: (side === "left" ? hasPrev : hasNext)
      ? "#ffffff"
      : "rgba(255,255,255,0.18)",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "background 0.15s",
    userSelect: "none" as const,
  });

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 7, 14, 0.94)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* Media container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", maxWidth: "88vw", maxHeight: "88vh" }}
      >
        {item.type === "video" && item.videoUrl ? (
          <video
            src={item.videoUrl}
            poster={item.thumbUrl}
            autoPlay
            controls
            style={{
              maxWidth: "88vw",
              maxHeight: "80vh",
              borderRadius: "10px",
              display: "block",
              outline: "none",
            }}
          />
        ) : (
          <img
            src={item.url}
            alt={item.alt}
            style={{
              maxWidth: "88vw",
              maxHeight: "80vh",
              borderRadius: "10px",
              display: "block",
              objectFit: "contain",
            }}
          />
        )}

        {/* Counter + credit */}
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {idx + 1} / {items.length}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            © {item.author} ·{" "}
            {item.authorUrl ? (
              <a
                href={item.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: "rgba(78,204,163,0.75)", textDecoration: "none" }}
              >
                {item.source === "unsplash" ? "Unsplash" : "Pexels"}
              </a>
            ) : item.source === "unsplash" ? (
              "Unsplash"
            ) : (
              "Pexels"
            )}
          </span>
        </div>

        {/* Prev */}
        <button
          style={{ ...navBtn("left"), left: "-52px", right: "auto" }}
          onClick={(e) => { e.stopPropagation(); if (hasPrev) setIdx((i) => i - 1); }}
          aria-label="Photo précédente"
          disabled={!hasPrev}
        >
          ‹
        </button>

        {/* Next */}
        <button
          style={{ ...navBtn("right"), right: "-52px", left: "auto" }}
          onClick={(e) => { e.stopPropagation(); if (hasNext) setIdx((i) => i + 1); }}
          aria-label="Photo suivante"
          disabled={!hasNext}
        >
          ›
        </button>
      </div>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Fermer la galerie"
        style={{
          position: "fixed",
          top: "18px",
          right: "18px",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#ffffff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </motion.div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MediaSkeleton — animated placeholder while fetching
// ─────────────────────────────────────────────────────────────────────────────

function MediaSkeleton() {
  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Hero */}
      <div
        className="animate-pulse"
        style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.05)",
        }}
      />
      {/* Grid */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[0, 1].map((col) => (
          <div
            key={col}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
          >
            {[120, 80, 140].map((h, row) => (
              <div
                key={row}
                className="animate-pulse"
                style={{
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.04)",
                  height: `${h}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DestinationMediaGallery — main export
// ─────────────────────────────────────────────────────────────────────────────

interface DestinationMediaGalleryProps {
  city?: string | null;
  country?: string | null;
}

export default function DestinationMediaGallery({
  city,
  country,
}: DestinationMediaGalleryProps) {
  const [items, setItems]             = useState<MediaItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  // Portal guard: createPortal needs the DOM
  const [mounted, setMounted]         = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!city) { setItems([]); return; }
    setLoading(true);
    setLightboxIdx(null);
    fetchDestinationMedia(city, 7, country)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [city, country]);

  const openLightbox  = useCallback((idx: number) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  // ── Loading ──
  if (loading) return <MediaSkeleton />;

  // ── Empty / no city ──
  if (!city || items.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: "#4a5268",
        }}
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            letterSpacing: "0.04em",
          }}
        >
          {city ? "Aucune photo disponible" : "Photos & vidéos"}
        </span>
      </div>
    );
  }

  // ── Gallery ──
  const hero = items[0];
  // Distribute remaining items across 2 masonry columns (round-robin)
  const masonry = items.slice(1).map((item, i) => ({ item, idx: i + 1 }));
  const col1 = masonry.filter((_, i) => i % 2 === 0);
  const col2 = masonry.filter((_, i) => i % 2 === 1);

  const hasUnsplash = items.some((i) => i.source === "unsplash");
  const hasPexels   = items.some((i) => i.source === "pexels");
  const attribution = hasUnsplash && hasPexels
    ? "Unsplash & Pexels"
    : hasUnsplash ? "Unsplash" : "Pexels";

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          scrollbarWidth: "none",
        }}
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <GalleryItem item={hero} isHero onClick={() => openLightbox(0)} />

        {/* ── 2-column masonry ─────────────────────────────────────────── */}
        {masonry.length > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Column 1 */}
            <div
              style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {col1.map(({ item, idx }) => (
                <GalleryItem
                  key={item.id}
                  item={item}
                  onClick={() => openLightbox(idx)}
                />
              ))}
            </div>
            {/* Column 2 */}
            <div
              style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {col2.map(({ item, idx }) => (
                <GalleryItem
                  key={item.id}
                  item={item}
                  onClick={() => openLightbox(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Attribution footer ───────────────────────────────────────── */}
        <div style={{ paddingTop: "2px", paddingBottom: "6px", textAlign: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              color: "#4a5268",
              letterSpacing: "0.03em",
            }}
          >
            Photos via {attribution}
          </span>
        </div>
      </div>

      {/* ── Lightbox portal ──────────────────────────────────────────────── */}
      {mounted && lightboxIdx !== null && (
        <Lightbox items={items} startIndex={lightboxIdx} onClose={closeLightbox} />
      )}
    </>
  );
}
