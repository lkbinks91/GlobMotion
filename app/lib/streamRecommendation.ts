import { type MockDestination } from "@/data/mockDestinations";

export type RecommendationAlternative = MockDestination & { matchScore: number };

export interface RecommendationHandlers {
  onCoordinates?: (lat: number, lng: number) => void;
  onMain?: (main: MockDestination) => void;
  onAlternatives?: (alternatives: RecommendationAlternative[]) => void;
}

const COORDS_RE = /"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([-\d.]+)\s*,\s*"lng"\s*:\s*([-\d.]+)/;

/** Returns the parsed `main` object as soon as its closing brace has streamed in. */
function extractCompleteMain(text: string): MockDestination | null {
  const keyIdx = text.indexOf('"main"');
  if (keyIdx === -1) return null;
  const start = text.indexOf("{", keyIdx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1)) as MockDestination;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Streams /api/recommendation and fires callbacks progressively:
 * coordinates (globe zoom) -> main destination -> alternatives.
 */
export async function streamRecommendation(
  prompt: string,
  handlers: RecommendationHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!response.ok || !response.body) throw new Error("Erreur serveur");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let zoomed = false;
  let mainSent = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });

    if (!zoomed) {
      const mainIdx = accumulated.indexOf('"main"');
      if (mainIdx !== -1) {
        const m = accumulated.slice(mainIdx).match(COORDS_RE);
        if (m) {
          zoomed = true;
          handlers.onCoordinates?.(parseFloat(m[1]), parseFloat(m[2]));
        }
      }
    }

    if (!mainSent) {
      const main = extractCompleteMain(accumulated);
      if (main) {
        mainSent = true;
        handlers.onMain?.(main);
      }
    }
  }

  const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse invalide");
  const parsed = JSON.parse(jsonMatch[0]) as {
    main?: MockDestination;
    alternatives?: RecommendationAlternative[];
  };

  if (!mainSent) {
    const main = parsed.main ?? (parsed as unknown as MockDestination);
    handlers.onMain?.(main);
  }
  if (Array.isArray(parsed.alternatives)) handlers.onAlternatives?.(parsed.alternatives);
}
