// Continent definitions with colors and country mappings
export interface Continent {
  name: string;
  color: string;
  glowColor: string;
  countries: string[]; // Country codes
}

export const continents: Continent[] = [
  {
    name: "Europe",
    color: "#00ff88",
    glowColor: "#00ff88",
    countries: ["AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GE", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MK", "MT", "MD", "MC", "ME", "NL", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "VA"]
  },
  {
    name: "Asie",
    color: "#ff6b6b",
    glowColor: "#ff6b6b",
    countries: ["AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "TL", "IN", "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA", "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TR", "TM", "AE", "UZ", "VN", "YE"]
  },
  {
    name: "Afrique",
    color: "#ffd93d",
    glowColor: "#ffd93d",
    countries: ["DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW"]
  },
  {
    name: "Amérique du Nord",
    color: "#6bcfff",
    glowColor: "#6bcfff",
    countries: ["CA", "US", "MX", "GT", "BZ", "HN", "SV", "NI", "CR", "PA", "CU", "JM", "HT", "DO", "BS", "BB", "DM", "GD", "KN", "LC", "VC", "TT"]
  },
  {
    name: "Amérique du Sud",
    color: "#c084fc",
    glowColor: "#c084fc",
    countries: ["AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"]
  },
  {
    name: "Océanie",
    color: "#ff9f43",
    glowColor: "#ff9f43",
    countries: ["AU", "FJ", "KI", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV", "VU"]
  }
];

// Get continent for a country code
export function getContinentForCountry(countryCode: string): Continent | undefined {
  return continents.find(continent => 
    continent.countries.includes(countryCode)
  );
}

// Get color for a country
export function getColorForCountry(countryCode: string): { color: string; glowColor: string } {
  const continent = getContinentForCountry(countryCode);
  return continent 
    ? { color: continent.color, glowColor: continent.glowColor }
    : { color: "#00aaff", glowColor: "#00aaff" }; // Default cyan
}
