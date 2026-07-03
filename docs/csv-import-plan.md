# CSV Import (Settings) — Implementation Plan

Status: **planned, not implemented**. This doc is the spec to build from later.

## Context

The app already exports all calls to CSV (`callsToCSV()` in `src/db.ts`, wired through `ExportScreen.tsx`), but there's no way back in — if a device is reset, the app is reinstalled, or a crew wants to move data to another phone, there's currently no recovery path other than re-entering every call by hand. This adds a "round trip" CSV import in Settings: pick a `.csv` file that was produced by this app's own export, and load its rows back in as new calls.

Decisions already made (don't re-litigate these without a reason):
- **Scope**: only supports this app's own export format — no column-mapping UI for arbitrary/external CSVs. This is a "backup and restore" feature, not a general data-migration tool.
- **ID handling**: the CSV's `ID` column is always ignored on import. Every imported row becomes a brand-new call (Dexie auto-assigns a fresh id via `++id`). Import can never overwrite or corrupt an existing record — re-importing the same file twice just creates duplicates, which is an acceptable, safe failure mode (duplicates can be deleted individually like any other call).

## Known limitations (surface these in the UI copy, don't try to "solve" them)

1. **`timestamp` isn't in the export.** `callsToCSV()` only writes the human-readable `Date` column (e.g. `"Jul 3, 2026"`), never the raw `timestamp` used for sorting/recency. Import reconstructs `timestamp` via `Date.parse(dateStr)`, landing on local midnight of that day. Same-day calls will sort correctly relative to other days; relative order *within* a day becomes import order, not the original time-of-day. This loss already exists in the current export — importing can't undo it, only surface it.
2. **Meds/Interventions round-trip is best-effort.** Both are exported as a single semicolon-joined summary string (see `medsSummary()` / `interventionsSummary()` in `src/db.ts`, e.g. `"Zofran (IV); Toradol (PO)"` or `"Backboard; 12-Lead ECG (STEMI inferior)"`). Import parses `Name (detail)` / bare `Name` back into the structured array shape. Any entry that doesn't match the expected pattern is skipped (that one entry only — not the whole row).
3. **`shiftId` is never set on import.** The CSV has flattened `Unit`/`Type` strings, not a shift reference. Imported calls get `unitNum`/`unitType` populated directly from those columns and `shiftId: undefined` — this is already a valid, handled state (same as the app's existing "save without a tagged shift" flow via `attemptSave()`/`confirmSaveWithoutShift()` in `App.tsx`).

## Current CSV format to parse against

From `src/db.ts` `callsToCSV()` (verify this hasn't drifted before implementing — it's the source of truth, this table is a snapshot):

| # | Header | `CallRecord` field(s) | Notes |
|---|---|---|---|
| 1 | `ID` | — | **Discarded on import.** Never assigned to `id`. |
| 2 | `Date` | `date`, `timestamp` | `date` copied as-is; `timestamp` reconstructed via `Date.parse` (see limitation #1). |
| 3 | `Unit` | `unitNum` | |
| 4 | `Type` | `unitType` | |
| 5 | `Mode` | `mode` | `"trauma" \| "medical"` — validate, reject/skip row if neither. |
| 6 | `Age` | `age`, `ageYears`, `ageMonths` | Reverse-parse composed string. See "Age parsing" below. |
| 7 | `Sex` | `sex` | |
| 8 | `Complaint` | `complaint` | Quoted field. |
| 9-14 | `HR`, `BP`, `SpO2`, `RR`, `GCS`, `Glucose` | `hr`, `bp`, `spo2`, `rr`, `gcs`, `glucose` | Plain strings, copy as-is. |
| 15 | `Interventions` | `interventions` | Quoted. Parse via `interventionsSummary` inverse — see below. Legacy `tCspine`/`tBackboard`/`tSplint`/`tBandage`/`leadOn`/`leadInterp` are **not** reconstructed on import; everything lands in the new `interventions` array. |
| 16 | `Oxygen` | `oxyOn` | `Y`/`N` → boolean. |
| 17 | `O2 Type` | `oxyType` | |
| 18 | `O2 Liters` | `oxyLiters` | `parseFloat`, fallback `0`. |
| 19 | `Medication` | `medOn` | `Y`/`N` → boolean. |
| 20 | `Saline(mL)` | `salineAmt` | `parseInt`, fallback `0`. |
| 21 | `LR(mL)` | `lrAmt` | `parseInt`, fallback `0`. |
| 22 | `Medications` | `meds` | Quoted. Parse via `medsSummary` inverse — see below. `zofran`/`toradol` always written `false` on import (legacy fields, superseded by `meds`). |
| 23 | `IV` | `ivOn` | `Y`/`N` → boolean. |
| 24 | `Gauge` | `gauge` | |
| 25 | `IV Side` | `ivLR` | `"L" \| "R"`. |
| 26 | `IV Site` | `ivSite` | |
| 27 | `IV Established` | `ivEstablished` | `""` → `undefined`; `Y`/`N` → boolean. Only meaningful when `ivOn`. |
| 28 | `IV Attempts` | `ivAttempts` | Copy as-is (string). |
| 29-31 | `Allergies`, `Med History`, `Notes` | `allergies`, `medHistory`, `notes` | Quoted fields. |
| 32 | `Call Status` | `callStatus` | `""` → `undefined`. |
| 33 | `Hospital` | `hospital` | `""` → `undefined`. |

Not in the CSV at all (always defaulted on import): `techedCall` (`false`), `acuity` (`""`), `transportMode` (`"hospital"` if `hospital` set, else `""`), `locked` (`false`).

### Age parsing

Mirrors the compose logic in `App.tsx` `saveCall()`:
```ts
function parseAge(age: string): { age: string; ageYears: string; ageMonths: string } {
  const yMatch = age.match(/(\d+)y/);
  const mMatch = age.match(/(\d+)m/);
  return {
    age,
    ageYears: yMatch?.[1] ?? "",
    ageMonths: mMatch?.[1] ?? "",
  };
}
```
Handles `"5y"`, `"5y 2m"`, `"8m"`, and `""` (both groups empty).

### Meds inverse-parse

`medsSummary()` produces `"Name (ROUTE); Name2 (ROUTE2)"` (structured) or bare `"Name; Name2"` (legacy fallback, no parens). Inverse:
```ts
function parseMeds(summary: string): { name: string; route: string }[] {
  if (!summary.trim()) return [];
  return summary.split(";").map(s => s.trim()).filter(Boolean).map(entry => {
    const match = entry.match(/^(.+?)\s\(([^)]+)\)$/);
    return match ? { name: match[1], route: match[2] } : { name: entry, route: "IV" };
  });
}
```
Bare names (legacy calls with no route recorded) default to `"IV"` on import — consistent with the app's existing IV fallback (`ROUTES[0]`) everywhere else a route is unspecified.

### Interventions inverse-parse

`interventionsSummary()` produces `"Name (note); Name2"` (note optional per-entry). Inverse:
```ts
function parseInterventions(summary: string): { name: string; note?: string }[] {
  if (!summary.trim()) return [];
  return summary.split(";").map(s => s.trim()).filter(Boolean).map(entry => {
    const match = entry.match(/^(.+?)\s\(([^)]+)\)$/);
    return match ? { name: match[1], note: match[2] } : { name: entry };
  });
}
```

## Implementation

### 1. `src/db.ts` — CSV parsing + row mapping

Add near `callsToCSV`:

```ts
// RFC4180-ish: handles quoted fields, commas inside quotes, doubled "" escaping.
// No CSV library in this project — kept minimal rather than adding a dependency.
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

const REQUIRED_HEADERS = ["Date", "Unit", "Type", "Mode", "Complaint"];

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
    try {
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
        alertOriented: "", // not in CSV
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
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "parse error"}, skipped.`);
    }
  }
  return { records, errors };
}
```

`parseAge`/`parseMeds`/`parseInterventions` are the three helpers shown above — colocate them in `db.ts` next to `csvToCallRecords`, not exported unless something else ends up needing them.

`alertOriented` has no CSV column at all (never exported) — imported calls always land with it blank. Worth a one-line mention in the "Known limitations" list if this surprises anyone later.

### 2. `src/app/App.tsx` — import handler + state

New state, grouped with the existing Settings-related state (near `showClearDataConfirm`):
```ts
const [importFileName, setImportFileName] = useState<string | null>(null);
const [importPreview, setImportPreview] = useState<Omit<CallRecord, "id">[] | null>(null);
const [importErrors, setImportErrors] = useState<string[]>([]);
const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
```

Handlers:
```ts
function handleImportFileSelected(fileName: string, text: string) {
  const { records, errors } = csvToCallRecords(text);
  setImportFileName(fileName);
  setImportPreview(records);
  setImportErrors(errors);
  setImportSuccessCount(null);
}

