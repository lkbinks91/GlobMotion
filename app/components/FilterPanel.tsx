"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ──────────────────────────────────────────────────────────────────────

export interface FilterCategory {
  id: string;
  icon: string;
  label: string;
  color: string;
  activities: string[];
}

const CATEGORIES: FilterCategory[] = [
  {
    id: "plage",
    icon: "🌊",
    label: "Plage & Eau",
    color: "oklch(72% 0.14 220)",
    activities: ["Jetski", "Wakeboard", "Kitesurf", "Surf", "Snorkeling", "Plongée sous-marine", "Paddleboard", "Kayak de mer", "Flyboard", "Parasailing", "Banana boat", "Beach volleyball", "Pêche en haute mer", "Yacht party", "Boat party", "Catamaran sunset cruise", "Cliff jumping"],
  },
  {
    id: "nightlife",
    icon: "🎉",
    label: "Nightlife & Clubbing",
    color: "oklch(70% 0.14 300)",
    activities: ["Nightclub", "Beach club", "Rooftop bar", "Club électro", "Soirée techno", "Pool party", "Open bar", "Silent disco", "Jazz bar", "Speakeasy", "Bar à cocktails", "Karaoké privatisé", "Yacht party nocturne", "After-party", "DJ set sunset", "Club cabaret", "Burlesque show"],
  },
  {
    id: "concerts",
    icon: "🎵",
    label: "Concerts & Festivals",
    color: "oklch(63% 0.16 253)",
    activities: ["Concert en plein air", "Festival de musique", "Festival électro", "Opéra en plein air", "Concert classique", "Festival jazz", "Festival reggae", "Festival world music", "Showcase DJ", "Concert intimiste", "Rave légale", "Festival flamenco", "Fanfare de rue"],
  },
  {
    id: "sport",
    icon: "⚽",
    label: "Sport & Compétitions",
    color: "oklch(70% 0.18 30)",
    activities: ["Match de football", "Match de tennis", "Grand Prix F1", "Basketball NBA", "Match de rugby", "Match de baseball", "Match de hockey", "Golf", "Polo", "Match de cricket", "Tournoi de padel", "Match de boxe", "MMA/UFC", "Course hippique", "Waterpolo"],
  },
  {
    id: "aventure",
    icon: "🧗",
    label: "Aventure & Adrénaline",
    color: "oklch(65% 0.17 148)",
    activities: ["Parachutisme", "Saut à l'élastique", "Via ferrata", "Escalade outdoor", "Tyrolienne", "Rafting", "Canyoning", "Quad dans le désert", "Safari 4x4", "Parapente", "Deltaplane", "Tour en hélicoptère", "Tour en montgolfière", "Luge alpine", "Moto-neige"],
  },
  {
    id: "gastro",
    icon: "🍽️",
    label: "Gastronomie",
    color: "oklch(72% 0.14 52)",
    activities: ["Food tour local", "Cours de cuisine", "Dîner étoilé Michelin", "Dégustation de vins", "Street food tour", "Marché local", "Cave à vins privée", "Dégustation de fromages", "Brasserie artisanale", "Dégustation rhum/whisky", "Dîner sur l'eau", "Chef's table", "Marché nocturne"],
  },
  {
    id: "culture",
    icon: "🏛️",
    label: "Culture & Histoire",
    color: "oklch(67% 0.16 300)",
    activities: ["Visite musée", "Tour vieille ville", "Tour street art", "Château/Palais", "Galerie d'art contemporain", "Temple/Mosquée/Cathédrale", "Exposition temporaire", "Tour archéologique", "Cérémonie locale", "Marché artisanal", "Tour littéraire", "Festival culturel local"],
  },
  {
    id: "wellness",
    icon: "💆",
    label: "Wellness & Détente",
    color: "oklch(70% 0.11 180)",
    activities: ["Spa journée complète", "Hammam traditionnel", "Massage thaï", "Retraite yoga", "Méditation en nature", "Bain thermal", "Onsen japonais", "Bain de forêt (shinrin-yoku)", "Yoga au lever du soleil", "Flottaison tank", "Cryothérapie", "Thalassothérapie", "Sauna finlandais"],
  },
  {
    id: "nature",
    icon: "🌿",
    label: "Nature & Écotourisme",
    color: "oklch(65% 0.17 148)",
    activities: ["Randonnée panoramique", "Trek en montagne", "Safari animalier", "Observation baleines", "Balade à cheval", "Visite cascade", "Bivouac sous les étoiles", "Aurores boréales", "Visite parc national", "Birdwatching", "Tour mangrove", "Balade forêt tropicale", "Visite volcans"],
  },
  {
    id: "famille",
    icon: "👨‍👩‍👧",
    label: "Famille",
    color: "oklch(75% 0.15 60)",
    activities: ["Parc aquatique", "Parc d'attractions", "Zoo/Aquarium", "Accrobranche", "Karting", "Mini-golf", "Escape game", "Bowling", "Cinéma drive-in", "Ferme interactive", "Tour en bateau pirate", "Atelier poterie", "Cours de surf junior"],
  },
  {
    id: "couple",
    icon: "💑",
    label: "Couple / Romantique",
    color: "oklch(68% 0.17 10)",
    activities: ["Dîner aux chandelles sur la plage", "Coucher de soleil en voilier", "Pique-nique sur falaise", "Séance photo privée", "Weekend spa duo", "Balade en gondole", "Dîner étoilé", "Chambre avec vue privatisée", "Tour en calèche", "Yoga duo", "Vins en cave privée"],
  },
  {
    id: "amis",
    icon: "👯",
    label: "Entre amis",
    color: "oklch(70% 0.16 200)",
    activities: ["Escape game", "Karting", "Paintball", "Laser game", "Beach volley", "Bar hopping", "Quiz night", "Stand-up comedy", "Soirée poker", "Bowling", "Tournoi de padel", "Barbecue privatisé", "Après-ski", "Pub crawl organisé", "Soirée casino"],
  },
  {
    id: "creatif",
    icon: "🎨",
    label: "Créatif & Artistique",
    color: "oklch(67% 0.16 300)",
    activities: ["Cours de peinture en plein air", "Atelier sculpture", "Photographie urbaine", "Atelier street art", "Cours de poterie", "Atelier bijoux", "Danse salsa/tango/flamenco", "Atelier calligraphie", "Studio d'enregistrement", "Atelier parfumerie", "Dessin de mode"],
  },
  {
    id: "bucketlist",
    icon: "🌙",
    label: "Bucket list",
    color: "oklch(63% 0.14 163)",
    activities: ["Dîner dans le noir", "Dîner suspendu dans les airs", "Nuit en igloo", "Nuit en treehouse", "Dîner sous-marin", "Tour en sous-marin", "Nuit dans un château", "Glamping désert", "Dîner sur glacier", "Soirée masquée privée", "Nuit sur île privée"],
  },
];

