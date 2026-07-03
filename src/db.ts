import Dexie, { type Table } from "dexie";

export interface CallRecord {
  id?: number;
  // meta
  date: string;
  timestamp: number;
  shiftId?: number;
  unitNum: string;
  unitType: string;
  mode: "trauma" | "medical";
  // patient basics
  age: string;
  ageYears: string;
  ageMonths: string;
  sex: string;
  complaint: string;
  // vitals
  hr: string;
  bp: string;
  spo2: string;
  rr: string;
  gcs: string;
  glucose: string;
  alertOriented: string;
  // trauma interventions — legacy booleans, kept unwritten-but-readable for
  // old records' CSV export now that `interventions` below is the live field
  tCspine?: boolean;
  tBackboard?: boolean;
  tSplint?: boolean;
  tBandage?: boolean;
  // customizable interventions (excludes Oxygen/Medication, which are fixed)
  interventions?: { name: string; note?: string }[];
  // oxygen
  oxyOn: boolean;
  oxyType: string;
  oxyLiters: number;
  // medication
  medOn: boolean;
  salineAmt: number;
  lrAmt: number;
  zofran: boolean;
  toradol: boolean;
  meds?: { name: string; route: string }[];
  // 12-lead — legacy, kept unwritten-but-readable (see `interventions` above)
  leadOn?: boolean;
  leadInterp?: string;
  // IV
  ivOn: boolean;
  gauge: string;
  ivLR: string;
  ivSite: string;
  ivEstablished?: boolean;
  ivAttempts?: string;
  // extras
  allergies: string;
  medHistory: string;
  notes: string;
  callStatus?: string;
  techedCall?: boolean;
  acuity?: string;
  hospital?: string;
  transportMode?: string;
  locked?: boolean;
}

export interface Shift {
  id?: number;
  startTime: number;
  endTime?: number;
  crew: string;
  unitNum: string;
  unitType: string;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export interface Hospital {
  id?: number;
  name: string;
}

export interface Medication {
  id?: number;
  name: string;
  defaultRoute?: string;
}

// A customizable intervention definition (excludes Oxygen/Medication, which
// are always-present and not part of this list — see DEFAULT_INTERVENTIONS).
export interface InterventionDef {
  id?: number;
  name: string;
  mode: "trauma" | "medical";
  notesEnabled?: boolean;
  order: number;
}

class EMSDatabase extends Dexie {
  calls!: Table<CallRecord>;
  shifts!: Table<Shift>;
  settings!: Table<Settings>;
  hospitals!: Table<Hospital>;
  medications!: Table<Medication>;
  interventions!: Table<InterventionDef>;

