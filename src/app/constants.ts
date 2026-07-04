// ── Types ────────────────────────────────────────────────────
export type Screen = "home" | "newCall" | "export" | "stats" | "settings";
export type Mode   = "trauma" | "medical";
export type UType  = "B" | "IM" | "AM";
export type LR     = "L" | "R";
// 5-level vital: "1"=low … "5"=high, ""=not assessed
export type VitalLevel = "1" | "2" | "3" | "4" | "5" | "";

// ── Theme ────────────────────────────────────────────────────
export const HOME_COLOR = { p: "#7B1FA2", l: "#F3E5F5", fab: "0 8px 28px rgba(123,31,162,0.42)" };
export const TH = {
  trauma:  { p: "#D32F2F", l: "#FFEBEE", fab: "0 8px 28px rgba(211,47,47,0.42)" },
  medical: { p: "#1976D2", l: "#E3F2FD", fab: "0 8px 28px rgba(25,118,210,0.42)" },
} as const;

export type ThemeColors = typeof TH[Mode];

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
