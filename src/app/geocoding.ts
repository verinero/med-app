// Shared Nominatim (OpenStreetMap) geocoding helpers — used by MapScreen
// (reverse geocode on pin add, forward search-with-distance) and App.tsx
// (forward geocode to auto-wire a Hospital name to a map pin). No API key;
// see MapScreen.tsx for the usage-policy notes (rate limiting, no custom
// User-Agent from a browser fetch).

export interface NominatimAddress {
  house_number?: string; road?: string;
  city?: string; town?: string; village?: string; hamlet?: string;
  state?: string; postcode?: string;
  "ISO3166-2-lvl4"?: string;
}

export interface NominatimResult { display_name: string; lat: string; lon: string; name?: string; address?: NominatimAddress }

// Without a request timeout, a fetch on a dead/offline connection can hang
// far longer than a user would ever wait (observed directly: sequential
// lookups for a full hospital list with no network took far longer than a
// bounded failure would). Every geocoding call below aborts after this many
// ms and is treated as a failed lookup, same as any other network error.
const GEOCODE_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Nominatim's `display_name` is a full administrative chain (neighborhood,
// county, state, country) — verbose compared to how Google/Apple Maps show
// an address. Build a short "123 Main St, City, ST 12345" line from the
// structured `address` fields instead, falling back to display_name only
// if the structured breakdown isn't available.
export function formatAddress(addr: NominatimAddress, fallback: string): string {
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const city = addr.city || addr.town || addr.village || addr.hamlet || "";
  const stateCode = addr["ISO3166-2-lvl4"]?.split("-")[1] || addr.state || "";
  const cityState = [city, [stateCode, addr.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const parts = [street, cityState].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : fallback;
}

// Best-effort reverse geocode for a name/address label — a failed/offline
// lookup still lets the pin save, just without an address (List view falls
// back to raw coordinates for that row).
export async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
    const data: { display_name?: string; address?: NominatimAddress } = await res.json();
    if (!data.display_name) return undefined;
    return data.address ? formatAddress(data.address, data.display_name) : data.display_name;
  } catch {
    return undefined;
  }
}

// Forward geocode a free-text query (e.g. a hospital name, or a manually
// typed address) to its single best-match coordinates + concise address.
// `bounded=1` (hard-bounded, not just biased) is deliberate: a query for a
// bare name like "Southern Regional" with no strong local match can
// otherwise resolve to a same-named place on the other side of the world
// (confirmed against the real API — an unbounded search for "Southern
// Regional hospital" near Atlanta returned one in Belize) — silently
// placing a pin in the wrong country is worse than finding nothing and
// prompting the user for an explicit address instead.
export async function forwardGeocode(query: string, biasCenter: [number, number]): Promise<{ lat: number; lng: number; address: string; name?: string; stateCode?: string } | undefined> {
  const [lat, lng] = biasCenter;
  const delta = 0.75;
  const viewbox = `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=1`;
  try {
    const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}${viewbox}`);
    const data: NominatimResult[] = await res.json();
    const top = data[0];
    if (!top) return undefined;
    const resultLat = parseFloat(top.lat);
    const resultLng = parseFloat(top.lon);
    if (isNaN(resultLat) || isNaN(resultLng)) return undefined;
    const address = top.address ? formatAddress(top.address, top.display_name) : top.display_name;
    const stateCode = top.address?.["ISO3166-2-lvl4"]?.split("-")[1];
    return { lat: resultLat, lng: resultLng, address, name: top.name, stateCode };
  } catch {
    return undefined;
  }
}