  constructor() {
    super("emsDatabase");
    this.version(1).stores({
      calls: "++id, timestamp, shiftId, mode, date",
      shifts: "++id, startTime",
      settings: "++id, key",
    });
    this.version(2).stores({
      calls: "++id, timestamp, shiftId, mode, date",
      shifts: "++id, startTime",
      settings: "++id, key",
      hospitals: "++id, &name",
      medications: "++id, &name",
    });
    this.version(3).stores({
      calls: "++id, timestamp, shiftId, mode, date",
      shifts: "++id, startTime",
      settings: "++id, key",
      hospitals: "++id, &name",
      medications: "++id, &name",
      interventions: "++id, mode, order",
    });
  }
}

export const db = new EMSDatabase();

// ── Export helpers ────────────────────────────────────────────
// Calls saved before the dynamic medication list existed only recorded
// Zofran/Toradol as booleans, with no route — those are rendered without
// a route suffix so historical exports still show what was given.
export function medsSummary(c: CallRecord): string {
  if (c.meds && c.meds.length > 0) {
    return c.meds.map(m => `${m.name} (${m.route})`).join("; ");
  }
  const legacy = [c.zofran ? "Zofran" : "", c.toradol ? "Toradol" : ""].filter(Boolean);
  return legacy.join("; ");
}

// Calls saved before the customizable intervention list existed only
// recorded the fixed trauma booleans and the 12-Lead pair — those are
// rendered from the legacy fields so historical exports still show what
// was done.
export function interventionsSummary(c: CallRecord): string {
  if (c.interventions && c.interventions.length > 0) {
    return c.interventions.map(i => i.note ? `${i.name} (${i.note})` : i.name).join("; ");
  }
  const legacy = [
    c.tCspine ? "C-Spine Immobilization" : "",
    c.tBackboard ? "Backboard" : "",
    c.tSplint ? "Extremity Splinting" : "",
    c.tBandage ? "Bandaging" : "",
    c.leadOn ? (c.leadInterp ? `12-Lead ECG (${c.leadInterp})` : "12-Lead ECG") : "",
  ].filter(Boolean);
  return legacy.join("; ");
}

export function callsToCSV(calls: CallRecord[]): string {
  const headers = [
    "ID", "Date", "Unit", "Type", "Mode", "Age", "Sex", "Complaint",
    "HR", "BP", "SpO2", "RR", "GCS", "Glucose",
    "Interventions",
    "Oxygen", "O2 Type", "O2 Liters",
    "Medication", "Saline(mL)", "LR(mL)", "Medications",
    "IV", "Gauge", "IV Side", "IV Site", "IV Established", "IV Attempts",
    "Allergies", "Med History", "Notes", "Call Status", "Hospital",
  ];
  const rows = calls.map(c => [
    c.id ?? "", `"${c.date}"`, c.unitNum, c.unitType, c.mode, c.age, c.sex, `"${c.complaint}"`,
    c.hr, c.bp, c.spo2, c.rr, c.gcs, c.glucose,
    `"${interventionsSummary(c)}"`,
    c.oxyOn ? "Y" : "N", c.oxyType, c.oxyLiters,
    c.medOn ? "Y" : "N", c.salineAmt, c.lrAmt, `"${medsSummary(c)}"`,
    c.ivOn ? "Y" : "N", c.gauge, c.ivLR, c.ivSite, c.ivOn ? (c.ivEstablished ? "Y" : "N") : "", c.ivAttempts || "",
    `"${c.allergies}"`, `"${c.medHistory}"`, `"${c.notes}"`, c.callStatus || "", c.hospital || "",
  ]);
  return [headers, ...rows].map(r => r.join(",")).join("\n");
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import helpers ────────────────────────────────────────────
// RFC4180-ish: handles quoted fields, commas inside quotes, doubled ""
// escaping. No CSV library in this project — kept minimal rather than
// adding a dependency for a single, narrowly-scoped import feature.
export function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += ch;
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// "5y 2m" -> {ageYears: "5", ageMonths: "2"}; mirrors the compose logic in
// App.tsx's saveCall() in reverse.
function parseAge(age: string): { ageYears: string; ageMonths: string } {
  const yMatch = age.match(/(\d+)y/);
  const mMatch = age.match(/(\d+)m/);
  return { ageYears: yMatch?.[1] ?? "", ageMonths: mMatch?.[1] ?? "" };
}

// Inverse of medsSummary(): "Zofran (IV); Toradol (PO)" -> structured
// entries. Bare names (legacy calls with no route recorded) default to
// "IV", consistent with the app's IV fallback everywhere else.
function parseMeds(summary: string): { name: string; route: string }[] {
  if (!summary.trim()) return [];
  return summary.split(";").map(s => s.trim()).filter(Boolean).map(entry => {
    const match = entry.match(/^(.+?)\s\(([^)]+)\)$/);
    return match ? { name: match[1], route: match[2] } : { name: entry, route: "IV" };
  });
}

// Inverse of interventionsSummary(): "Backboard; 12-Lead ECG (STEMI)" ->
// structured entries, note optional per-entry.
function parseInterventions(summary: string): { name: string; note?: string }[] {
  if (!summary.trim()) return [];
  return summary.split(";").map(s => s.trim()).filter(Boolean).map(entry => {
    const match = entry.match(/^(.+?)\s\(([^)]+)\)$/);
    return match ? { name: match[1], note: match[2] } : { name: entry };
  });
}

