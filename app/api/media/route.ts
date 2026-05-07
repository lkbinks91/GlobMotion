import { NextRequest, NextResponse } from "next/server";

// ── Minimal API shape types (server-only) ────────────────────────────────────
interface UnsplashPhoto {
  id: string;
  urls: { regular: string; thumb: string };
  user: { name: string; links?: { html: string } };
  alt_description?: string | null;
}

interface PexelsPhoto {
  id: number;
  src: { large: string; tiny: string };
  photographer: string;
  photographer_url: string;
  alt?: string | null;
}

interface PexelsVideoFile {
  quality: string;
  link: string;
}

interface PexelsVideo {
  id: number;
  image: string;
  video_files: PexelsVideoFile[];
  user?: { name: string; url: string };
}

// ── GET /api/media?city=Paris&country=France&count=7 ─────────────────────────
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const city    = params.get("city")?.trim()    ?? "";
  const country = params.get("country")?.trim() ?? "";
  const count   = Math.min(parseInt(params.get("count") ?? "7", 10), 15);

  if (!city) return NextResponse.json([], { status: 400 });

  const query      = country ? `${city} ${country} travel` : `${city} travel`;
  const heroQuery  = `${query} landscape`;

  const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
  const PEXELS_KEY   = process.env.PEXELS_API_KEY;

  // ── 1. Unsplash ──────────────────────────────────────────────────────────
  if (UNSPLASH_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(heroQuery)}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results ?? []).map((r: UnsplashPhoto) => ({
          id:        r.id,
          url:       r.urls.regular,
          thumbUrl:  r.urls.thumb,
          author:    r.user.name,
          authorUrl: r.user.links?.html ?? null,
          source:    "unsplash",
          alt:       r.alt_description ?? `${city} travel`,
          type:      "photo",
        }));
        if (results.length >= 3) return NextResponse.json(results);
      }
    } catch { /* fall through */ }
  }

  // ── 2. Pexels fallback (photos + up to 2 videos) ─────────────────────────
  if (PEXELS_KEY) {
    try {
      const [photoRes, videoRes] = await Promise.all([
        fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
          { headers: { Authorization: PEXELS_KEY } }
        ),
        fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=2`,
          { headers: { Authorization: PEXELS_KEY } }
        ),
      ]);

      const photos = photoRes.ok
        ? ((await photoRes.json()).photos ?? []).map((p: PexelsPhoto) => ({
            id:        `p${p.id}`,
            url:       p.src.large,
            thumbUrl:  p.src.tiny,
            author:    p.photographer,
            authorUrl: p.photographer_url ?? null,
            source:    "pexels",
            alt:       p.alt ?? `${city} travel`,
            type:      "photo",
          }))
        : [];

      const videos = videoRes.ok
        ? ((await videoRes.json()).videos ?? []).slice(0, 2).map((v: PexelsVideo) => {
            const file =
              v.video_files.find((f) => f.quality === "hd") ??
              v.video_files.find((f) => f.quality === "sd") ??
              v.video_files[0];
            return {
              id:        `v${v.id}`,
              url:       v.image,
              thumbUrl:  v.image,
              videoUrl:  file?.link ?? null,
              author:    v.user?.name ?? "Pexels",
              authorUrl: v.user?.url  ?? null,
              source:    "pexels",
              alt:       `${city} travel`,
              type:      "video",
            };
          })
        : [];

      return NextResponse.json([...photos, ...videos].slice(0, count + 2));
    } catch { /* nothing */ }
  }

  return NextResponse.json([]);
}
