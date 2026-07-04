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
  // Eye/Verbal/Motor breakdown behind the `gcs` total — optional since
  // pre-migration calls only ever recorded the hand-typed total.
  gcsEye?: string;
  gcsVerbal?: string;
  gcsMotor?: string;
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

// A customizable quick-tap chief complaint chip, scoped per mode — replaces
// the old hardcoded T_CHIPS/M_CHIPS constants. No `order`/reorder support
// (unlike InterventionDef): chip order isn't curated, just insertion order.
export interface ChiefComplaint {
  id?: number;
  name: string;
  mode: "trauma" | "medical";
}

class EMSDatabase extends Dexie {
  calls!: Table<CallRecord>;
  shifts!: Table<Shift>;
  settings!: Table<Settings>;
  hospitals!: Table<Hospital>;
  medications!: Table<Medication>;
  interventions!: Table<InterventionDef>;
  chiefComplaints!: Table<ChiefComplaint>;

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
    this.version(4).stores({
      calls: "++id, timestamp, shiftId, mode, date",
      shifts: "++id, startTime",
      settings: "++id, key",
      hospitals: "++id, &name",
      medications: "++id, &name",
      interventions: "++id, mode, order",
      chiefComplaints: "++id, mode",
    });
  }
}

export const db = new EMSDatabase();

// ── Settings key/value helpers ──────────────────────────────────
// `settings` is a plain key/value table (no unique index on `key`), so a
// "set" is a query-then-update-or-add rather than a keyed put.
export async function getSettingValue(key: string): Promise<string | undefined> {
  const row = await db.settings.where("key").equals(key).first();
  return row?.value;
}

export async function setSettingValue(key: string, value: string): Promise<void> {
  const row = await db.settings.where("key").equals(key).first();
  if (row?.id != null) await db.settings.update(row.id, { value });
  else await db.settings.add({ key, value });
}

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

