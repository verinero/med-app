// ── Types ────────────────────────────────────────────────────
export type Screen = "home" | "newCall" | "map" | "export" | "stats" | "settings";
export type Mode   = "trauma" | "medical";
export type UType  = "B" | "IM" | "AM";
export type LR     = "L" | "R";
// 5-level vital: "1"=low … "5"=high, ""=not assessed
export type VitalLevel = "1" | "2" | "3" | "4" | "5" | "";

// ── Theme ────────────────────────────────────────────────────
// HOME_COLOR/TH are plain mutable objects (not `as const`, no Context) —
// dozens of files import them directly as module-level singletons rather
// than receiving them as props. Settings → Customize Colors mutates their
// properties in place (see setThemeColor() in App.tsx) rather than
// threading a theme context through the whole component tree; any
// component re-rendered after that mutation picks up the new values
// automatically since it's the same object reference.
export const HOME_COLOR = { p: "#7B1FA2", l: "#F3E5F5", fab: "0 8px 28px rgba(123,31,162,0.42)" };
export const TH = {
  trauma:  { p: "#D32F2F", l: "#FFEBEE", fab: "0 8px 28px rgba(211,47,47,0.42)" },
  medical: { p: "#1976D2", l: "#E3F2FD", fab: "0 8px 28px rgba(25,118,210,0.42)" },
};

export type ThemeColors = typeof TH[Mode];

// Default accent hexes, used both as the initial HOME_COLOR/TH values above
// and as the "Reset to Defaults" target in Settings → Customize Colors.
export const DEFAULT_THEME = { home: "#7B1FA2", trauma: "#D32F2F", medical: "#1976D2" };

export const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Curated swatches offered in the color picker — same 5 options for all
// three theme slots, plus a color-wheel slot for anything else.
export const COLOR_PRESETS = ["#7B1FA2", "#D32F2F", "#1976D2", "#2E7D32", "#F57C00"];

// HSV -> hex, used by the color wheel (hue = angle, saturation = radius,
// value fixed at 1 so the wheel's rim is fully vivid, center is white).
export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Inverse of hsvToHex — used to position the color wheel's marker from the
// currently selected hex, so the wheel reflects the live theme value rather
// than tracking its own separate selection state.
// YIQ perceived-brightness formula -> whichever of black/white reads better
// on top of `hex`. Tried the stricter WCAG relative-luminance formula first
// (threshold 0.179), but the color wheel always picks fully-saturated colors
// (value fixed at 1), and WCAG's channel weighting rates most vivid hues
// (red/orange/yellow/green/cyan/magenta) as "bright enough" for black text —
// only a narrow blue/violet slice ever came out white. YIQ with the common
// threshold of 186 (out of 255) matches the intuitive split much better:
// only near-yellow reads as light enough for black, everything else gets
// white — see the "get-contrast" recipe widely circulated for this exact
// black-vs-white-text problem.
export function contrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 186 ? "#000000" : "#ffffff";
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255, g = g255 / 255, b = b255 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// Derives the light-tint background and drop-shadow variants from a single
// picked accent color, matching the ~90%-white tint and 0.42-alpha shadow
// already used by the built-in HOME_COLOR/TH palettes above.
export function deriveThemeColors(hex: string): ThemeColors {
  const { r, g, b } = hexToRgb(hex);
  const tint = (channel: number) => Math.round(255 + (channel - 255) * 0.1);
  const l = `#${[r, g, b].map(c => tint(c).toString(16).padStart(2, "0")).join("")}`;
  const fab = `0 8px 28px rgba(${r},${g},${b},0.42)`;
  return { p: hex, l, fab };
}

// 5-level colors: 1=blue, 2=sky, 3=green, 4=orange, 5=red
export const SEG_COLORS = ["#3B82F6", "#60A5FA", "#16A34A", "#FB923C", "#DC2626"];

