"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface Props {
  location:      string;
  city:          string;
  country:       string;
  activityTitle: string;
  onClose:       () => void;
}

type MapStatus = "loading" | "ready" | "no-key" | "error";

export default function GoogleMap3DView({ location, city, country, activityTitle, onClose }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const apiKey  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  useEffect(() => {
    if (!apiKey) { setStatus("no-key"); return; }
    let cancelled = false;

    (async () => {
      try {
        setOptions({ key: apiKey, v: "weekly" });

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const { Map }              = await importLibrary("maps") as any;
        const { Geocoder }         = await importLibrary("geocoding") as any;
        const { ControlPosition }  = await importLibrary("core") as any;
        const { AdvancedMarkerElement } = await importLibrary("marker") as any;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (cancelled || !mapRef.current) return;

        const map = new Map(mapRef.current, {
          zoom:              17,
          center:            { lat: 0, lng: 0 },
          mapTypeId:         "hybrid",
          tilt:              45,
          heading:           15,
          mapId:             "DEMO_MAP_ID",
          streetViewControl: true,
          mapTypeControl:    false,
          fullscreenControl: false,
          zoomControl:       true,
          gestureHandling:   "greedy",
          streetViewControlOptions: { position: ControlPosition.RIGHT_BOTTOM },
          zoomControlOptions:       { position: ControlPosition.RIGHT_BOTTOM },
        });

        if (!cancelled) setStatus("ready");

        const geocoder = new Geocoder();
        geocoder.geocode(
          { address: `${location}, ${city}, ${country}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[], geoStatus: string) => {
            if (geoStatus === "OK" && results?.[0]?.geometry?.location) {
              const pos = results[0].geometry.location;
              map.setCenter(pos);
              new AdvancedMarkerElement({ position: pos, map, title: location });
            }
          }
        );
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, location, city, country]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-[#080a12]"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/8 bg-[rgba(8,10,18,0.97)] px-5 py-3.5">
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.35)]">
            🛰 Vue immersive satellite
          </p>
          <p className="truncate text-[15px] font-semibold leading-tight text-white">
            {activityTitle}
          </p>
          <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.45)]">
            📍 {location} · {city}, {country}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-[14px] text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Map container */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapRef} className="absolute inset-0" />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#080a12] pointer-events-none">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
            <p className="text-[12px] text-white/40">Chargement de la carte…</p>
          </div>
        )}

        {(status === "no-key" || status === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080a12] px-8 text-center">
            <span className="text-4xl">🗺️</span>
            <div>
              <p className="mb-1 text-[14px] font-semibold text-white/80">
                {status === "no-key" ? "Clé API non configurée" : "Erreur de chargement"}
              </p>
              <p className="text-[11px] leading-relaxed text-white/35">
                {status === "no-key"
                  ? "Ajoute NEXT_PUBLIC_GOOGLE_MAPS_KEY dans .env.local"
                  : "Vérifie que Maps JavaScript API est activée dans Google Cloud Console"}
              </p>
            </div>
            <button onClick={onClose} className="mt-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[12px] text-white/60 transition hover:bg-white/10 hover:text-white">
              Fermer
            </button>
          </div>
        )}
      </div>

      {status === "ready" && (
        <div className="border-t border-white/6 bg-[rgba(8,10,18,0.95)] px-4 py-2">
          <p className="text-center text-[10px] text-white/30">
            🟡 Glisser le bonhomme jaune sur une rue bleue pour activer Street View · Molette pour zoomer
          </p>
        </div>
      )}
    </motion.div>
  );
}
