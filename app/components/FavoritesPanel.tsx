"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFavorites, type FavoriteDestination } from "@/app/hooks/useFavorites";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state illustration
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      {/* Globe outline + bookmark illustration */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="28" stroke="rgba(78,204,163,0.18)" strokeWidth="1.5" />
        <ellipse cx="32" cy="32" rx="12" ry="28" stroke="rgba(78,204,163,0.12)" strokeWidth="1.5" />
        <line x1="4" y1="32" x2="60" y2="32" stroke="rgba(78,204,163,0.12)" strokeWidth="1.5" />
        {/* Bookmark */}
        <path
          d="M26 20h12a1 1 0 0 1 1 1v14l-7-5-7 5V21a1 1 0 0 1 1-1z"
          stroke="rgba(78,204,163,0.5)"
          strokeWidth="1.5"
          fill="rgba(78,204,163,0.07)"
        />
      </svg>
      <p className="m-0 text-[15px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
        Aucun favori pour l'instant
      </p>
      <p className="m-0 max-w-[220px] text-[12px] leading-relaxed text-[var(--text-muted)] [font-family:var(--font-body)]">
        Sauvegardez des destinations en cliquant sur l'icône marque-page.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact favorite card
// ─────────────────────────────────────────────────────────────────────────────

interface FavCardProps {
  fav: FavoriteDestination;
  onRemove: (id: string) => void;
  onReview: (fav: FavoriteDestination) => void;
}

function FavCard({ fav, onRemove, onReview }: FavCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-2 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-surface/70 px-[14px] py-3"
    >
      {/* Remove button */}
      <button
        onClick={() => onRemove(fav.id)}
        aria-label={`Retirer ${fav.city} des favoris`}
        className="absolute right-2 top-2 cursor-pointer rounded border-none bg-transparent p-1 text-base leading-none text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        ×
      </button>

      {/* City */}
      <p className="m-0 mb-0.5 pr-5 text-[14px] font-extrabold text-[var(--text-primary)] [font-family:var(--font-display)]">
        {fav.city}
      </p>

      {/* Country + score */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--text-secondary)] [font-family:var(--font-body)]">
          {fav.country}
        </span>
        {fav.matchScore > 0 && (
          <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] px-[7px] py-px text-[10px] font-bold text-[var(--accent)] [font-family:var(--font-body)]">
            {fav.matchScore}% match
          </span>
        )}
      </div>

      {/* Mood tags */}
      {fav.moodTags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {fav.moodTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] px-2 py-px text-[10px] font-semibold text-[var(--accent)] [font-family:var(--font-body)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: date + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] text-[var(--text-muted)] [font-family:var(--font-body)]">
          Sauvegardé le {formatDate(fav.savedAt)}
        </span>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onReview(fav)}
          className="cursor-pointer rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--accent)] transition-colors hover:brightness-110 [font-family:var(--font-body)]"
        >
          Revoir ce match
        </motion.button>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user clicks "Revoir ce match" — lets the parent re-open the destination */
  onReview?: (fav: FavoriteDestination) => void;
}

export default function FavoritesPanel({ isOpen, onClose, onReview }: FavoritesPanelProps) {
  const { favorites, removeFavorite, clearAll } = useFavorites();

  const handleReview = (fav: FavoriteDestination) => {
    onReview?.(fav);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="fav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur"
          />

          {/* Drawer */}
          <motion.aside
            key="fav-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mes destinations favorites"
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-[rgba(255,255,255,0.08)] bg-ink/96 shadow-[-12px_0_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:w-[340px]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 pb-4 pt-5">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-[var(--accent)]"
                  aria-hidden="true"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-[15px] font-extrabold text-[var(--text-primary)] [font-family:var(--font-display)]">
                  Mes favoris
                </span>
                {favorites.length > 0 && (
                  <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] px-[7px] py-px text-[10px] font-bold text-[var(--accent)] [font-family:var(--font-body)]">
                    {favorites.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="cursor-pointer rounded-md border border-[rgba(255,255,255,0.1)] bg-transparent px-[9px] py-1 text-[10px] text-[var(--text-secondary)] transition-colors hover:border-[rgba(255,255,255,0.22)] hover:text-[var(--text-primary)] [font-family:var(--font-body)]"
                  >
                    Tout effacer
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Fermer le panneau"
                  className="cursor-pointer rounded border-none bg-transparent px-1 py-0.5 text-xl leading-none text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-4">
              {favorites.length === 0 ? (
                <EmptyState />
              ) : (
                <AnimatePresence initial={false}>
                  {favorites.map((fav: FavoriteDestination) => (
                    <FavCard
                      key={fav.id}
                      fav={fav}
                      onRemove={removeFavorite}
                      onReview={handleReview}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