// ── Helper: build prompt from selections ──────────────────────────────────────

function buildPromptFromSelections(
  selectedCategories: Set<string>,
  selectedActivities: Set<string>
): string {
  const lines: string[] = [];

  for (const cat of CATEGORIES) {
    const catSelected = selectedCategories.has(cat.id);
    const actSelected = cat.activities.filter((a) => selectedActivities.has(`${cat.id}::${a}`));
    if (!catSelected && actSelected.length === 0) continue;

    if (actSelected.length > 0) {
      lines.push(`${cat.label} (${actSelected.slice(0, 4).join(", ")})`);
    } else {
      lines.push(cat.label);
    }
  }

  if (lines.length === 0) return "";
  return `Je cherche une destination pour : ${lines.join(", ")}.`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMatch: (prompt: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FilterPanel({ isOpen, onClose, onMatch }: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  const totalSelected = selectedCategories.size + selectedActivities.size;

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleActivity(catId: string, act: string) {
    const key = `${catId}::${act}`;
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleMatch() {
    const builtPrompt = buildPromptFromSelections(selectedCategories, selectedActivities);
    if (!builtPrompt) return;
    onMatch(builtPrompt);
    onClose();
  }

  function handleReset() {
    setSelectedCategories(new Set());
    setSelectedActivities(new Set());
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="filter-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", justifyContent: "flex-end",
          }}
          onClick={onClose}
        >
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 95vw)",
              height: "100%",
              background: "oklch(8% 0.012 260)",
              borderLeft: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "0.5px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <div>
                <h2 style={{
                  margin: 0, fontSize: "18px", fontWeight: 700,
                  color: "#e8eaf0", fontFamily: "var(--font-display)",
                  letterSpacing: "-0.01em",
                }}>
                  Vos envies
                </h2>
                <p style={{
                  margin: "3px 0 0", fontSize: "11px",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-body)",
                }}>
                  Sélectionnez des catégories ou des activités spécifiques
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {totalSelected > 0 && (
                  <button
                    onClick={handleReset}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.35)", fontSize: "11px",
                      fontFamily: "var(--font-body)", padding: "4px 8px",
                    }}
                  >
                    Tout effacer
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", cursor: "pointer", color: "rgba(255,255,255,0.6)",
                    width: "32px", height: "32px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div
              className="no-scrollbar"
              style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {CATEGORIES.map((cat) => {
                const isCatSelected = selectedCategories.has(cat.id);
                return (
                  <div key={cat.id}>
                    {/* Category header — clickable to toggle whole category */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        background: "none", border: "none", cursor: "pointer",
                        padding: "0 0 10px", width: "100%", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "16px", lineHeight: 1 }}>{cat.icon}</span>
                      <span style={{
                        fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        color: isCatSelected ? cat.color : "rgba(255,255,255,0.55)",
                        transition: "color 0.15s",
                      }}>
                        {cat.label}
                      </span>
                      {isCatSelected && (
                        <span style={{
                          marginLeft: "auto",
                          background: cat.color,
                          color: "#000",
                          fontSize: "8px", fontWeight: 800,
                          padding: "2px 6px", borderRadius: "4px",
                          letterSpacing: "0.05em",
                        }}>
                          TOUT
                        </span>
                      )}
                    </button>

                    {/* Activity pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {cat.activities.map((act) => {
                        const key = `${cat.id}::${act}`;
                        const isActSelected = selectedActivities.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleActivity(cat.id, act)}
                            style={{
                              background: isActSelected ? `${cat.color}22` : "rgba(255,255,255,0.04)",
                              border: `0.5px solid ${isActSelected ? cat.color : "rgba(255,255,255,0.1)"}`,
                              borderRadius: "20px",
                              padding: "5px 11px",
                              fontSize: "11px",
                              fontFamily: "var(--font-body)",
                              color: isActSelected ? cat.color : "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                              transition: "all 0.12s",
                              lineHeight: 1.4,
                            }}
                          >
                            {act}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: "16px 24px 24px",
              borderTop: "0.5px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              {totalSelected > 0 && (
                <span style={{
                  fontSize: "11px", fontFamily: "var(--font-body)",
                  color: "rgba(255,255,255,0.35)",
                  flexShrink: 0,
                }}>
                  {totalSelected} sélection{totalSelected > 1 ? "s" : ""}
                </span>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleMatch}
                disabled={totalSelected === 0}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: totalSelected > 0
                    ? "linear-gradient(135deg, oklch(63% 0.14 163), oklch(65% 0.17 230))"
                    : "rgba(255,255,255,0.06)",
                  color: totalSelected > 0 ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: "13px", fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  cursor: totalSelected > 0 ? "pointer" : "not-allowed",
                  letterSpacing: "0.01em",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                ✦ Proposer un Match
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