// ── Static data ───────────────────────────────────────────────
export const GAUGES = [
  { g: "14G", bg: "#E65100", tx: "#fff" },
  { g: "16G", bg: "#616161", tx: "#fff" },
  { g: "18G", bg: "#2E7D32", tx: "#fff" },
  { g: "20G", bg: "#C2185B", tx: "#fff" },
  { g: "22G", bg: "#1565C0", tx: "#fff" },
  { g: "24G", bg: "#F9A825", tx: "#111" },
];
export const SITES    = ["AC", "Hand", "Wrist", "Forearm", "EJ", "Other"];
export const HOSPITALS = [
  "Emory Decatur", "Emory University", "Emory Midtown", "Emory Hillandale",
  "Grady", "Northside Atlanta", "Northside Gwinnett",
  "St. Joe's", "Piedmont Eastside", "Piedmont Eastside South Campus", "Piedmont Rockdale",
  "CHOA Arthur M. Blank", "CHOA Scottish Rite", "CHOA Hughes Spalding",
  "Southern Regional",
];
// One-time seed for the chiefComplaints table — the live per-mode list lives
// in Dexie and is user-editable from Settings after that (same pattern as
// HOSPITALS/DEFAULT_MEDS/DEFAULT_INTERVENTIONS below).
export const T_CHIPS  = ["MVA", "Fall", "Assault", "GSW", "Burns", "Crush"];
export const M_CHIPS  = ["Chest Pain", "Dyspnea", "AMS", "Seizure", "Syncope", "Stroke"];
export const OXY_T    = ["Nasal Cannula", "NRB", "BVM", "CPAP"];
export const FLUID    = [0, 250, 500, 1000];
export const SEX_OPTS = ["M", "F", "Other"];
export const AO_ITEMS = ["Person", "Place", "Time", "Event"] as const;
export const ROUTES = ["IV", "IM", "SL", "IN", "PO", "IO"];
// One-time seed for the medications table — the live list lives in Dexie
// and is user-editable from Settings after that.
export const DEFAULT_MEDS = [
  "Albuterol", "Atrovent", "Epinephrine", "Oral Glucose", "Acetaminophen",
  "Zofran", "Toradol", "TXA", "D10",
];
// One-time seed for the interventions table — Oxygen and Medication are not
// included here since they're always-present, non-removable rows built into
// the call form itself, not part of the customizable list.
export const DEFAULT_INTERVENTIONS: { name: string; mode: Mode; notesEnabled: boolean }[] = [
  { name: "C-Spine Immobilization", mode: "trauma",  notesEnabled: false },
  { name: "Backboard",              mode: "trauma",  notesEnabled: false },
  { name: "Extremity Splinting",    mode: "trauma",  notesEnabled: false },
  { name: "Bandaging",              mode: "trauma",  notesEnabled: false },
  { name: "12-Lead ECG",            mode: "medical", notesEnabled: true },
];
// One-time seed for the locationCategories table — the live list lives in
// Dexie and is user-editable from Settings after that (same pattern as
// HOSPITALS/DEFAULT_MEDS above). Locations (pins) themselves have no seed
// data — they're the crew's own personal spots, starting empty.
export const DEFAULT_LOCATION_CATEGORIES = ["Best Snacks", "Best Post Spots", "Best Dog Parks", "Best Restaurants"];
// Rotating palette used to auto-assign a LocationCategory's marker/chip
// color by its position in the list, unless the user overrides it via the
// color wheel in Settings (LocationCategory.color).
export const LOCATION_CATEGORY_PALETTE = [
  "#7B1FA2", "#1976D2", "#2E7D32", "#E65100", "#C2185B", "#00838F", "#F9A825", "#5D4037",
];
// Fallback map center (Stone Mountain, GA area) used when geolocation is
// denied/unavailable and there are no saved pins to center on instead.
export const DEFAULT_MAP_CENTER = { lat: 33.8080924, lng: -84.1706273 };

// A single preset pin (the unit's station), seeded once alongside the
// location categories above — unlike other pins it comes with its own
// fixed gray category color rather than an auto-assigned palette color.
export const STATION_CATEGORY = { name: "Station", color: "#6b7280" };
export const STATION_LOCATION = {
  name: "Station",
  category: STATION_CATEGORY.name,
  lat: DEFAULT_MAP_CENTER.lat,
  lng: DEFAULT_MAP_CENTER.lng,
  address: "1380 Beverage Drive, Suite D, Stone Mountain, GA 30083",
};
