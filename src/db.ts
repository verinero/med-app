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
  // trauma interventions
  tCspine: boolean;
  tBackboard: boolean;
  tSplint: boolean;
  tBandage: boolean;
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
  // 12-lead
  leadOn: boolean;
  leadInterp: string;
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

class EMSDatabase extends Dexie {
  calls!: Table<CallRecord>;
  shifts!: Table<Shift>;
  settings!: Table<Settings>;
  hospitals!: Table<Hospital>;
  medications!: Table<Medication>;

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

export function callsToCSV(calls: CallRecord[]): string {
  const headers = [
    "ID", "Date", "Unit", "Type", "Mode", "Age", "Sex", "Complaint",
    "HR", "BP", "SpO2", "RR", "GCS", "Glucose",
    "C-Spine", "Backboard", "Splinting", "Bandaging",
    "Oxygen", "O2 Type", "O2 Liters",
    "Medication", "Saline(mL)", "LR(mL)", "Medications",
    "12-Lead", "ECG Interp",
    "IV", "Gauge", "IV Side", "IV Site", "IV Established", "IV Attempts",
    "Allergies", "Med History", "Notes", "Call Status", "Hospital",
  ];
  const rows = calls.map(c => [
    c.id ?? "", c.date, c.unitNum, c.unitType, c.mode, c.age, c.sex, `"${c.complaint}"`,
    c.hr, c.bp, c.spo2, c.rr, c.gcs, c.glucose,
    c.tCspine ? "Y" : "N", c.tBackboard ? "Y" : "N", c.tSplint ? "Y" : "N", c.tBandage ? "Y" : "N",
    c.oxyOn ? "Y" : "N", c.oxyType, c.oxyLiters,
    c.medOn ? "Y" : "N", c.salineAmt, c.lrAmt, `"${medsSummary(c)}"`,
    c.leadOn ? "Y" : "N", `"${c.leadInterp}"`,
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
