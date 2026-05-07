import { countries, type Country } from "@/data/countries";

export type MockDestination = {
  destination: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    time_zone: string;
  };
  vibe: string[];
  local_context: {
    time_of_day: "day" | "night" | "sunset" | "sunrise";
    weather_vibe: "sunny" | "cloudy" | "rainy" | "snowy" | "humid" | "dry" | "clear";
  };
  why_it_matches: string;
  activities: string[];
  best_area_to_stay: string;
  popular_hotspots: string[];
  traveler_vibe_quote: string;
  hidden_gem: {
    name: string;
    description: string;
  };
};

const vibesPool = [
  "calme",
  "spirituel",
  "nature",
  "urbain",
  "festif",
  "culturel",
  "aventure",
  "gastronomie",
  "détente",
  "sportif",
  "mystérieux",
  "luxueux",
  "minimaliste",
  "historique",
  "bohème",
  "futuriste",
  "sauvage",
  "romantique",
  "festif",
  "zen"
];

const activitiesPool = [
  "Balade en centre-ville",
  "Découverte des marchés locaux",
  "Randonnée panoramique",
  "Expérience culinaire",
  "Visite de sites culturels",
  "Coucher de soleil emblématique",
  "Excursion nature",
  "Soirée locale",
  "Spa et relaxation",
  "Activités nautiques",
];

const insiderActivitiesPool = [
  "Atelier cuisine chez l'habitant",
  "Bar secret recommandé par les locaux",
  "Balade guidée à l'aube",
  "Marché nocturne confidentiel",
  "Concert underground local",
  "Bain thermal traditionnel",
  "Café d'artistes discret",
];

const hotspotsPool = [
  "Café Central",
  "Plage Panorama",
  "Bar Lumière",
  "Marché du Vieux Port",
  "Rooftop Aurora",
  "Parc des Lanternes",
  "Galerie Nova",
  "Bistro Éclipse",
];

const hiddenGemsPool = [
  { name: "Jardin des Brumes", description: "Un jardin paisible méconnu, idéal au lever du soleil." },
  { name: "Atelier 7", description: "Un atelier artisanal discret où les locaux viennent créer." },
  { name: "Passage Bleu", description: "Une ruelle secrète avec cafés et librairies indépendantes." },
  { name: "Belvédère Orion", description: "Un point de vue peu connu avec une vue spectaculaire." },
  { name: "Maison du Thé", description: "Salon de thé intimiste apprécié des habitués." },
  { name: "Quai Silencieux", description: "Un quai calme parfait pour une balade en fin de journée." },
];

const weatherPool: MockDestination["local_context"]["weather_vibe"][] = [
  "sunny",
  "cloudy",
  "rainy",
  "snowy",
  "humid",
  "dry",
  "clear",
];

const timePool: MockDestination["local_context"]["time_of_day"][] = [
  "day",
  "night",
  "sunset",
  "sunrise",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFromPool<T>(pool: T[], seed: number, count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(seed + i * 7) % pool.length]);
  }
  return result;
}

function formatUtcOffset(lng: number): string {
  const offset = Math.round(lng / 15);
  if (offset === 0) return "UTC";
  const sign = offset > 0 ? "+" : "-";
  return `UTC${sign}${Math.abs(offset)}`;
}

export function buildMockDestination(country: Country): MockDestination {
  const seed = hashString(country.code);
  const insiderActivity = pickFromPool(insiderActivitiesPool, seed, 1)[0];
  const hiddenGem = hiddenGemsPool[seed % hiddenGemsPool.length];
  return {
    destination: {
      city: country.name,
      country: country.name,
      coordinates: {
        lat: country.lat,
        lng: country.lng,
      },
      time_zone: formatUtcOffset(country.lng),
    },
    vibe: pickFromPool(vibesPool, seed, 3),
    local_context: {
      time_of_day: timePool[seed % timePool.length],
      weather_vibe: weatherPool[seed % weatherPool.length],
    },
    why_it_matches: `${country.name} offre un mélange unique entre culture locale et découvertes authentiques, parfaitement aligné avec cette vibe.`,
    activities: [...pickFromPool(activitiesPool, seed, 3), insiderActivity],
    best_area_to_stay: `Centre-ville de ${country.name}`,
    popular_hotspots: pickFromPool(hotspotsPool, seed, 3),
    traveler_vibe_quote: "Ambiance vibrante et facile à vivre, on s'y sent bien dès le premier soir.",
    hidden_gem: hiddenGem,
  };
}

export const mockDestinations: MockDestination[] = countries.map(buildMockDestination);

export const mockDestination = mockDestinations[0];

export function getMockDestinationByCountryName(name: string): MockDestination | undefined {
  return mockDestinations.find((item) => item.destination.country === name);
}
