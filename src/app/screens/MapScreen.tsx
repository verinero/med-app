import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, LocateFixed, MapPin, Navigation, Trash2, X, ArrowUpDown, ArrowUp, ArrowDown, Lock, LockOpen } from "lucide-react";
import { HOME_COLOR, contrastTextColor, LOCATION_CATEGORY_PALETTE, DEFAULT_MAP_CENTER } from "../constants";
import type { Location, LocationCategory } from "../../db";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { BottomNav } from "../components/BottomNav";
import { DeleteModal } from "../components/DeleteModal";
import { DragSheet } from "../components/DragSheet";
import { eyebrow, textInputStyle, primaryBtn, sheetTitle } from "../styles";
import { formatAddress, reverseGeocode, fetchWithTimeout, type NominatimResult } from "../geocoding";

// Default marker PNGs 404 under Vite unless re-pointed at bundled assets —
// standard Leaflet+bundler fix. Colored divIcons (below) are used instead
// for actual pins, but Leaflet still references this default internally.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function categoryColor(name: string, categories: LocationCategory[]): string {
  const idx = categories.findIndex(cat => cat.name === name);
  if (idx === -1) return LOCATION_CATEGORY_PALETTE[0];
  return categories[idx].color || LOCATION_CATEGORY_PALETTE[idx % LOCATION_CATEGORY_PALETTE.length];
}