const REQUIRED_HEADERS = ["Date", "Unit", "Type", "Mode", "Complaint"];

// Parses a CSV produced by callsToCSV() back into importable call records.
// The CSV's ID column is always discarded — every row becomes a brand-new
// call (Dexie assigns a fresh id) so import can never overwrite existing
// data. Per-row errors are collected rather than thrown, so one bad row
// doesn't block the rest of the file.
export function csvToCallRecords(text: string): { records: Omit<CallRecord, "id">[]; errors: string[] } {
  const rows = parseCSVText(text);
  if (rows.length === 0) return { records: [], errors: ["File is empty."] };

  const header = rows[0];
  const col = (name: string) => header.indexOf(name);
  const missing = REQUIRED_HEADERS.filter(h => col(h) === -1);
  if (missing.length > 0) {
    return { records: [], errors: [`This doesn't look like a call export from this app (missing columns: ${missing.join(", ")}).`] };
  }

  const records: Omit<CallRecord, "id">[] = [];
  const errors: string[] = [];
  const get = (r: string[], name: string) => (col(name) === -1 ? "" : (r[col(name)] ?? ""));

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < header.length - 5) { // tolerate a few trailing-blank-column mismatches
      errors.push(`Row ${i + 1}: too few columns, skipped.`);
      continue;
    }
    const dateStr = get(r, "Date");
    const timestamp = Date.parse(dateStr);
    if (isNaN(timestamp)) { errors.push(`Row ${i + 1}: unparseable date "${dateStr}", skipped.`); continue; }

    const mode = get(r, "Mode");
    if (mode !== "trauma" && mode !== "medical") { errors.push(`Row ${i + 1}: unknown mode "${mode}", skipped.`); continue; }

    const { ageYears, ageMonths } = parseAge(get(r, "Age"));
    const hospital = get(r, "Hospital") || undefined;

    records.push({
      date: dateStr, timestamp,
      unitNum: get(r, "Unit"), unitType: get(r, "Type"),
      mode, age: get(r, "Age"), ageYears, ageMonths,
      sex: get(r, "Sex"), complaint: get(r, "Complaint"),
      hr: get(r, "HR"), bp: get(r, "BP"), spo2: get(r, "SpO2"), rr: get(r, "RR"),
      gcs: get(r, "GCS"), glucose: get(r, "Glucose"),
      alertOriented: "", // not in the export, no way to recover
      interventions: parseInterventions(get(r, "Interventions")),
      oxyOn: get(r, "Oxygen") === "Y", oxyType: get(r, "O2 Type"),
      oxyLiters: parseFloat(get(r, "O2 Liters")) || 0,
      medOn: get(r, "Medication") === "Y",
      salineAmt: parseInt(get(r, "Saline(mL)"), 10) || 0,
      lrAmt: parseInt(get(r, "LR(mL)"), 10) || 0,
      zofran: false, toradol: false,
      meds: parseMeds(get(r, "Medications")),
      ivOn: get(r, "IV") === "Y", gauge: get(r, "Gauge"), ivLR: get(r, "IV Side"), ivSite: get(r, "IV Site"),
      ivEstablished: get(r, "IV Established") === "" ? undefined : get(r, "IV Established") === "Y",
      ivAttempts: get(r, "IV Attempts") || undefined,
      allergies: get(r, "Allergies"), medHistory: get(r, "Med History"), notes: get(r, "Notes"),
      callStatus: get(r, "Call Status") || undefined,
      techedCall: false, acuity: "",
      hospital, transportMode: hospital ? "hospital" : "",
      locked: false,
    });
  }
  return { records, errors };
}
