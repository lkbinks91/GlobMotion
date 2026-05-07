import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Input sanitisation ────────────────────────────────────────────────────────

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  // Strip prompt-injection characters and control chars, then trim
  return value.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, maxLen);
}

function sanitizeArray(value: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((v) => sanitizeText(v, maxItemLen))
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    city?: unknown;
    country?: unknown;
    from?: unknown;
    to?: unknown;
    moods?: unknown;
  };

  const city    = sanitizeText(body.city,    100);
  const country = sanitizeText(body.country, 100);
  const from    = sanitizeText(body.from,     30);
  const to      = sanitizeText(body.to,       30);
  const moods   = sanitizeArray(body.moods, 10, 50);

  if (!city || !from || !to) {
    return NextResponse.json({ error: "city, from, to required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const moodsLine =
    moods?.length ? `\nUser interests/moods: ${moods.join(", ")}` : "";

  const userPrompt = `For ${city}, ${country ?? ""}, from ${fmt(fromDate)} to ${fmt(toDate)}, suggest 6 unmissable activities/experiences that are specifically available or at their peak during this period. Consider: weather, local festivals, seasonal events, harvest seasons, school holidays.${moodsLine}

Return ONLY valid JSON, no markdown, no text before or after:
{
  "activities": [
    {
      "name": "string",
      "why_now": "string (one short phrase: why these exact dates are perfect, e.g. 'Truffle season', 'Sunset at 9pm', 'Jazz Festival week')",
      "category": "NATURE|CULTURE|NIGHTLIFE|FOOD|SPORT|FESTIVAL",
      "best_time_of_day": "string",
      "insider_tip": "string"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned   = text.replace(/```(?:json)?\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response from model");

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse model response");
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Activities API error:", err);
    return NextResponse.json(
      { error: "Failed to generate activities" },
      { status: 500 }
    );
  }
}