async function confirmImport() {
  if (!importPreview || importPreview.length === 0) return;
  await db.calls.bulkAdd(importPreview as CallRecord[]);
  const [updated, all] = await Promise.all([
    db.calls.orderBy("timestamp").reverse().limit(100).toArray(),
    db.calls.toArray(),
  ]);
  setSavedCalls(updated);
  setAllCalls(all);
  setImportSuccessCount(importPreview.length);
  setImportPreview(null);
  setImportFileName(null);
}

function cancelImport() {
  setImportFileName(null);
  setImportPreview(null);
  setImportErrors([]);
}
```
This mirrors the existing `saveCall()`/`confirmDelete()` refresh pattern (`db.calls.orderBy(...).toArray()` twice, `setSavedCalls`/`setAllCalls`) — don't invent a new refresh mechanism.

Pass all of the above down into `<SettingsScreen>` as props, same as the Hospital/Medication/Intervention management props already there.

### 3. `src/app/screens/SettingsScreen.tsx` — UI

New `FormCard` in the `Data` `SLabel` section, placed **above** "Danger Zone" (import is a normal action, not destructive, so it shouldn't visually sit inside/near the red delete-everything card):

```tsx
function ImportCallsCard({ fileName, preview, errors, successCount, onFileSelected, onConfirm, onCancel }: {
  fileName: string | null; preview: Omit<CallRecord, "id">[] | null; errors: string[]; successCount: number | null;
  onFileSelected: (name: string, text: string) => void; onConfirm: () => void; onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(file.name, reader.result as string);
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file later
  }
  return (
    <FormCard accent={HOME_COLOR.p}>
      <CardHead color={HOME_COLOR.p} label="Import Calls" />
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        Restore calls from a CSV file exported by this app. Imported calls are always added as new — nothing existing is overwritten.
      </p>
      <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} style={{ display: "none" }} />
      <button onClick={() => inputRef.current?.click()} style={{ ...primaryBtn, background: HOME_COLOR.p }}>
        Choose CSV File
      </button>

      {errors.length > 0 && (
        <div style={{ fontSize: 12, color: "#D32F2F" }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#0d1117" }}>Found <strong>{preview.length}</strong> call{preview.length === 1 ? "" : "s"} in <em>{fileName}</em>.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 14, fontWeight: 700, color: "#6b7280" }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "#16A34A", fontSize: 14, fontWeight: 700, color: "#fff" }}>Import {preview.length}</button>
          </div>
        </div>
      )}

      {successCount != null && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>Imported {successCount} call{successCount === 1 ? "" : "s"}.</div>
      )}
    </FormCard>
  );
}
```

No modal — everything happens inline in the card (parse → preview → confirm/cancel → success), since this is a lightweight, non-destructive, locally-reversible action (worst case is duplicate calls, deletable individually same as any other call).

## Verification (once implemented)

- `npx tsc --noEmit` and `npm run build`.
- Export current data from the Export screen, then import that exact file from Settings; confirm the call count increases by the expected amount, and spot-check a few calls (vitals, meds with routes, hospital, notes containing a comma) render correctly after import.
- Import a deliberately malformed CSV (wrong/missing headers, a row with too few columns) and confirm a clear inline error instead of a crash or silent garbage import.
- Re-import the same file twice; confirm it creates duplicates rather than erroring or overwriting (expected per the ID-handling decision).
