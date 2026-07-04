# CLAUDE.md

Guidance for Claude Code (and future contributors) working in this repo.

## Project

EMS field documentation PWA. React + TypeScript + Vite, offline-first via Dexie (IndexedDB). No backend — all data is local to the device. See README.md for the user-facing feature list and setup instructions.

## Architecture

- `src/db.ts` — Dexie schema (`CallRecord`, `Shift`, `Settings`, `Hospital`, `Medication`, `InterventionDef`) and CSV export. This is the source of truth for what a saved call looks like. Schema is versioned (`this.version(N).stores(...)`) — adding a table or index means a new version block, not editing an existing one.
- `src/app/callForm.ts` — `CallForm` type (the in-progress/editable shape) and conversions: `blankForm()` (new call), `callToForm()` (load a `CallRecord` for editing). Adding a field to a call means touching both this file and `db.ts`.
- `src/app/App.tsx` — top-level state, screen routing, `saveCall()` (the only place `CallForm` is written back into a `CallRecord`).
- `src/app/screens/` — top-level screens (`HomeScreen`, `NewCallScreen`, `StatsScreen`, `ExportScreen`, `SettingsScreen`).
- `src/app/screens/sections/` — the card sections composed inside `NewCallScreen` (vitals, interventions, IV access, transport, acuity, notes, etc.). Each section takes `{ f: CallForm, setFld: SetFld, c: ThemeColors }` and is self-contained.
- `src/app/components/` — shared UI primitives (`FormCard`, `CardHead`, modals, chart components).
- `src/app/callStats.ts` / `shiftStats.ts` — derived stats for the Home and Stats screens.
- **Shifts** are manually logged, not live-tracked: `src/app/shiftForm.ts` (`ShiftDraft`, `blankShiftDraft()`, datetime-local conversions), `src/app/components/ShiftManagerModal.tsx` (the Add/History bottom sheet — drag-to-dismiss via the handle, both tabs grid-stacked to the same height so switching tabs doesn't resize the sheet), `src/app/components/ShiftPill.tsx` (single header pill showing unit + live elapsed time if a shift is open). A call's `date`/`unitNum`/`unitType` are always derived from its tagged shift (`f.shiftId` → `shifts.find(...)`), never stored independently on the form.
- **Hospitals, Medications, and (non-fixed) Interventions are user-editable lists, not constants.** All three live in dedicated Dexie tables (`db.hospitals`, `db.medications`, `db.interventions`), seeded once on first load from `HOSPITALS`/`DEFAULT_MEDS`/`DEFAULT_INTERVENTIONS` in `constants.ts`, then managed entirely from `SettingsScreen.tsx` (add/delete, CRUD flows mirrored across all three). `App.tsx` holds them as top-level state and passes the *live* array down into `NewCallScreen` every render — a `CallForm` never freezes a copy of these lists, so editing an older call always shows whatever hospitals/medications/interventions currently exist, not what existed when that call was first saved.
- **Oxygen and Medication are NOT part of the `interventions` table** — they're fixed, always-present rows hardcoded directly in `InterventionsCard.tsx` with their own dedicated sub-UI (O2 type/liters; saline/LR/medication list), because their complexity doesn't fit the generic toggle+note model. `SettingsScreen.tsx`'s "Manage Interventions" shows them as static, non-deletable `LockedInterventionRow`s purely for user communication ("these are always included") — deleting them isn't possible because they were never DB rows to begin with, so there's nothing to delete.
- **`InterventionDef` (`db.interventions`) is scoped per mode** (`"trauma" | "medical"`), with its own `order` field for manual reordering (swap-with-adjacent-sibling, no drag-and-drop lib) and a per-definition `notesEnabled` flag that adds a notes textarea to that intervention's row in the call form when toggled on. `CallForm`/`CallRecord.interventions` is `{ name: string; note?: string }[]` — a flat list of whichever definitions are currently toggled on for that call, replacing the old fixed `tCspine`/`tBackboard`/`tSplint`/`tBandage`/`leadOn`/`leadInterp` fields (kept on `CallRecord` as optional/legacy, unwritten-but-readable, exactly like the `zofran`/`toradol` precedent below). `interventionsSummary()` in `db.ts` renders either the new field or falls back to the legacy booleans for old records, feeding a single "Interventions" CSV column and the PDF export.

### Deleting a hospital or medication

Both go through a shared pattern in `App.tsx`: `request…()` sets a `delete…Target` id, `confirm…()` performs the actual `db.…delete()`. Before confirming, a usage count is computed against `allCalls` (`c.hospital === name` / `c.meds?.some(m => m.name === name)`) and, if non-zero, swapped into `DeleteModal`'s `message` prop as an explicit warning naming how many saved calls reference it — this is intentional, not incidental: deleting from the list must never silently drop context about calls that already used it. Deleting never mutates historical `CallRecord` data (`hospital` is a free string, `meds` entries are copied by value at save time), it only removes the option from future calls.

### Adding a new field to the call form

1. Add it to `CallRecord` in `src/db.ts`.
2. Add it to `blankForm()` and `callToForm()` in `src/app/callForm.ts`.
3. Wire it into the `record` object in `saveCall()` in `src/app/App.tsx`.
4. Build a section component in `src/app/screens/sections/` and render it in `NewCallScreen.tsx`.
5. Include it in CSV/PDF export if it should be reportable (`src/db.ts` `callsToCSV`, `src/app/screens/ExportScreen.tsx`).

Styling is inline (no CSS framework beyond a Tailwind reset) — match the existing pattern in sibling section files (tab toggles, `FormCard`/`CardHead` wrappers) rather than introducing new patterns.

## Decisions Log

Append new entries at the top, newest first. Keep each entry to what was decided and why — not a full changelog (git history covers that).

**Every decision made while working in this repo must be recorded here as it happens** — not just architectural ones. This especially includes any design choice that reverses or contradicts what was already in place (e.g. changing a convention documented above, dropping a pattern a prior entry established). When in doubt about whether something counts as "a decision," record it.

- **2026-07-03 — "Clear All Data" now also wipes Hospitals, Medications, and Interventions, then reseeds them from the built-in defaults (`HOSPITALS`/`DEFAULT_MEDS`/`DEFAULT_INTERVENTIONS`).** Reverses the prior behavior where clearing data only touched `calls`/`shifts`/`settings` and silently left any user-added/edited hospitals, medications, and interventions in place — "Clear All Data" is meant to return the device to a fresh-install state, and those lists are user-editable data too, not fixed config. `confirmClearData()` in `App.tsx` clears then immediately re-seeds (rather than leaving the tables empty until next app load) so in-memory state and DB stay in sync without a reload.
- **2026-07-03 — Data model: Hospitals, Medications, and non-fixed Interventions moved from hardcoded `constants.ts` arrays to editable Settings-managed Dexie tables.** Seeded once from the old constants, then CRUD'd entirely from `SettingsScreen.tsx`. Medications gained per-call routes (`meds: {name, route}[]`) and a per-medication `defaultRoute`; Interventions became a per-mode, reorderable, notes-optional list. In every case the old fixed fields (`zofran`/`toradol`, `tCspine`/`tBackboard`/`tSplint`/`tBandage`, `leadOn`/`leadInterp`) stay on `CallRecord` as optional/unwritten legacy fields for CSV/PDF fallback on pre-migration records — deleting historical data is never allowed. Deleting a hospital/medication still referenced by a saved call shows a usage-count warning instead of deleting silently.
- **2026-07-03 — Bug fixes: intervention seed de-dupe, donut chart 100%-segment fallback.** Intervention seeding now de-dupes by `mode+name` after every load (fixes React StrictMode double-seeding); `CallOutcomeDonut` renders a plain `<circle>` when one segment is 100% (an SVG arc can't sweep a full 360°).
- **2026-07-03 — New tracked fields: IV establishment/attempts, acuity, teched-call flag.** `ivEstablished`/`ivAttempts` feed a new per-attempt (not per-call) IV success-rate stat, shown only once ≥1 attempt exists. `acuity` (low/emergent/critical) added between Notes and Transport, unvalidated/optional. `techedCall` toggle added to the New Call header, feeding a "Teched by Unit Type" stat (grouped under the existing "Unit Type" section, cancelled calls excluded).
- **2026-07-03 — UI/UX conventions:** unit labels render without a dash (`B12` not `B-12`); viewport pinch-zoom disabled to stop iOS auto-zoom on the app's compact 13–14px inputs; vitals sliders support tap-to-set with a filled pill on the active Low/Normal/High label (since "unset" and "Normal" otherwise look identical); `ShiftManagerModal` supports drag-to-dismiss with both tabs grid-stacked to the same height so switching tabs never resizes the sheet; Shift History rows ordered date · unit · start time · crew; medication toggle pills are fixed-width (104px) with ellipsis truncation; Settings' Hospitals/Medications sections are collapsible, default closed.
- **2026-07-03 — Removed dead `getSetting`/`setSetting` helpers from `db.ts`.** Leftover from the old unit-preference feature folded into shifts; nothing called them.
- **Transport section supports three modes:** `hospital` (destination dropdown), `refusal`, `nurse_navigation`. `hospital` field is cleared when mode is `refusal`.
- **All persistence is local (Dexie/IndexedDB).** No server sync — export via CSV/PDF is the only way data leaves the device. Keep it that way unless explicitly asked to add a backend.

## Workflow notes

- Run `npx tsc --noEmit` before considering a change done — this project has no test suite, so the type checker is the main safety net.
- `npm run build` (vite build) should also succeed before shipping a change.
- Do not run `git commit` (or push) in this repo — the user commits their own changes. Leave changes staged/unstaged in the working tree and let the user review and commit them.
