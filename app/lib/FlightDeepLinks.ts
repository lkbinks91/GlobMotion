// ── Static city → IATA lookup ─────────────────────────────────────────────────

export const CITY_IATA: Record<string, string> = {
  // Canada
  montreal: "YUL", toronto: "YYZ", vancouver: "YVR", calgary: "YYC",
  ottawa: "YOW", quebec: "YQB", halifax: "YHZ",
  // USA
  "new york": "JFK", "los angeles": "LAX", miami: "MIA", chicago: "ORD",
  "san francisco": "SFO", boston: "BOS", seattle: "SEA", dallas: "DFW",
  houston: "IAH", atlanta: "ATL", denver: "DEN", "las vegas": "LAS",
  orlando: "MCO", washington: "IAD", phoenix: "PHX", portland: "PDX",
  // Mexico & Caribbean & Latin America
  tulum: "CUN", cancun: "CUN", "mexico city": "MEX", havana: "HAV",
  bridgetown: "BGI", barbados: "BGI",
  "sao paulo": "GRU", "rio de janeiro": "GIG", lima: "LIM",
  bogota: "BOG", santiago: "SCL", "buenos aires": "EZE",
  // UK & Ireland
  london: "LHR", manchester: "MAN", edinburgh: "EDI", dublin: "DUB",
  birmingham: "BHX", bristol: "BRS", glasgow: "GLA",
  // France
  paris: "CDG", nice: "NCE", lyon: "LYS", marseille: "MRS", bordeaux: "BOD",
  toulouse: "TLS", nantes: "NTE", biarritz: "BIQ", strasbourg: "SXB",
  // Spain
  madrid: "MAD", barcelona: "BCN", ibiza: "IBZ", malaga: "AGP",
  seville: "SVQ", valencia: "VLC", palma: "PMI", bilbao: "BIO",
  "las palmas": "LPA", alicante: "ALC",
  // Italy
  rome: "FCO", milan: "MXP", venice: "VCE", florence: "FLR",
  naples: "NAP", catania: "CTA", palermo: "PMO", bologna: "BLQ",
  // Portugal
  lisbon: "LIS", porto: "OPO", faro: "FAO", funchal: "FNC",
  // Germany
  berlin: "BER", munich: "MUC", frankfurt: "FRA", hamburg: "HAM",
  dusseldorf: "DUS", cologne: "CGN", stuttgart: "STR",
  // Netherlands & Belgium
  amsterdam: "AMS", brussels: "BRU",
  // Scandinavia
  stockholm: "ARN", oslo: "OSL", copenhagen: "CPH", helsinki: "HEL",
  bergen: "BGO", gothenburg: "GOT",
  // Switzerland & Austria
  zurich: "ZRH", geneva: "GVA", vienna: "VIE", salzburg: "SZG",
  // Eastern Europe & Balkans
  prague: "PRG", budapest: "BUD", warsaw: "WAW", krakow: "KRK",
  bucharest: "OTP", sofia: "SOF", dubrovnik: "DBV", split: "SPU",
  zagreb: "ZAG",
  // Greece
  athens: "ATH", thessaloniki: "SKG", heraklion: "HER", rhodes: "RHO",
  santorini: "JTR", mykonos: "JMK", corfu: "CFU", zakynthos: "ZTH",
  // Middle East
  dubai: "DXB", "abu dhabi": "AUH", doha: "DOH", istanbul: "IST",
  "tel aviv": "TLV", amman: "AMM", beirut: "BEY",
  // Africa
  cairo: "CAI", marrakech: "RAK", casablanca: "CMN", nairobi: "NBO",
  // South & Southeast Asia
  bangkok: "BKK", bali: "DPS", jakarta: "CGK", singapore: "SIN",
  "kuala lumpur": "KUL", mumbai: "BOM", delhi: "DEL",
  phuket: "HKT", "chiang mai": "CNX", "koh samui": "USM", "koh phangan": "USM",
  colombo: "CMB", kathmandu: "KTM",
  // East Asia
  tokyo: "NRT", osaka: "KIX", "hong kong": "HKG",
  beijing: "PEK", shanghai: "PVG", seoul: "ICN", taipei: "TPE",
  // Pacific & Indian Ocean
  sydney: "SYD", melbourne: "MEL", auckland: "AKL", brisbane: "BNE",
  perth: "PER", christchurch: "CHC",
  maldives: "MLE", mauritius: "MRU",
};

