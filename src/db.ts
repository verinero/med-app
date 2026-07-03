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

class EMSDatabase extends Dexie {
  calls!: Table<CallRecord>;
  shifts!: Table<Shift>;
  settings!: Table<Settings>;

  constructor() {
    super("emsDatabase");
    this.version(1).stores({
      calls: "++id, timestamp, shiftId, mode, date",
      shifts: "++id, startTime",
      settings: "++id, key",
    });
  }
}

export const db = new EMSDatabase();

// ── Export helpers ────────────────────────────────────────────
export function callsToCSV(calls: CallRecord[]): string {
  const headers = [
    "ID", "Date", "Unit", "Type", "Mode", "Age", "Sex", "Complaint",
    "HR", "BP", "SpO2", "RR", "GCS", "Glucose",
    "C-Spine", "Backboard", "Splinting", "Bandaging",
    "Oxygen", "O2 Type", "O2 Liters",
    "Medication", "Saline(mL)", "LR(mL)", "Zofran", "Toradol",
    "12-Lead", "ECG Interp",
    "IV", "Gauge", "IV Side", "IV Site", "IV Established", "IV Attempts",
    "Allergies", "Med History", "Notes", "Call Status", "Hospital",
  ];
  const rows = calls.map(c => [
    c.id ?? "", c.date, c.unitNum, c.unitType, c.mode, c.age, c.sex, `"${c.complaint}"`,
    c.hr, c.bp, c.spo2, c.rr, c.gcs, c.glucose,
    c.tCspine ? "Y" : "N", c.tBackboard ? "Y" : "N", c.tSplint ? "Y" : "N", c.tBandage ? "Y" : "N",
    c.oxyOn ? "Y" : "N", c.oxyType, c.oxyLiters,
    c.medOn ? "Y" : "N", c.salineAmt, c.lrAmt, c.zofran ? "Y" : "N", c.toradol ? "Y" : "N",
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
