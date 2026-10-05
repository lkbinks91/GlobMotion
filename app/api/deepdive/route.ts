import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { cachedJson } from "@/app/lib/serverCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es un rédacteur voyage éditorial pour GlobMotion.
Ton style : authentique, insider, jamais touristique, jamais générique.
Réponds UNIQUEMENT avec du JSON valide. Aucun markdown, aucun texte avant ou après.`;

export async function POST(req: NextRequest) {
  let city: string, country: string, vibes: string[], activities: string[];
  try {
    const body = await req.json();
    const sanitize = (v: unknown, max: number) =>
      typeof v === "string" ? v.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, max) : "";
    const sanitizeArr = (v: unknown, maxItems: number, maxLen: number) =>
      Array.isArray(v)
        ? v.slice(0, maxItems).map((s) => sanitize(s, maxLen)).filter(Boolean)
        : [];

    city       = sanitize(body.city,    100);
    country    = sanitize(body.country, 100);
    vibes      = sanitizeArr(body.vibes,      10, 50);
    activities = sanitizeArr(body.activities, 20, 80);
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!city || !country) {
    return Response.json({ error: "city et country sont requis" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Service indisponible" }, { status: 500 });
  }

  const userPrompt = `Destination : ${city}, ${country}
Vibes : ${vibes.join(", ") || "non spécifiées"}
Activités : ${activities.join(", ") || "non spécifiées"}

Génère un deep-dive éditorial dans ce format JSON exact (ne dévie pas de la structure) :
{
  "vibe_check": [
    "paragraphe 1 — ambiance générale (3-4 phrases, ton éditorial, pas touristique)",
    "paragraphe 2 — contraste jour/nuit ou saison ou tension locale (3-4 phrases)",
    "paragraphe 3 — phrase-choc qui résume l'essence du lieu (2-3 phrases)"
  ],
  "when_to_go": [
    { "profile": "Solo",          "window": "saison ou mois",          "reason": "raison courte, 1 phrase" },
    { "profile": "En couple",     "window": "saison ou mois",          "reason": "..." },
    { "profile": "Entre amis",    "window": "saison ou mois",          "reason": "..." },
    { "profile": "En famille",    "window": "saison ou mois",          "reason": "..." }
  ],
  "local_secrets": [
    { "tip": "titre bref (4 mots max)", "detail": "explication insider, 1-2 phrases, ton initié" },
    { "tip": "...", "detail": "..." },
    { "tip": "...", "detail": "..." }
  ],
  "budget_reality": [
    { "tier": "budget",  "range": "XX–XX€/jour",  "details": "hébergement, repas et transport concrets" },
    { "tier": "mid",     "range": "XX–XX€/jour",  "details": "..." },
    { "tier": "luxury",  "range": "XX€+/jour",    "details": "..." }
  ],
  "vibes_map": [
    { "neighborhood": "nom du quartier", "mood": "party",   "description": "1 phrase percutante" },
    { "neighborhood": "...",             "mood": "chill",   "description": "..." },
    { "neighborhood": "...",             "mood": "culture", "description": "..." },
    { "neighborhood": "...",             "mood": "food",    "description": "..." }
  ]
}

Les valeurs de mood doivent être exactement parmi : party, chill, culture, food, design, nature.`;

  const key = `deepdive|${city}|${country}|${vibes.join(",")}|${activities.join(",")}`.toLowerCase();
  // Same city + same inputs => same deep dive, shared across users for 24 h
  return cachedJson(key, 24 * 3600_000, () => generate(userPrompt));
}

async function generate(userPrompt: string): Promise<Response> {
  try {
    const client  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse non-JSON de Claude");

    const data = JSON.parse(jsonMatch[0]);
    return Response.json(data);
  } catch (err) {
    console.error("[deepdive] error:", err);
    return Response.json({ error: "Erreur lors de la génération du deep-dive" }, { status: 500 });
  }
}
