import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DESTINATION_SHAPE = `{
  "destination": { "city": "string", "country": "string", "coordinates": { "lat": number, "lng": number }, "time_zone": "string" },
  "vibe": ["string"],
  "local_context": { "time_of_day": "day|night|sunset|sunrise", "weather_vibe": "sunny|cloudy|rainy|snowy|humid|dry|clear" },
  "why_it_matches": "string",
  "activities": ["string"],
  "best_area_to_stay": "string",
  "popular_hotspots": ["string"],
  "traveler_vibe_quote": "string",
  "hidden_gem": { "name": "string", "description": "string" }
}`;

const SYSTEM_PROMPT = `Tu es un expert voyage GlobMotion.
Analyse l'émotion/désir de l'utilisateur et sélectionne la meilleure destination + 3 alternatives cohérentes.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte avant ou après.
Format JSON strict attendu:
{
  "main": ${DESTINATION_SHAPE},
  "alternatives": [
    { ...même shape que main..., "matchScore": number },
    { ...même shape que main..., "matchScore": number },
    { ...même shape que main..., "matchScore": number }
  ]
}
Les matchScore des alternatives sont entre 55 et 85, décroissants, cohérents avec le prompt.
Les alternatives doivent être des pays/villes DIFFÉRENTS du main et entre eux.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: unknown };

    const prompt =
      typeof body?.prompt === "string"
        ? body.prompt.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, 500)
        : "";

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt est requis." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Service indisponible" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Utilisateur: "${prompt}"` }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
