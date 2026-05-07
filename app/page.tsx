"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlobeScene from "./components/Globe/GlobeScene";
import DestinationCard from "./components/DestinationCard";
import { extractOriginCity } from "@/app/lib/FlightSearchService";
import AlternativeDestinationsCarousel, {
  type AlternativeDestination,
} from "./components/AlternativeDestinationsCarousel";
import BookmarkButton from "./components/BookmarkButton";
import FavoritesPanel from "./components/FavoritesPanel";
import DestinationMediaGallery from "./components/DestinationMediaGallery";
import DateRangePicker, { type DateRange } from "./components/DateRangePicker";
import ActivitiesGrid from "./components/ActivitiesGrid";
import EventsPanel from "./components/EventsPanel";
import FilterPanel from "./components/FilterPanel";
import ItineraryPlanner from "./components/ItineraryPlanner";
import { useFavorites } from "@/app/hooks/useFavorites";
import { type MockDestination } from "@/data/mockDestinations";
import GlobMotionLogo from "./components/GlobMotionLogo";

const PROMPT_EXAMPLES = [
  "Propose moi une destination avec de belles plages où je peux faire du jetski",
  "Propose moi une destination parfaite pour un couple",
  "Je veux partir depuis Montréal vers un endroit chaud",
  "Je cherche une destination nature, calme, avec randonnées",
  "Je veux un week-end nightlife, rooftops et concerts",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isDeletingPlaceholder, setIsDeletingPlaceholder] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<MockDestination | null>(null);
  // displayedDestination drives the main card; swapped when an alternative is chosen
  const [displayedDestination, setDisplayedDestination] = useState<MockDestination | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFavPanelOpen, setIsFavPanelOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"gallery" | "activities" | "events" | "itinerary">("gallery");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const { addFavorite } = useFavorites();

  const toneClass = "";
  const weatherClass = "";

  useEffect(() => {
    const current = PROMPT_EXAMPLES[placeholderIdx] ?? "";
    let timeoutMs = isDeletingPlaceholder ? 28 : 44;

    if (!isDeletingPlaceholder && typedPlaceholder === current) {
      timeoutMs = 1350;
    }
    if (isDeletingPlaceholder && typedPlaceholder === "") {
      timeoutMs = 320;
    }

    const tid = window.setTimeout(() => {
      if (!isDeletingPlaceholder) {
        if (typedPlaceholder.length < current.length) {
          setTypedPlaceholder(current.slice(0, typedPlaceholder.length + 1));
        } else {
          setIsDeletingPlaceholder(true);
        }
      } else {
        if (typedPlaceholder.length > 0) {
          setTypedPlaceholder(current.slice(0, typedPlaceholder.length - 1));
        } else {
          setIsDeletingPlaceholder(false);
          setPlaceholderIdx((prev) => (prev + 1) % PROMPT_EXAMPLES.length);
        }
      }
    }, timeoutMs);

    return () => window.clearTimeout(tid);
  }, [typedPlaceholder, placeholderIdx, isDeletingPlaceholder]);

  const handleSearch = async () => {
    if (!prompt.trim()) {
      setError("Veuillez entrer votre prompt");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsPanelOpen(false);
    setSelectedDestination(null);
    setDisplayedDestination(null);
    setAlternatives([]);
    setRightTab("gallery");
    setDateRange({ from: null, to: null });

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.text();
        console.error("API error:", errorData);
        throw new Error("Erreur serveur");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let earlyZoomDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        // Dès que les coordonnées du MAIN apparaissent dans le stream → zoom globe immédiat
        // We look for the pattern AFTER "main" to avoid matching an alternative's coordinates first.
        if (!earlyZoomDone) {
          const mainIdx = accumulated.indexOf('"main"');
          const searchIn = mainIdx !== -1 ? accumulated.slice(mainIdx) : accumulated;
          const coordsMatch = searchIn.match(
            /"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([-\d.]+)\s*,\s*"lng"\s*:\s*([-\d.]+)/
          );
          if (coordsMatch) {
            earlyZoomDone = true;
            setSelectedDestination({
              destination: {
                city: "",
                country: "",
                coordinates: { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) },
                time_zone: "UTC",
              },
              vibe: [],
              local_context: { time_of_day: "day", weather_vibe: "sunny" },
              why_it_matches: "",
              activities: [],
              best_area_to_stay: "",
              popular_hotspots: [],
              traveler_vibe_quote: "",
              hidden_gem: { name: "", description: "" },
            });
          }
        }
      }

      // JSON complet → carte destination + alternatives
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Réponse invalide");
      const parsed = JSON.parse(jsonMatch[0]) as {
        main: MockDestination;
        alternatives: (MockDestination & { matchScore: number })[];
      };
      // Support both old format (flat MockDestination) and new format ({ main, alternatives })
      const mainDest: MockDestination = "main" in parsed ? parsed.main : (parsed as unknown as MockDestination);
      setSelectedDestination(mainDest);
      setDisplayedDestination(mainDest);
      setIsPanelOpen(true); // auto-open — no need to click the globe marker
      if ("alternatives" in parsed && Array.isArray(parsed.alternatives)) {
        setAlternatives(
          parsed.alternatives.map((a, i) => {
            const { matchScore, ...data } = a;
            return { id: `alt-${data.destination.city}-${i}`, data, matchScore };
          })
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Impossible de récupérer la recommandation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`relative h-screen w-screen bg-black text-white overflow-hidden ${toneClass} ${weatherClass}`}>
      {/* Globe — absolute background layer so h-full works regardless of overflow */}
      <div className="absolute inset-0 z-0">
        <GlobeScene
          selectedCountry={null}
          onCountrySelect={() => {}}
          selectedDestination={selectedDestination}
          onMarkerClick={() => setIsPanelOpen(true)}
        />
      </div>

      {/* Barre de progression globale pendant la recherche */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-20 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-cyan-300/25 bg-slate-950/85 px-4 py-3 backdrop-blur-xl sm:top-24"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold tracking-[0.04em] text-cyan-100">
                Recherche de votre destination...
              </span>
              <motion.span
                className="h-2 w-2 rounded-full bg-cyan-300"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="relative h-[10px] overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="absolute inset-y-0 w-[42%] rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 shadow-[0_0_16px_rgba(45,212,191,0.65)]"
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "260%"] }}
                transition={{ duration: 1.05, ease: "linear", repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo — marque en haut à gauche (pictogramme seul sur très petit écran pour éviter le chevauchement avec le titre) */}
      <div className="pointer-events-auto absolute left-4 top-4 z-20 sm:left-5 sm:top-5">
        <span className="sm:hidden">
          <GlobMotionLogo compact iconOnly />
        </span>
        <span className="hidden sm:inline-block">
          <GlobMotionLogo compact={false} />
        </span>
      </div>

      {/* Navbar — bookmark icon top-right */}
      <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFavPanelOpen(true)}
          aria-label="Ouvrir mes favoris"
          className="flex cursor-pointer items-center gap-[7px] rounded-[10px] border border-white/10 bg-surface/70 px-3 py-2 backdrop-blur-md"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(78,204,163,0.85)" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="hidden text-[12px] font-semibold text-[#c8d0e0] [font-family:var(--font-body)] sm:inline">
            Favoris
          </span>
        </motion.button>
      </div>

      {/* Slogan */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90vw] text-center sm:top-8 sm:w-auto">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl
                       bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-400
                       bg-clip-text text-transparent
                       drop-shadow-[0_0_30px_rgba(0,255,255,0.4)]
                       animate-pulse">
          Travel at the speed of your mood.
        </h1>
      </div>

      {/* Erreur recherche — visible même quand le panneau destination est ouvert */}
      {error ? (
        <div
          className="absolute left-1/2 top-[5.25rem] z-40 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-red-400/25 bg-red-950/85 px-4 py-2.5 text-center text-[13px] leading-snug text-red-100 shadow-lg backdrop-blur-md sm:top-28"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Barre de recherche — masquée quand le panneau destination est ouvert pour éviter tout chevauchement avec le calendrier / le contenu */}
      {!isPanelOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-5xl">
            <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            {/* Filter button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/18 bg-white/7 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white/70 cursor-pointer [font-family:var(--font-body)] sm:min-h-0 sm:w-auto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filtrer
            </button>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder={`${typedPlaceholder}${prompt ? "" : "▍"}`}
              className="min-h-[44px] min-w-0 w-full flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white placeholder-white/60 outline-none backdrop-blur sm:min-h-0 sm:text-base lg:text-[17px]"
            />
            <button
              type="button"
              className="min-h-[44px] w-full rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-3 text-[15px] font-semibold text-cyan-200 whitespace-nowrap transition hover:border-cyan-300/60 hover:bg-cyan-500/30 disabled:opacity-50 sm:min-h-0 sm:w-auto sm:text-base"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "Recherche en cours…" : "Trouver ma destination"}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onMatch={(builtPrompt) => {
          setPrompt(builtPrompt);
          // Trigger search after state settles
          setTimeout(() => {
            setIsLoading(true);
            setError(null);
            setIsPanelOpen(false);
            setSelectedDestination(null);
            setDisplayedDestination(null);
            setAlternatives([]);
            setRightTab("gallery");
            setDateRange({ from: null, to: null });
            fetch("/api/recommendation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: builtPrompt }),
            })
              .then(async (response) => {
                if (!response.ok || !response.body) throw new Error("Erreur serveur");
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = "";
                let earlyZoomDone = false;
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  accumulated += decoder.decode(value, { stream: true });
                  if (!earlyZoomDone) {
                    const mainIdx = accumulated.indexOf('"main"');
                    const searchIn = mainIdx !== -1 ? accumulated.slice(mainIdx) : accumulated;
                    const coordsMatch = searchIn.match(/"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([-\d.]+)\s*,\s*"lng"\s*:\s*([-\d.]+)/);
                    if (coordsMatch) {
                      earlyZoomDone = true;
                      setSelectedDestination({ destination: { city: "", country: "", coordinates: { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) }, time_zone: "UTC" }, vibe: [], local_context: { time_of_day: "day", weather_vibe: "sunny" }, why_it_matches: "", activities: [], best_area_to_stay: "", popular_hotspots: [], traveler_vibe_quote: "", hidden_gem: { name: "", description: "" } });
                    }
                  }
                }
                const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Réponse invalide");
                const parsed = JSON.parse(jsonMatch[0]) as { main: MockDestination; alternatives: (MockDestination & { matchScore: number })[] };
                const mainDest: MockDestination = "main" in parsed ? parsed.main : (parsed as unknown as MockDestination);
                setSelectedDestination(mainDest);
                setDisplayedDestination(mainDest);
                setIsPanelOpen(true);
                if ("alternatives" in parsed && Array.isArray(parsed.alternatives)) {
                  setAlternatives(parsed.alternatives.map((a, i) => { const { matchScore, ...data } = a; return { id: `alt-${data.destination.city}-${i}`, data, matchScore }; }));
                }
              })
              .catch(() => setError("Impossible de récupérer la recommandation."))
              .finally(() => setIsLoading(false));
          }, 0);
        }}
      />

      {/* Destination overlay panel */}
      <AnimatePresence>
        {isPanelOpen && selectedDestination && (
          <motion.div
            className="absolute inset-0 z-30 flex min-h-0 flex-col items-center overflow-y-auto overflow-x-hidden lg:flex-row lg:items-center lg:overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsPanelOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] pointer-events-none lg:bg-black/55" />

            {/* Card */}
            <div className="relative z-10 flex w-full flex-1 items-center justify-center px-3 pt-20 pb-3 pointer-events-none min-h-0 sm:px-4 sm:pt-24 sm:pb-4 lg:pt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto w-full max-w-[900px] max-h-[min(72svh,780px)] overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain lg:max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* AnimatePresence keyed on city so swap triggers fade+slide */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayedDestination?.destination.city ?? "empty"}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <DestinationCard
                      data={displayedDestination}
                      originCity={extractOriginCity(prompt) ?? undefined}
                      dateRange={dateRange}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Bookmark button for main destination */}
                {displayedDestination?.destination.city && (
                  <div className="mt-2 flex justify-end">
                    <BookmarkButton
                      destination={{
                        id: `main-${displayedDestination.destination.city}`,
                        city: displayedDestination.destination.city,
                        country: displayedDestination.destination.country,
                        moodTags: displayedDestination.vibe,
                        matchScore: 0,
                        prompt,
                        destinationData: displayedDestination,
                      }}
                      size="md"
                    />
                  </div>
                )}

                {/* Alternative destinations carousel */}
                <AlternativeDestinationsCarousel
                  destinations={alternatives}
                  onSelect={(alt) => setDisplayedDestination(alt.data)}
                  onFavorite={(alt) =>
                    addFavorite({
                      id: alt.id,
                      city: alt.data.destination.city,
                      country: alt.data.destination.country,
                      moodTags: alt.data.vibe,
                      matchScore: alt.matchScore,
                      prompt,
                      destinationData: alt.data,
                    })
                  }
                />
              </motion.div>
            </div>

            {/* Right panel — tab bar + gallery / contextual activities */}
            <motion.div
              className="relative z-10 w-full flex-shrink-0 flex flex-col justify-start min-h-0 p-3 pb-4 pointer-events-auto sm:p-4 lg:w-[34%] lg:h-full lg:justify-center lg:p-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tab bar — zones tactiles ≥ 44px */}
              <div
                className="mb-3 flex gap-1 rounded-[12px] border border-white/7 bg-white/4 p-1"
                role="tablist"
                aria-label="Contenu destination"
              >
                {(["gallery", "activities", "events", "itinerary"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={rightTab === tab}
                    onClick={() => setRightTab(tab)}
                    className={`flex min-h-[44px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[9px] border-none px-1 py-1.5 text-[11px] font-semibold leading-tight tracking-wide transition-all [font-family:var(--font-body)] sm:min-h-[48px] sm:flex-row sm:gap-1 sm:px-2 sm:text-[12px] ${
                      rightTab === tab
                        ? "bg-white/12 text-[#e8eaf0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "bg-transparent text-[#6a7388] active:bg-white/5 sm:hover:text-[#9aa4b8]"
                    }`}
                  >
                    {tab === "gallery" ? (
                      <>
                        <span aria-hidden className="text-[15px] leading-none sm:text-base">📷</span>
                        <span className="text-[9px] font-semibold sm:text-[12px]">Photos</span>
                      </>
                    ) : tab === "activities" ? (
                      <>
                        <span aria-hidden className="text-[15px] leading-none sm:text-base">🗓</span>
                        <span className="text-[9px] font-semibold sm:text-[12px]">Activités</span>
                      </>
                    ) : tab === "events" ? (
                      <>
                        <span aria-hidden className="text-[15px] leading-none sm:text-base">🎟</span>
                        <span className="text-[9px] font-semibold sm:text-[12px]">Événements</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden className="text-[15px] leading-none sm:text-base">📅</span>
                        <span className="text-[9px] font-semibold sm:text-[12px]">Itinéraire</span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* Content — min-h-0 nécessaire pour que overflow-y fonctionne dans la colonne flex */}
              <div className="flex h-[min(52svh,480px)] min-h-[280px] w-full flex-col overflow-hidden rounded-[12px] border border-white/7 bg-[rgba(12,15,22,0.72)] lg:h-[min(60vh,640px)] lg:max-h-[60vh]">
                {rightTab === "gallery" ? (
                  <DestinationMediaGallery
                    city={displayedDestination?.destination.city}
                    country={displayedDestination?.destination.country}
                  />
                ) : rightTab === "activities" ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain no-scrollbar">
                    <div className="relative z-0 shrink-0">
                      <DateRangePicker value={dateRange} onChange={setDateRange} />
                    </div>
                    <div className="min-h-0 flex-1 px-3 pb-4 pt-1 sm:px-3.5">
                      <ActivitiesGrid
                        city={displayedDestination?.destination.city}
                        country={displayedDestination?.destination.country}
                        dateRange={dateRange}
                        moods={displayedDestination?.vibe}
                      />
                    </div>
                  </div>
                ) : rightTab === "events" ? (
                  <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
                    <EventsPanel
                      city={displayedDestination?.destination.city}
                      country={displayedDestination?.destination.country}
                      dateRange={dateRange}
                      moods={displayedDestination?.vibe}
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
                    <ItineraryPlanner
                      city={displayedDestination?.destination.city ?? ""}
                      country={displayedDestination?.destination.country ?? ""}
                      departureDate={dateRange.from}
                      returnDate={dateRange.to}
                      userPrompt={prompt}
                      vibes={displayedDestination?.vibe ?? []}
                      activities={displayedDestination?.activities ?? []}
                      hotspots={displayedDestination?.popular_hotspots ?? []}
                      bestArea={displayedDestination?.best_area_to_stay ?? ""}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites panel */}
      <FavoritesPanel
        isOpen={isFavPanelOpen}
        onClose={() => setIsFavPanelOpen(false)}
        onReview={(fav) => {
          if (!fav.destinationData) return;
          setIsFavPanelOpen(false);
          setDisplayedDestination(fav.destinationData);
          setSelectedDestination(fav.destinationData);
          setIsPanelOpen(true);
        }}
      />
    </main>
  );
}