export function resolveIata(cityName: string): string | null {
  return CITY_IATA[cityName.toLowerCase().trim()] ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlightSearchParams {
  originCity:      string;  // "Montreal"
  originIata:      string;  // "YUL"
  destinationCity: string;  // "Ibiza"
  destinationIata: string;  // "IBZ"
  departureDate:   Date;
  returnDate?:     Date;
  adults?:         number;  // default 1
  currency?:       string;  // default "CAD"
  locale?:         string;  // default "fr"
}

export interface FlightLink {
  platform:  string;
  url:       string;
  logo:      string;
  color:     string;
  preferred?: boolean;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** YYMMDD — e.g. 260615 for June 15 2026 */
export function toYYMMDD(d: Date): string {
  return d.toISOString().slice(2, 10).replace(/-/g, "");
}

/** Liens profonds vers le site Skyscanner — aucune clé API requise (contrairement à l’API Travel). */
export function buildSkyscannerTransportFlightsUrl(
  originIata: string,
  destinationIata: string,
  departureDate: Date,
  returnDate?: Date,
  baseHost = "https://www.skyscanner.ca",
): string {
  const orig = originIata.toLowerCase();
  const dest = destinationIata.toLowerCase();
  const dep = toYYMMDD(departureDate);
  const ret = returnDate ? `/${toYYMMDD(returnDate)}` : "";
  return `${baseHost}/transport/flights/${orig}/${dest}/${dep}${ret}/`;
}

/**
 * Recherche depuis tout un pays (code ISO 2 lettres, ex. ca) vers un aéroport :
 * utile quand l’utilisateur n’a pas encore indiqué une ville de départ précise.
 */
export function buildSkyscannerCountryToAirportUrl(
  countryOriginCode: string,
  destinationIata: string,
  departureDate: Date,
  returnDate?: Date,
  baseHost = "https://www.skyscanner.ca",
): string {
  const co = countryOriginCode.toLowerCase();
  const dest = destinationIata.toLowerCase();
  const dep = toYYMMDD(departureDate);
  const ret = returnDate ? `/${toYYMMDD(returnDate)}` : "";
  return `${baseHost}/transport/flights/${co}/${dest}/${dep}${ret}/`;
}

// ── Platform builders ─────────────────────────────────────────────────────────

function buildSkyscanner(params: FlightSearchParams): string {
  return buildSkyscannerTransportFlightsUrl(
    params.originIata,
    params.destinationIata,
    params.departureDate,
    params.returnDate,
  );
}

function buildGoogleFlights({
  originIata, destinationIata, departureDate, returnDate, locale = "fr",
}: FlightSearchParams): string {
  const dep = toISO(departureDate);
  let flt = `${originIata}.${destinationIata}.${dep}`;
  if (returnDate) flt += `*${destinationIata}.${originIata}.${toISO(returnDate)}`;
  return `https://www.google.com/flights?hl=${locale}#flt=${flt}`;
}

function buildKiwi({
  originIata, destinationIata, departureDate, returnDate, locale = "fr",
}: FlightSearchParams): string {
  const dep = toISO(departureDate);
  const ret = returnDate ? `/${toISO(returnDate)}` : "";
  return `https://www.kiwi.com/${locale}/search/results/${originIata}/${destinationIata}/${dep}${ret}`;
}

function buildKayak({
  originIata, destinationIata, departureDate, returnDate,
}: FlightSearchParams): string {
  const dep = toISO(departureDate);
  const ret = returnDate ? `/${toISO(returnDate)}` : "";
  return `https://www.kayak.com/flights/${originIata}-${destinationIata}/${dep}${ret}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateFlightLinks(params: FlightSearchParams): FlightLink[] {
  return [
    {
      platform:  "Skyscanner",
      url:       buildSkyscanner(params),
      logo:      "/icons/skyscanner.svg",
      color:     "#0770E3",
      preferred: true,
    },
    {
      platform: "Google Flights",
      url:      buildGoogleFlights(params),
      logo:     "/icons/google.svg",
      color:    "#4285F4",
    },
    {
      platform: "Kiwi",
      url:      buildKiwi(params),
      logo:     "/icons/kiwi.svg",
      color:    "#00B2A9",
    },
    {
      platform: "Kayak",
      url:      buildKayak(params),
      logo:     "/icons/kayak.svg",
      color:    "#FF690F",
    },
  ];
}
