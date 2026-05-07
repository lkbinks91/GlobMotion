import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItineraryRequestBody {
  city:           string;
  country:        string;
  departureDate:  string; // ISO string
  returnDate:     string; // ISO string
  userPrompt:     string;
  vibes:          string[];
  travelerVibes:  string[];
  activities:     string[];
  hotspots:       string[];
  bestArea:       string;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert travel planner.
Generate a detailed day-by-day itinerary.
Always respond in the same language as the userPrompt field.
Respond ONLY with valid JSON, no markdown, no preamble, no trailing text.`;

function buildUserPrompt(
  city: string,
  country: string,
  depStr: string,
  retStr: string,
  numberOfDays: number,
  userPrompt: string,
  vibes: string[],
  travelerVibes: string[],
  hotspots: string[],
  bestArea: string,
): string {
  const vibeBlock = travelerVibes.length > 0
    ? `\nTRAVELER VIBE PROFILE: ${travelerVibes.join(", ")}
The traveler has explicitly chosen these activity categories. Apply the following rules:
- Morning slots: flexible, can include food or light activities related to the profile.
- Afternoon slots: MUST match at least one of the traveler's vibes.
- Evening slots: MUST strongly match the dominant vibe (e.g. if Nightlife is selected, every evening must feature a bar, club, rooftop, live music, or event).
- Do NOT suggest unrelated activity types (e.g. if the traveler didn't pick Culture, avoid museums unless they are directly tied to a chosen vibe).
- Make each day feel coherent with this traveler's personality, not generic.`
    : "";

  // Tighter descriptions for long trips to stay under the 8096-token output cap
  const compact = numberOfDays >= 7;
  const descNote = compact
    ? "description: MAX 12 words (ultra-short)"
    : "description: 1-2 short sentences";
  const tipNote = compact
    ? "tip: OMIT entirely to save space"
    : "tip: optional insider tip (omit if nothing insightful)";

  return `Destination: ${city}, ${country}
Dates: ${depStr} → ${retStr} (${numberOfDays} days total)
User's own words: "${userPrompt}"
Destination vibes: ${vibes.join(", ")}
Known hotspots: ${hotspots.join(", ")}
Best area to stay: ${bestArea}${vibeBlock}

Generate a day-by-day itinerary as JSON:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Arrivée & Premier soir",
      "emoji": "🌅",
      "morning": {
        "time": "10h00",
        "title": "Activité titre",
        "description": "${descNote}",
        "location": "Lieu précis",
        "category": "CULTURE|FOOD|NATURE|NIGHTLIFE|CHILL|SPORT|UNIQUE"
      },
      "afternoon": { "same structure as morning" },
      "evening": { "same structure as morning" },
      "highlight": "MAX 10 words"
    }
  ],
  "travelTips": ["Conseil 1", "Conseil 2"],
  "bestTimeToArrive": "string",
  "packingEssentials": ["item1", "item2"]
}

Rules:
- Generate exactly ${numberOfDays} days, numbered 1 to ${numberOfDays}
- Day 1 = arrival day: lighter morning, main activities afternoon/evening
- Last day = departure day: morning activity + light afternoon checkout, no evening block (set evening to a brief goodbye activity)
- Adapt schedule based on userPrompt keywords:
  * "sortir la nuit" / "nightlife" / "club" → rich evening blocks, mornings start at 11h+
  * "se détendre" / "relax" / "spa" / "plage" → slow mornings, chill activities
  * "culture" / "musée" / "histoire" → museums, guided tours, local markets
  * "aventure" / "sport" / "trekking" → outdoor, active, sport activities
  * "famille" / "enfants" → kid-friendly, early schedule, no nightlife
  * "romantique" / "lune de miel" / "amoureux" → sunset dinners, private experiences
  * "budget" / "backpacker" → free activities, street food, affordable options
- Use real place names from the hotspots list when applicable
- Each day must have a unique theme and fitting emoji
- category must be exactly one of: CULTURE, FOOD, NATURE, NIGHTLIFE, CHILL, SPORT, UNIQUE
- ${tipNote}
- CRITICAL: output must be complete valid JSON — never truncate${compact ? "\n- Descriptions MUST be ≤12 words each — brevity is mandatory" : ""}`;
}

// ── Input sanitisation ────────────────────────────────────────────────────────

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, maxLen);
}

function sanitizeArray(value: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((v) => (typeof v === "string" ? v.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, maxItemLen) : ""))
    .filter(Boolean);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as ItineraryRequestBody;

    const body: ItineraryRequestBody = {
      city:          sanitizeText(raw.city,          100),
      country:       sanitizeText(raw.country,       100),
      departureDate: sanitizeText(raw.departureDate,  30),
      returnDate:    sanitizeText(raw.returnDate,     30),
      userPrompt:    sanitizeText(raw.userPrompt,    400),
      bestArea:      sanitizeText(raw.bestArea,      100),
      vibes:         sanitizeArray(raw.vibes,         10, 50),
      travelerVibes: sanitizeArray(raw.travelerVibes, 10, 50),
      activities:    sanitizeArray(raw.activities,   20, 80),
      hotspots:      sanitizeArray(raw.hotspots,     20, 80),
    };

    if (!body.city || !body.departureDate || !body.returnDate) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants (city, departureDate, returnDate requis)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service indisponible" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const dep = new Date(body.departureDate);
    const ret = new Date(body.returnDate);
    const numberOfDays = Math.max(
      1,
      Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const fmtDate = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const userText = buildUserPrompt(
      body.city,
      body.country,
      fmtDate(dep),
      fmtDate(ret),
      numberOfDays,
      body.userPrompt    || "",
      body.vibes         ?? [],
      body.travelerVibes ?? [],
      body.hotspots      ?? [],
      body.bestArea      ?? "",
    );

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model:    "claude-haiku-4-5",
            max_tokens: 8096,
            system:   SYSTEM_PROMPT,
            messages: [{ role: "user", content: userText }],
          });

          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ t: chunk.delta.text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (apiErr: unknown) {
          const e = apiErr as { status?: number; message?: string };
          console.error("[/api/itinerary] Anthropic stream error:", { status: e?.status, message: e?.message });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: e?.message ?? "Erreur Anthropic" })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[/api/itinerary] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération de l'itinéraire" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
