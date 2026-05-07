"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  resolveIata,
  buildSkyscannerTransportFlightsUrl,
  buildSkyscannerCountryToAirportUrl,
} from "@/app/lib/FlightDeepLinks";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlightLinksPanelProps {
  destinationCity:    string;
  /** Pour construire l’URL Kiwi « partout → destination » (slug ville-pays) */
  destinationCountry?: string;
  originCity?:        string;
  departureDate?:     Date;
  returnDate?:        Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPRING = { type: "spring", stiffness: 320, damping: 28 } as const;

function fmtFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function buildGoogleFlightsUrl(
  origIata: string,
  destIata: string,
  dep: Date,
  ret?: Date,
): string {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  let flt = `${origIata}.${destIata}.${iso(dep)}`;
  if (ret) flt += `*${destIata}.${origIata}.${iso(ret)}`;
  return `https://www.google.com/flights?hl=fr#flt=${flt}`;
}

function buildKiwiUrl(
  origIata: string,
  destIata: string,
  dep: Date,
  ret?: Date,
): string {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const retPart = ret ? `/${iso(ret)}` : "";
  return `https://www.kiwi.com/fr/search/results/${origIata}/${destIata}/${iso(dep)}${retPart}`;
}

/** Recherche « depuis n’importe où » vers la destination (pas besoin de ville de départ). */
function buildKiwiAnywhereToDestinationUrl(
  destSegment: string,
  departureDate: Date | undefined,
  returnDate: Date | undefined,
): string {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dateSeg =
    departureDate ? iso(departureDate) : "anytime";
  const dest = destSegment.toLowerCase();
  let path = `https://www.kiwi.com/fr/search/map/anywhere/${dest}/${dateSeg}`;
  if (returnDate && departureDate) path += `/${iso(returnDate)}`;
  return path;
}

/** Google Flights avec uniquement la destination (l’utilisateur choisit le départ sur le site). */
function buildGoogleFlightsDestinationOnlyUrl(destinationCity: string): string {
  const q = `Vols vers ${destinationCity}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&hl=fr`;
}

function slugForKiwiDestination(city: string, country: string | undefined, destIata: string | null): string {
  if (destIata) return destIata.toLowerCase();
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const c = norm(city);
  const co = country ? norm(country) : "";
  return co ? `${c}-${co}` : c;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FlightLinksPanel({
  destinationCity,
  destinationCountry,
  originCity,
  departureDate,
  returnDate,
}: FlightLinksPanelProps) {
  const [localOrigin, setLocalOrigin] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [originInput, setOriginInput] = useState("");
  /** Si pas de ville enregistrée, le champ reste replié jusqu’à ce que l’utilisateur l’ouvre. */
  const [optionalOriginOpen, setOptionalOriginOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user-origin-city");
    if (stored) setLocalOrigin(stored);
  }, []);

  const effectiveOrigin = originCity?.trim() || localOrigin;

  function saveOrigin() {
    const v = originInput.trim();
    if (!v) return;
    localStorage.setItem("user-origin-city", v);
    setLocalOrigin(v);
    setShowInput(false);
    setOriginInput("");
  }

  const { googleUrl, kiwiUrl, skyscannerUrl, usingPreciseRoutes } = useMemo(() => {
    const destIata = resolveIata(destinationCity);
    const origIata = effectiveOrigin ? resolveIata(effectiveOrigin) : null;
    const depDefault = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dep = departureDate ?? depDefault;

    const kiwiDestSegment = slugForKiwiDestination(
      destinationCity,
      destinationCountry,
      destIata,
    );

    const hasFullRoute =
      Boolean(effectiveOrigin && origIata && destIata);

    const skyscannerFallback =
      "https://www.skyscanner.ca/transport/flights/";

    if (hasFullRoute) {
      return {
        googleUrl: buildGoogleFlightsUrl(origIata!, destIata!, dep, returnDate),
        kiwiUrl:   buildKiwiUrl(origIata!, destIata!, dep, returnDate),
        skyscannerUrl: buildSkyscannerTransportFlightsUrl(
          origIata!,
          destIata!,
          dep,
          returnDate,
        ),
        usingPreciseRoutes: true as const,
      };
    }

    return {
      googleUrl: buildGoogleFlightsDestinationOnlyUrl(destinationCity),
      kiwiUrl: buildKiwiAnywhereToDestinationUrl(
        kiwiDestSegment,
        departureDate,
        returnDate,
      ),
      skyscannerUrl: destIata
        ? buildSkyscannerCountryToAirportUrl("ca", destIata, dep, returnDate)
        : skyscannerFallback,
      usingPreciseRoutes: false as const,
    };
  }, [
    effectiveOrigin,
    destinationCity,
    destinationCountry,
    departureDate,
    returnDate,
  ]);

  const hasOrigin = Boolean(effectiveOrigin);
  const hasDates = Boolean(departureDate);
  const showOriginRow = showInput || (!hasOrigin && optionalOriginOpen);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border-subtle)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">✈</span>
          <span
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
          >
            Trouver un vol vers {destinationCity}
          </span>
        </div>
        {hasOrigin && !showInput && (
          <button
            onClick={() => { setOriginInput(effectiveOrigin); setShowInput(true); }}
            className="text-[11px] opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
            aria-label="Modifier la ville de départ"
          >
            ✏
          </button>
        )}
      </div>

      <p className="text-[13px] m-0 mb-3" style={{ color: "var(--text-muted)" }}>
        {usingPreciseRoutes
          ? hasDates
            ? `Départ ${effectiveOrigin} · ${fmtFR(departureDate!)}${returnDate ? ` → ${fmtFR(returnDate)}` : ""}`
            : `Départ ${effectiveOrigin} · dates flexibles`
          : hasOrigin
          ? "Orthographe non reconnue pour un lien direct — les boutons ouvrent la destination ; vous pourrez saisir le départ sur le site."
          : "Choisissez un comparateur : la destination est déjà renseignée (Skyscanner : départs depuis le Canada). Optionnel : indiquez votre ville pour un lien tout prêt."}
      </p>

      {!hasOrigin && !optionalOriginOpen && (
        <button
          type="button"
          onClick={() => setOptionalOriginOpen(true)}
          className="text-[12px] mb-3 w-full text-left underline-offset-2 hover:underline"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Indiquer ma ville de départ (optionnel)
        </button>
      )}

      {/* ── Origin input (affinage optionnel) ─────────────────────── */}
      {showOriginRow && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus={showOriginRow}
            value={originInput}
            onChange={(e) => setOriginInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveOrigin()}
            placeholder="Optionnel — ville de départ (ex. Montréal, Paris…)"
            className="flex-1 rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{
              background: "var(--bg-card)",
              border:     "0.5px solid var(--border-subtle)",
              color:      "var(--text-primary)",
            }}
          />
          <button
            onClick={saveOrigin}
            className="rounded-lg px-3 py-2 text-[13px] font-semibold flex-shrink-0"
            style={{ background: "#4ecca3", color: "#000", border: "none", cursor: "pointer" }}
          >
            OK
          </button>
        </div>
      )}

      {/* ── Flight buttons — liens profonds, pas d’API Skyscanner requise ───── */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
        {(([
          { url: skyscannerUrl, label: "Skyscanner",     color: "#0770E3", logo: "/icons/skyscanner.svg" },
          { url: googleUrl,     label: "Google Flights", color: "#4285F4", logo: "/icons/google.svg" },
          { url: kiwiUrl,       label: "Kiwi",           color: "#00B2A9", logo: "/icons/kiwi.svg"   },
        ]) as { url: string | null; label: string; color: string; logo: string }[]).map(({ url, label, color, logo }) =>
          url ? (
            <motion.a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              className="flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-[14px] font-semibold"
              style={{
                background:     "var(--bg-card)",
                border:         "0.5px solid var(--border-subtle)",
                borderLeft:     `2.5px solid ${color}`,
                color:          "var(--text-primary)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" width={16} height={16}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <span>{label}</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>→</span>
            </motion.a>
          ) : (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-[14px] font-semibold opacity-30 select-none"
              style={{
                background: "var(--bg-card)",
                border:     "0.5px solid var(--border-subtle)",
                borderLeft: `2.5px solid ${color}`,
                color:      "var(--text-primary)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" width={16} height={16}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <span>{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