// Calls and Shifts round-trip via a single combined CSV, distinguished by a
// "RecordType" column — they were split into two exports at first, but a
// call is fundamentally linked to its shift (unitNum/unitType/date are
// always derived from the tagged shift, per CLAUDE.md), so importing one
// without the other left calls "orphaned" (no shiftId, no crew). A call
// row's own ShiftStart/Unit/Type triple is the join key back to its Shift
// row — no separate id column needed since Dexie reassigns ids on insert.
export function recordsToCSV(calls: CallRecord[], shifts: Shift[]): string {
  const headers = [
    "RecordType", "ID", "Date", "Unit", "Type", "Mode", "Age", "Sex", "Complaint",
    "HR", "BP", "SpO2", "RR", "GCS", "GCS Eye", "GCS Verbal", "GCS Motor", "Glucose",
    "Interventions",
    "Oxygen", "O2 Type", "O2 Liters",
    "Medication", "Saline(mL)", "LR(mL)", "Medications",
    "IV", "Gauge", "IV Side", "IV Site", "IV Established", "IV Attempts",
    "Allergies", "Med History", "Notes", "Call Status", "Hospital",
    "ShiftStart", "ShiftEnd", "Crew",
  ];
  const shiftRows = shifts.map(s => [
    "Shift", s.id ?? "", "", s.unitNum, s.unitType, "", "", "", "",
    "", "", "", "", "", "", "", "", "",
    "",
    "", "", "",
    "", "", "", "",
    "", "", "", "", "", "",
    "", "", "", "", "",
    new Date(s.startTime).toISOString(), s.endTime != null ? new Date(s.endTime).toISOString() : "", `"${s.crew}"`,
  ]);
  const callRows = calls.map(c => {
    const taggedShift = c.shiftId != null ? shifts.find(s => s.id === c.shiftId) : undefined;
    return [
      "Call", c.id ?? "", `"${c.date}"`, c.unitNum, c.unitType, c.mode, c.age, c.sex, `"${c.complaint}"`,
      c.hr, c.bp, c.spo2, c.rr, c.gcs, c.gcsEye || "", c.gcsVerbal || "", c.gcsMotor || "", c.glucose,
      `"${interventionsSummary(c)}"`,
      c.oxyOn ? "Y" : "N", c.oxyType, c.oxyLiters,
      c.medOn ? "Y" : "N", c.salineAmt, c.lrAmt, `"${medsSummary(c)}"`,
      c.ivOn ? "Y" : "N", c.gauge, c.ivLR, c.ivSite, c.ivOn ? (c.ivEstablished ? "Y" : "N") : "", c.ivAttempts || "",
      `"${c.allergies}"`, `"${c.medHistory}"`, `"${c.notes}"`, c.callStatus || "", c.hospital || "",
      taggedShift ? new Date(taggedShift.startTime).toISOString() : "", "", "",
    ];
  });
  return [headers, ...shiftRows, ...callRows].map(r => r.join(",")).join("\n");
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

// ── Presets export/import (Hospitals / Medications / Interventions / Chief Complaints) ─────
// A single combined CSV, distinguished by a "Type" column, rather than
// separate files per list — this is a bulk config load/backup for the
// crew-editable option lists in Settings, not a per-call data format.
export function presetsToCSV(hospitals: Hospital[], medications: Medication[], interventions: InterventionDef[], chiefComplaints: ChiefComplaint[]): string {
  const headers = ["Type", "Name", "Mode", "DefaultRoute", "NotesEnabled", "Order"];
  const rows: string[][] = [];
  for (const h of hospitals) rows.push(["Hospital", h.name, "", "", "", ""]);
  for (const m of medications) rows.push(["Medication", m.name, "", m.defaultRoute || "", "", ""]);
  for (const i of [...interventions].sort((a, b) => a.order - b.order)) {
    rows.push(["Intervention", i.name, i.mode, "", i.notesEnabled ? "Y" : "N", String(i.order)]);
  }
  for (const cc of chiefComplaints) rows.push(["Complaint", cc.name, cc.mode, "", "", ""]);
  return [headers, ...rows].map(r => r.map(f => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export interface ParsedPresets {
  hospitals: { name: string }[] | null;
  medications: { name: string; defaultRoute?: string }[] | null;
  interventions: {
    trauma: { name: string; notesEnabled: boolean }[] | null;
    medical: { name: string; notesEnabled: boolean }[] | null;
  };
  chiefComplaints: {
    trauma: { name: string }[] | null;
    medical: { name: string }[] | null;
  };
  errors: string[];
}

// Parses a CSV produced by presetsToCSV(). A list/mode with zero matching
// rows in the file is represented as `null` ("not present, don't touch")
// so a partial export (e.g. hospitals-only) can never silently wipe the
// other lists on import — only lists/modes actually present get replaced.
export function parsePresetsCSV(text: string): ParsedPresets {
  const rows = parseCSVText(text);
  const result: ParsedPresets = { hospitals: null, medications: null, interventions: { trauma: null, medical: null }, chiefComplaints: { trauma: null, medical: null }, errors: [] };
  if (rows.length === 0) { result.errors.push("File is empty."); return result; }

  const header = rows[0];
  const col = (name: string) => header.indexOf(name);
  const required = ["Type", "Name"];
  const missing = required.filter(h => col(h) === -1);
  if (missing.length > 0) {
    result.errors.push(`This doesn't look like a presets export from this app (missing columns: ${missing.join(", ")}).`);
    return result;
  }
  const get = (r: string[], name: string) => (col(name) === -1 ? "" : (r[col(name)] ?? ""));

  const seenHospital = new Set<string>();
  const seenMedication = new Set<string>();
  const seenIntervention = { trauma: new Set<string>(), medical: new Set<string>() };
  const seenComplaint = { trauma: new Set<string>(), medical: new Set<string>() };
  const hospitals: { name: string }[] = [];
  const medications: { name: string; defaultRoute?: string }[] = [];
  const interventions = { trauma: [] as { name: string; notesEnabled: boolean }[], medical: [] as { name: string; notesEnabled: boolean }[] };
  const chiefComplaints = { trauma: [] as { name: string }[], medical: [] as { name: string }[] };

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0] === "") continue;
    const type = get(r, "Type");
    const name = get(r, "Name").trim();
    if (!name) { result.errors.push(`Row ${i + 1}: missing Name, skipped.`); continue; }

    if (type === "Hospital") {
      const key = name.toLowerCase();
      if (seenHospital.has(key)) { result.errors.push(`Row ${i + 1}: duplicate hospital "${name}", skipped.`); continue; }
      seenHospital.add(key);
      hospitals.push({ name });
    } else if (type === "Medication") {
      const key = name.toLowerCase();
      if (seenMedication.has(key)) { result.errors.push(`Row ${i + 1}: duplicate medication "${name}", skipped.`); continue; }
      seenMedication.add(key);
      medications.push({ name, defaultRoute: get(r, "DefaultRoute") || undefined });
    } else if (type === "Intervention") {
      const mode = get(r, "Mode");
      if (mode !== "trauma" && mode !== "medical") { result.errors.push(`Row ${i + 1}: unknown intervention mode "${mode}", skipped.`); continue; }
      const key = name.toLowerCase();
      if (seenIntervention[mode].has(key)) { result.errors.push(`Row ${i + 1}: duplicate ${mode} intervention "${name}", skipped.`); continue; }
      seenIntervention[mode].add(key);
      interventions[mode].push({ name, notesEnabled: get(r, "NotesEnabled").trim().toUpperCase() === "Y" });
    } else if (type === "Complaint") {
      const mode = get(r, "Mode");
      if (mode !== "trauma" && mode !== "medical") { result.errors.push(`Row ${i + 1}: unknown complaint mode "${mode}", skipped.`); continue; }
      const key = name.toLowerCase();
      if (seenComplaint[mode].has(key)) { result.errors.push(`Row ${i + 1}: duplicate ${mode} complaint "${name}", skipped.`); continue; }
      seenComplaint[mode].add(key);
      chiefComplaints[mode].push({ name });
    } else {
      result.errors.push(`Row ${i + 1}: unknown Type "${type}", skipped.`);
    }
  }

  if (hospitals.length > 0) result.hospitals = hospitals;
  if (medications.length > 0) result.medications = medications;
  if (interventions.trauma.length > 0) result.interventions.trauma = interventions.trauma;
  if (interventions.medical.length > 0) result.interventions.medical = interventions.medical;
  if (chiefComplaints.trauma.length > 0) result.chiefComplaints.trauma = chiefComplaints.trauma;
  if (chiefComplaints.medical.length > 0) result.chiefComplaints.medical = chiefComplaints.medical;
  return result;
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
      gcs: get(r, "GCS"),
      gcsEye: get(r, "GCS Eye") || undefined, gcsVerbal: get(r, "GCS Verbal") || undefined, gcsMotor: get(r, "GCS Motor") || undefined,
      glucose: get(r, "Glucose"),
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

export interface ParsedRecords {
  calls: (Omit<CallRecord, "id"> & { shiftStartKey?: string })[];
  shifts: Omit<Shift, "id">[];
  errors: string[];
}

// Parses a CSV produced by recordsToCSV(): Calls and Shifts combined,
// distinguished by a "RecordType" column. Each call carries its shift's
// `shiftStartKey` (an ISO timestamp) forward — not a real CallRecord field,
// consumed by the importer to relink `shiftId` once shift rows have been
// inserted (or matched against an existing shift) and their real ids are
// known. Files exported before Shifts were included have no "RecordType"
// column and fall back to the old calls-only parse so they still import.
export function csvToRecords(text: string): ParsedRecords {
  const rows = parseCSVText(text);
  if (rows.length === 0) return { calls: [], shifts: [], errors: ["File is empty."] };

  const header = rows[0];
  const col = (name: string) => header.indexOf(name);
  if (col("RecordType") === -1) {
    const { records, errors } = csvToCallRecords(text);
    return { calls: records, shifts: [], errors };
  }

  const missing = REQUIRED_HEADERS.filter(h => col(h) === -1);
  if (missing.length > 0) {
    return { calls: [], shifts: [], errors: [`This doesn't look like an export from this app (missing columns: ${missing.join(", ")}).`] };
  }
  const get = (r: string[], name: string) => (col(name) === -1 ? "" : (r[col(name)] ?? ""));

  const calls: (Omit<CallRecord, "id"> & { shiftStartKey?: string })[] = [];
  const shifts: Omit<Shift, "id">[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0] === "") continue;
    const recordType = get(r, "RecordType");

    if (recordType === "Shift") {
      const startStr = get(r, "ShiftStart");
      const startTime = Date.parse(startStr);
      if (isNaN(startTime)) { errors.push(`Row ${i + 1}: unparseable shift start "${startStr}", skipped.`); continue; }
      const endStr = get(r, "ShiftEnd");
      const endTime = endStr ? Date.parse(endStr) : NaN;
      shifts.push({
        startTime, endTime: isNaN(endTime) ? undefined : endTime,
        crew: get(r, "Crew"), unitNum: get(r, "Unit"), unitType: get(r, "Type"),
      });
    } else if (recordType === "Call") {
      if (r.length < header.length - 5) { errors.push(`Row ${i + 1}: too few columns, skipped.`); continue; }
      const dateStr = get(r, "Date");
      const timestamp = Date.parse(dateStr);
      if (isNaN(timestamp)) { errors.push(`Row ${i + 1}: unparseable date "${dateStr}", skipped.`); continue; }
      const mode = get(r, "Mode");
      if (mode !== "trauma" && mode !== "medical") { errors.push(`Row ${i + 1}: unknown mode "${mode}", skipped.`); continue; }
      const { ageYears, ageMonths } = parseAge(get(r, "Age"));
      const hospital = get(r, "Hospital") || undefined;

      calls.push({
        date: dateStr, timestamp,
        unitNum: get(r, "Unit"), unitType: get(r, "Type"),
        mode, age: get(r, "Age"), ageYears, ageMonths,
        sex: get(r, "Sex"), complaint: get(r, "Complaint"),
        hr: get(r, "HR"), bp: get(r, "BP"), spo2: get(r, "SpO2"), rr: get(r, "RR"),
        gcs: get(r, "GCS"),
      gcsEye: get(r, "GCS Eye") || undefined, gcsVerbal: get(r, "GCS Verbal") || undefined, gcsMotor: get(r, "GCS Motor") || undefined,
      glucose: get(r, "Glucose"),
        alertOriented: "",
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
        shiftStartKey: get(r, "ShiftStart") || undefined,
      });
    } else {
      errors.push(`Row ${i + 1}: unknown RecordType "${recordType}", skipped.`);
    }
  }

  return { calls, shifts, errors };
}
