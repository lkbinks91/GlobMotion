"use client";

import { useEffect, useRef } from "react";

// ── Static city → IATA lookup (no API needed for popular destinations) ────────

const CITY_IATA: Record<string, string> = {
  // France
  paris: "CDG", nice: "NCE", lyon: "LYS", marseille: "MRS", bordeaux: "BOD",
  toulouse: "TLS", nantes: "NTE", strasbourg: "SXB", montpellier: "MPL", biarritz: "BIQ",
  // Spain
  barcelona: "BCN", madrid: "MAD", ibiza: "IBZ", malaga: "AGP", seville: "SVQ",
  valencia: "VLC", palma: "PMI", "las palmas": "LPA", bilbao: "BIO", alicante: "ALC",
  // Italy
  rome: "FCO", milan: "MXP", venice: "VCE", florence: "FLR", naples: "NAP",
  catania: "CTA", palermo: "PMO", bologna: "BLQ", turin: "TRN", bari: "BRI",
  // Portugal
  lisbon: "LIS", porto: "OPO", faro: "FAO", funchal: "FNC", ponta: "PDL",
  // UK & Ireland
  london: "LHR", manchester: "MAN", edinburgh: "EDI", dublin: "DUB",
  birmingham: "BHX", glasgow: "GLA", bristol: "BRS", liverpool: "LPL",
  // Germany
  berlin: "BER", munich: "MUC", frankfurt: "FRA", hamburg: "HAM",
  dusseldorf: "DUS", cologne: "CGN", stuttgart: "STR", nuremberg: "NUE",
  // Netherlands & Belgium
  amsterdam: "AMS", brussels: "BRU", antwerp: "ANR",
  // Greece
  athens: "ATH", thessaloniki: "SKG", heraklion: "HER", rhodes: "RHO",
  santorini: "JTR", mykonos: "JMK", corfu: "CFU", zakynthos: "ZTH",
  // Switzerland & Austria
  zurich: "ZRH", geneva: "GVA", vienna: "VIE", salzburg: "SZG", innsbruck: "INN",
  // Scandinavia
  stockholm: "ARN", oslo: "OSL", copenhagen: "CPH", helsinki: "HEL",
  bergen: "BGO", gothenburg: "GOT",
  // Eastern Europe
  prague: "PRG", budapest: "BUD", warsaw: "WAW", krakow: "KRK",
  bucharest: "OTP", sofia: "SOF", zagreb: "ZAG", dubrovnik: "DBV", split: "SPU",
  // Americas - Canada
  montreal: "YUL", toronto: "YYZ", vancouver: "YVR", calgary: "YYC",
  ottawa: "YOW", quebec: "YQB", halifax: "YHZ",
  // Americas - USA
  "new york": "JFK", "los angeles": "LAX", miami: "MIA", chicago: "ORD",
  "san francisco": "SFO", boston: "BOS", seattle: "SEA", dallas: "DFW",
  houston: "IAH", atlanta: "ATL", denver: "DEN", "las vegas": "LAS",
  orlando: "MCO", washington: "IAD", phoenix: "PHX", portland: "PDX",
  // Americas - Latin
  cancun: "CUN", "mexico city": "MEX", "sao paulo": "GRU", "rio de janeiro": "GIG",
  lima: "LIM", bogota: "BOG", santiago: "SCL", "buenos aires": "EZE", havana: "HAV",
  // Middle East & Africa
  dubai: "DXB", "abu dhabi": "AUH", doha: "DOH", istanbul: "IST",
  cairo: "CAI", casablanca: "CMN", marrakech: "RAK", nairobi: "NBO",
  "tel aviv": "TLV", amman: "AMM", beirut: "BEY",
  // Asia
  tokyo: "NRT", osaka: "KIX", "hong kong": "HKG", singapore: "SIN",
  bangkok: "BKK", bali: "DPS", jakarta: "CGK", kuala: "KUL",
  beijing: "PEK", shanghai: "PVG", seoul: "ICN", taipei: "TPE",
  mumbai: "BOM", delhi: "DEL", colombo: "CMB", kathmandu: "KTM",
  // Pacific
  sydney: "SYD", melbourne: "MEL", auckland: "AKL", brisbane: "BNE",
  perth: "PER", christchurch: "CHC",
  // Indian Ocean
  "phuket": "HKT", "chiang mai": "CNX", "koh samui": "USM",
  maldives: "MLE", mauritius: "MRU", "reunion": "RUN",
};

function toIATA(city: string): string | undefined {
  return CITY_IATA[city.toLowerCase().trim()];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkyscannerWidgetProps {
  destinationName: string;
  destinationIata?: string;
  originName?: string;
  departureDate?: Date;
  returnDate?: Date;
  locale?: string;
  market?: string;
  currency?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SkyscannerWidget({
  destinationName,
  destinationIata,
  originName,
  departureDate,
  returnDate,
  locale = "fr-FR",
  market = "CA",
  currency = "CAD",
}: SkyscannerWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove any stale Skyscanner script to force a fresh render
    const existing = document.querySelector('script[src*="skyscanner"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src =
      "https://widgets.skyscanner.net/widget-server/js/loader.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [destinationName]);

  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div
      className="rounded-xl overflow-hidden mt-4"
      style={{
        border: "0.5px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Header row */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <span
          className="text-[11px] font-bold tracking-widest uppercase"
          style={{ opacity: 0.4 }}
        >
          Rechercher un vol
        </span>
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        <span className="text-[10px]" style={{ opacity: 0.25 }}>
          via Skyscanner
        </span>
      </div>

      {/* Widget div — SearchWidget is the free public type.
          It accepts plain city names, not IATA codes. */}
      <div
        ref={widgetRef}
        data-skyscanner-widget="SearchWidget"
        data-locale={locale}
        data-market={market}
        data-currency={currency}
        data-destination-name={destinationName}
        {...(originName ? { "data-origin-name": originName } : {})}
        {...(departureDate ? { "data-departure-date": isoDate(departureDate) } : {})}
        {...(returnDate    ? { "data-return-date":    isoDate(returnDate) }    : {})}
      />
    </div>
  );
}