// `rank` (1-based position within the pin's category) renders inside the
// bubble — the outer div is rotated -45deg to form the teardrop shape, so
// the number needs a counter-rotation to read upright.
function pinIcon(color: string, rank?: number) {
  const size = rank != null ? 26 : 22;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">${rank != null ? `<span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:800;font-family:'Inter',sans-serif;">${rank}</span>` : ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 2],
  });
}

// A pin's rank among its own category's siblings, sorted the same way the
// List view is (explicit `order` if set, else stable fallback by id) — so
// the number in the map marker always matches its List view position.
function categoryRank(loc: Location, all: Location[]): number {
  const siblings = [...all.filter(l => l.category === loc.category)]
    .sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
  return siblings.findIndex(l => l.id === loc.id) + 1;
}

// "You are here" — a small blue dot with a soft halo, distinct from the
// teardrop pins used for saved locations so it reads as "device position"
// rather than another saveable spot.
const CURRENT_POSITION_ICON = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:#1976D2;opacity:0.18;"></div>
    <div style="width:14px;height:14px;border-radius:50%;background:#1976D2;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function TapHandler({ onTap }: { onTap: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onTap(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function appleMapsUrl(loc: Location) { return `https://maps.apple.com/?daddr=${loc.lat},${loc.lng}`; }
function googleMapsUrl(loc: Location) { return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`; }

interface SearchResult extends NominatimResult { distanceMi: number }

interface PendingPin { lat: number; lng: number; name: string }

// Typical "local/nearby" search radius for driving-distance errands — same
// ballpark most local-search products default to (a few miles up to ~10-15
// for a metro area) rather than an unbounded global search.
const SEARCH_RADIUS_MILES = 10;

// Haversine distance in miles — used to filter/sort search results by
// actual distance from the user, not just Nominatim's relevance ranking.
function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function MapScreen({
  locations, locationCategories, navTab, setNavTab,
  onHome, onStats, onSettings,
  onAddLocation, onSetLocationAddress, onMoveLocation, onToggleLocationCategoryOrderLock,
  deleteLocationTarget, onRequestDeleteLocation, onCancelDeleteLocation, onConfirmDeleteLocation,
}: {
  locations: Location[]; locationCategories: LocationCategory[];
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onStats: () => void; onSettings: () => void;
  onAddLocation: (loc: { name: string; category: string; lat: number; lng: number; address?: string; note?: string }) => void;
  onSetLocationAddress: (id: number, address: string) => void;
  onMoveLocation: (id: number, direction: "up" | "down") => void;
  onToggleLocationCategoryOrderLock: (id: number) => void;
  deleteLocationTarget: number | null;
  onRequestDeleteLocation: (id: number) => void;
  onCancelDeleteLocation: () => void;
  onConfirmDeleteLocation: () => void;
}) {
  const headerText = contrastTextColor(HOME_COLOR.p);
  const mapRef = useRef<LeafletMap | null>(null);
  const addressLookupsInFlight = useRef<Set<number>>(new Set());
  const addressRequestId = useRef(0);

  const [view, setView] = useState<"map" | "list">("map");
  const [mapCenter, setMapCenter] = useState<[number, number]>([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [addingPin, setAddingPin] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the device's live position for the "you are here" marker, and
  // center the map on it once (the first fix), on mount — falls back
  // silently to DEFAULT_MAP_CENTER (already the initial state) if
  // denied/unavailable. Uses watchPosition rather than a one-shot fetch so
  // the dot keeps up as the crew moves, not just where they were on open.
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const center: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPosition(center);
        if (!hasCenteredRef.current) {
          hasCenteredRef.current = true;
          setMapCenter(center);
          mapRef.current?.setView(center, 13);
        }
      },
      () => { /* denied/unavailable — keep the fallback center, no dot shown */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Backfill addresses for any pin that doesn't have one yet (e.g. the
  // reverse-geocode lookup failed at save time because the device was
  // offline) — so List view always shows an address instead of raw
  // coordinates once a connection is available.
  useEffect(() => {
    for (const loc of locations) {
      if (loc.address || loc.id == null || addressLookupsInFlight.current.has(loc.id)) continue;
      addressLookupsInFlight.current.add(loc.id);
      reverseGeocode(loc.lat, loc.lng).then(address => {
        if (address && loc.id != null) onSetLocationAddress(loc.id, address);
      });
    }
  }, [locations, onSetLocationAddress]);

  // Address is shown in the form itself (not just carried silently through
  // to save) — for search-picked pins it's already known; for tap/geolocation
  // pins it's looked up right as the form opens, with a "Looking up…"
  // placeholder while in flight. `addressRequestId` guards against a slow
  // lookup from a closed/reopened form overwriting a newer one.
  function openAddForm(lat: number, lng: number, name = "", address?: string) {
    setAddingPin(false);
    setPendingPin({ lat, lng, name });
    setDraftName(name);
    setDraftCategory(locationCategories[0]?.name ?? "");
    setDraftNote("");
    setSearchResults([]);
    const requestId = ++addressRequestId.current;
    if (address) {
      setDraftAddress(address);
      setAddressLoading(false);
    } else {
      setDraftAddress("");
      setAddressLoading(true);
      reverseGeocode(lat, lng).then(resolved => {
        if (addressRequestId.current !== requestId) return;
        setAddressLoading(false);
        if (resolved) setDraftAddress(resolved);
      });
    }
  }

  // Reordering is scoped to whichever single category is selected — leaving
  // it (switching category or back to "All") exits reorder mode.
  useEffect(() => {
    setReordering(false);
  }, [activeCategory]);

  function handleMapTap(lat: number, lng: number) {
    if (!addingPin) return;
    openAddForm(lat, lng);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) { setGeoError("Geolocation isn't supported on this device."); return; }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 15);
        openAddForm(latitude, longitude);
      },
      err => setGeoError(err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Couldn't get your location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 3) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      // Hard-bounded box (~25mi) around the user's actual position (live
      // GPS if available, else wherever the map is centered) — biases the
      // API's own results to the local area instead of letting global
      // matches win; the exact-distance filter/sort below then narrows
      // and orders that within SEARCH_RADIUS_MILES.
      const [lat, lng] = currentPosition ?? mapCenter;
      const delta = 0.35;
      const viewbox = `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=1`;
      try {
        const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}${viewbox}`);
        const data: NominatimResult[] = await res.json();
        const withDistance = data
          .map(r => ({ ...r, distanceMi: distanceMiles(lat, lng, parseFloat(r.lat), parseFloat(r.lon)) }))
          .filter(r => r.distanceMi <= SEARCH_RADIUS_MILES)
          .sort((a, b) => a.distanceMi - b.distanceMi)
          .slice(0, 8);
        setSearchResults(withDistance);
      } catch {
        setSearchResults([]);
      }
    }, 450);
  }

  function selectSearchResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    mapRef.current?.setView([lat, lng], 15);
    setSearchQuery("");
    setSearchResults([]);
    const address = r.address ? formatAddress(r.address, r.display_name) : r.display_name;
    openAddForm(lat, lng, r.name || r.display_name.split(",")[0], address);
  }

  function saveDraft() {
    if (!pendingPin || !draftName.trim() || !draftCategory) return;
    onAddLocation({ name: draftName.trim(), category: draftCategory, lat: pendingPin.lat, lng: pendingPin.lng, address: draftAddress.trim() || undefined, note: draftNote.trim() || undefined });
    setPendingPin(null);
  }

  const visibleLocations = (activeCategory === "All" ? locations : locations.filter(l => l.category === activeCategory))
    .slice()
    .sort((a, b) => a.category !== b.category ? a.category.localeCompare(b.category) : (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));

  const activeLocationCategory = locationCategories.find(cat => cat.name === activeCategory);
  const isOrderLocked = activeLocationCategory?.orderLocked ?? false;

  // Shared between the map overlay (absolutely positioned) and List view
  // (static, flex-wrapped) — same chips, same activeCategory state.
  function categoryChips() {
    return (
      <>
        <button onClick={() => setActiveCategory("All")} style={{
          padding: "5px 12px", borderRadius: 100, cursor: "pointer", fontSize: 11, fontWeight: 700,
          border: `1.5px solid ${activeCategory === "All" ? HOME_COLOR.p : "#E2E5EC"}`,
          background: activeCategory === "All" ? HOME_COLOR.l : "#fff",
          color: activeCategory === "All" ? HOME_COLOR.p : "#6b7280",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}>All</button>
        {locationCategories.map((cat, i) => {
          const color = cat.color || LOCATION_CATEGORY_PALETTE[i % LOCATION_CATEGORY_PALETTE.length];
          const active = activeCategory === cat.name;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.name)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 100, cursor: "pointer", fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${active ? color : "#E2E5EC"}`,
              background: active ? `${color}22` : "#fff",
              color: active ? color : "#6b7280",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {cat.name}
            </button>
          );
        })}
      </>
    );
  }

  return (
    <PhoneShell>
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={{ ...eyebrow, color: headerText, opacity: 0.65 }}>Weewoo Tracker</div>
        <h1 style={{ margin: 0, color: headerText, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Map</h1>
        <div style={{ color: headerText, opacity: 0.7, fontSize: 12, fontWeight: 500, marginTop: 5 }}>{locations.length} saved location{locations.length === 1 ? "" : "s"}</div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
          {(["map", "list"] as const).map(v => (
            <button key={v} onClick={() => { setView(v); if (v === "list") setAddingPin(false); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, textTransform: "capitalize", transition: "all 0.2s",
              background: view === v ? "#fff" : "transparent",
              color: view === v ? HOME_COLOR.p : "#6b7280",
              boxShadow: view === v ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
            }}>{v}</button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 104px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categoryChips()}
          </div>

          {activeLocationCategory && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => !isOrderLocked && setReordering(r => !r)} disabled={isOrderLocked} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100,
                border: `1.5px solid ${reordering ? HOME_COLOR.p : "#E2E5EC"}`,
                background: reordering ? HOME_COLOR.l : "#fff",
                color: isOrderLocked ? "#c4c8d0" : reordering ? HOME_COLOR.p : "#6b7280",
                fontSize: 12, fontWeight: 700, cursor: isOrderLocked ? "default" : "pointer", opacity: isOrderLocked ? 0.6 : 1,
              }}>
                <ArrowUpDown size={13} /> {reordering ? "Done Reordering" : "Reorder"}
              </button>
              <button onClick={() => { if (activeLocationCategory.id != null) onToggleLocationCategoryOrderLock(activeLocationCategory.id); setReordering(false); }} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100,
                border: `1.5px solid ${isOrderLocked ? "#D32F2F" : "#E2E5EC"}`,
                background: isOrderLocked ? "#FEF2F2" : "#fff",
                color: isOrderLocked ? "#D32F2F" : "#6b7280",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                {isOrderLocked ? <Lock size={13} /> : <LockOpen size={13} />} {isOrderLocked ? "Locked" : "Lock Order"}
              </button>
            </div>
          )}

          {visibleLocations.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "40px 20px" }}>
              {activeCategory === "All" ? "No saved locations yet." : "No locations in this category."}
            </div>
          ) : (
            visibleLocations.map((loc, i) => (
              <div key={loc.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2" }}>
                {reordering && (
                  <>
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 20, height: 20, borderRadius: "50%", background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p),
                      fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2,
                    }}>{i + 1}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => loc.id != null && onMoveLocation(loc.id, "up")} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", padding: 3, display: "flex", opacity: i === 0 ? 0.3 : 1 }}>
                        <ArrowUp size={14} color="#6b7280" />
                      </button>
                      <button onClick={() => loc.id != null && onMoveLocation(loc.id, "down")} disabled={i === visibleLocations.length - 1} style={{ background: "none", border: "none", cursor: i === visibleLocations.length - 1 ? "default" : "pointer", padding: 3, display: "flex", opacity: i === visibleLocations.length - 1 ? 0.3 : 1 }}>
                        <ArrowDown size={14} color="#6b7280" />
                      </button>
                    </div>
                  </>
                )}
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: categoryColor(loc.category, locationCategories), marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1117" }}>{loc.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{loc.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}</div>
                  {loc.note && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{loc.note}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <a href={appleMapsUrl(loc)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 100, border: "1.5px solid #E2E5EC", background: "#fff", fontSize: 11, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                      <Navigation size={11} /> Apple Maps
                    </a>
                    <a href={googleMapsUrl(loc)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 100, border: "1.5px solid #E2E5EC", background: "#fff", fontSize: 11, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                      <Navigation size={11} /> Google Maps
                    </a>
                    <button onClick={() => loc.id != null && onRequestDeleteLocation(loc.id)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                      <Trash2 size={14} color="#D1D5DB" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      <div style={{ flex: 1, position: "relative", zIndex: 0, padding: "12px 12px 100px", boxSizing: "border-box" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.15)" }}>
        {/* Search box — higher z-index than the category chips below it so
            the results dropdown (which overlaps the chips' position) draws
            on top instead of behind them. */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 600 }}>
          <div style={{ background: "#fff", border: "1.5px solid #E2E5EC", borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
            <Search size={15} color="#9ca3af" />
            <input type="text" placeholder="Search a place…" value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0d1117" }} />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={14} color="#9ca3af" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div style={{ marginTop: 6, background: "#fff", border: "1.5px solid #E2E5EC", borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => selectSearchResult(r)} style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderBottom: i < searchResults.length - 1 ? "1px solid #F2F3F7" : "none", textAlign: "left", fontSize: 13, color: "#374151", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name && <strong>{r.name}</strong>}
                    {r.name ? " · " : ""}
                    {r.address ? formatAddress(r.address, r.display_name) : r.display_name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", flexShrink: 0 }}>{r.distanceMi.toFixed(1)} mi</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter chips */}
        <div style={{ position: "absolute", top: 66, left: 12, right: 12, zIndex: 500, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categoryChips()}
        </div>

        {/* Status toast — centered low on the map, narrow enough to sit
            between the zoom control (bottom-left) and locate button
            (bottom-right) rather than covering either; dismissible via the
            small X. */}
        {(addingPin || geoError) && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            width: "max-content", maxWidth: "calc(100% - 140px)", zIndex: 700,
            background: geoError ? "#FEF2F2" : HOME_COLOR.l,
            border: `1px solid ${geoError ? "#FECACA" : `${HOME_COLOR.p}55`}`,
            borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: geoError ? "#D32F2F" : HOME_COLOR.p, textAlign: "center" }}>
              {geoError || "Tap the map to place a pin"}
            </span>
            <button onClick={() => { if (geoError) setGeoError(null); else setAddingPin(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
              <X size={14} color={geoError ? "#D32F2F" : HOME_COLOR.p} />
            </button>
          </div>
        )}

        {/* "Use my location" button */}
        <button onClick={useMyLocation} style={{
          position: "absolute", bottom: 16, right: 12, zIndex: 500,
          width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1.5px solid #E2E5EC",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LocateFixed size={19} color={HOME_COLOR.p} />
        </button>

        <MapContainer center={mapCenter} zoom={12} zoomControl={false} style={{ width: "100%", height: "100%" }} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <ZoomControl position="bottomleft" />
          <TapHandler onTap={handleMapTap} />
          {currentPosition && (
            <Marker position={currentPosition} icon={CURRENT_POSITION_ICON} zIndexOffset={1000} interactive={false} />
          )}
          {visibleLocations.map(loc => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={pinIcon(categoryColor(loc.category, locationCategories), categoryRank(loc, locations))}>
              <Popup>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                  <strong style={{ fontSize: 13 }}>{loc.name}</strong>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{loc.category}</span>
                  {loc.note && <span style={{ fontSize: 11, color: "#374151" }}>{loc.note}</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <a href={appleMapsUrl(loc)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                      <Navigation size={11} /> Apple
                    </a>
                    <a href={googleMapsUrl(loc)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                      <Navigation size={11} /> Google
                    </a>
                    <button onClick={() => loc.id != null && onRequestDeleteLocation(loc.id)} style={{
                      marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none",
                      border: "none", color: "#D32F2F", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
                    }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        </div>
      </div>
      )}

      <DragSheet show={pendingPin != null} onClose={() => setPendingPin(null)}>
        <h3 style={sheetTitle}>Add Location</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)}
            placeholder="Name" style={textInputStyle} />
          <input type="text" value={draftAddress} readOnly
            placeholder={addressLoading ? "Looking up address…" : "Address"}
            style={{ ...textInputStyle, background: "#EDEEF2", color: "#6b7280", cursor: "default" }} />
          {locationCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: "#D32F2F", margin: 0 }}>Add a category in Settings before saving a location.</p>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {locationCategories.map((cat, i) => {
                const color = cat.color || LOCATION_CATEGORY_PALETTE[i % LOCATION_CATEGORY_PALETTE.length];
                const active = draftCategory === cat.name;
                return (
                  <button key={cat.id} onClick={() => setDraftCategory(cat.name)} style={{
                    padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${active ? color : "#E2E5EC"}`,
                    background: active ? `${color}22` : "#F8F9FC",
                    color: active ? color : "#6b7280",
                  }}>{cat.name}</button>
                );
              })}
            </div>
          )}
          <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)}
            placeholder="Note (optional)" rows={2} style={{ ...textInputStyle, resize: "none" }} />
          <button onClick={saveDraft} disabled={!draftName.trim() || !draftCategory} style={{
            ...primaryBtn, background: HOME_COLOR.p, opacity: !draftName.trim() || !draftCategory ? 0.5 : 1,
            cursor: !draftName.trim() || !draftCategory ? "default" : "pointer",
          }}>Save Location</button>
        </div>
      </DragSheet>

      <DeleteModal
        show={deleteLocationTarget != null}
        title="Delete this location?"
        onCancel={onCancelDeleteLocation}
        onConfirm={onConfirmDeleteLocation}
      />

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false}
        onFAB={() => { setView("map"); setAddingPin(a => !a); }} fabIcon={MapPin} fabActive={addingPin}
        onMap={() => {}} onActivity={onHome} onStats={onStats} onSettings={onSettings} />
    </PhoneShell>
  );
}
