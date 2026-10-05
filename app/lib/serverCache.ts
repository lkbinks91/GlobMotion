interface Entry {
  body: string;
  expires: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Response>>();
const MAX_ENTRIES = 500;

const JSON_HEADERS = { "Content-Type": "application/json" };


export async function cachedJson(
  key: string,
  ttlMs: number,
  produce: () => Promise<Response>,
): Promise<Response> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return new Response(hit.body, { headers: { ...JSON_HEADERS, "X-Cache": "HIT" } });
  }

  const pending = inflight.get(key);
  if (pending) return (await pending).clone();

  const promise = (async () => {
    const res = await produce();
    if (res.ok) {
      const body = await res.clone().text();
      if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
      store.set(key, { body, expires: Date.now() + ttlMs });
    }
    return res;
  })();

  inflight.set(key, promise);
  try {
    return (await promise).clone();
  } finally {
    inflight.delete(key);
  }
}
