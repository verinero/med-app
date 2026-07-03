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
    c.id ?? "", c.date, c.unitNum, c.unitType, c.mode, c.age, c.sex, `"${c.complaint}"`,
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
