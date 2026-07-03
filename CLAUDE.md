# CLAUDE.md

Guidance for Claude Code (and future contributors) working in this repo.

## Project

EMS field documentation PWA. React + TypeScript + Vite, offline-first via Dexie (IndexedDB). No backend — all data is local to the device. See README.md for the user-facing feature list and setup instructions.

## Architecture

- `src/db.ts` — Dexie schema (`CallRecord`, `Shift`, `Settings`) and CSV export. This is the source of truth for what a saved call looks like.
- `src/app/callForm.ts` — `CallForm` type (the in-progress/editable shape) and conversions: `blankForm()` (new call), `callToForm()` (load a `CallRecord` for editing). Adding a field to a call means touching both this file and `db.ts`.
- `src/app/App.tsx` — top-level state, screen routing, `saveCall()` (the only place `CallForm` is written back into a `CallRecord`).
- `src/app/screens/` — top-level screens (`HomeScreen`, `NewCallScreen`, `StatsScreen`, `ExportScreen`, `SettingsScreen`).
- `src/app/screens/sections/` — the card sections composed inside `NewCallScreen` (vitals, interventions, IV access, transport, acuity, notes, etc.). Each section takes `{ f: CallForm, setFld: SetFld, c: ThemeColors }` and is self-contained.
- `src/app/components/` — shared UI primitives (`FormCard`, `CardHead`, modals, chart components).
- `src/app/callStats.ts` / `shiftStats.ts` — derived stats for the Home and Stats screens.
- **Shifts** are manually logged, not live-tracked: `src/app/shiftForm.ts` (`ShiftDraft`, `blankShiftDraft()`, datetime-local conversions), `src/app/components/ShiftManagerModal.tsx` (the Add/History bottom sheet — drag-to-dismiss via the handle, both tabs grid-stacked to the same height so switching tabs doesn't resize the sheet), `src/app/components/ShiftPill.tsx` (single header pill showing unit + live elapsed time if a shift is open). A call's `date`/`unitNum`/`unitType` are always derived from its tagged shift (`f.shiftId` → `shifts.find(...)`), never stored independently on the form.

### Adding a new field to the call form

1. Add it to `CallRecord` in `src/db.ts`.
2. Add it to `blankForm()` and `callToForm()` in `src/app/callForm.ts`.
3. Wire it into the `record` object in `saveCall()` in `src/app/App.tsx`.
4. Build a section component in `src/app/screens/sections/` and render it in `NewCallScreen.tsx`.
5. Include it in CSV/PDF export if it should be reportable (`src/db.ts` `callsToCSV`, `src/app/screens/ExportScreen.tsx`).

Styling is inline (no CSS framework beyond a Tailwind reset) — match the existing pattern in sibling section files (tab toggles, `FormCard`/`CardHead` wrappers) rather than introducing new patterns.

## Decisions Log

Append new entries at the top, newest first. Keep each entry to what was decided and why — not a full changelog (git history covers that).

- **2026-07-03 — `CallOutcomeDonut` falls back to a plain `<circle>` when one segment is 100%.** An SVG arc can't draw a full 360° sweep — the start and end points land on the same coordinate, so the browser renders nothing. Only shows up when every call so far shares one outcome (e.g. an all-`Unknown Disposition` dataset), which made it look like the whole chart was broken.
- **2026-07-03 — Vitals sliders: tap anywhere on the track, or tap the Low/Normal/High label, to set a value — no drag required.** The active Low/Normal/High label gets a filled color pill (not just a text-color change), because the default "unset" position renders at the same visual midpoint as "Normal" — without the pill, selecting Normal from an untouched slider looked like nothing had happened (thumb doesn't move, only a subtle opacity/color shift).
- **2026-07-03 — `ShiftManagerModal` sheet supports drag-to-dismiss and both tabs render at the same height.** Dragging the handle down past ~100px closes the sheet (snaps back otherwise). The Add and History tab contents are both mounted at all times in a CSS grid stack (`gridArea: "1 / 1"`, inactive one `visibility: hidden`) so the sheet's height is always the taller of the two — conditionally rendering only the active tab caused the sheet to resize/jump when switching tabs.
- **2026-07-03 — IV Access records `ivEstablished` (bool) and `ivAttempts` (string count) per call.** New "Established?" Yes/No toggle and "Attempts" number input in `IvAccessCard`, both disabled until `ivOn` is true. Feeds `ivSuccessStats()` in `callStats.ts`.
- **2026-07-03 — New Stats section "IV Access → Success Rate", only rendered when at least one IV was attempted.** Guards on `ivStats.attempted > 0` in `StatsScreen.tsx` rather than always showing a 0%/empty card — there's nothing meaningful to report until a crew has actually attempted an IV.
- **2026-07-03 — Removed dead `getSetting`/`setSetting` helpers from `db.ts`.** Leftover from the old unit-preference feature that got folded into shifts; nothing called them. The `settings` table itself stays (used by Settings → Clear All Data).
- **2026-07-03 — IV success rate is per-attempt, not per-call.** `ivSuccessStats()` sums `ivAttempts` (defaulting to 1 when blank) across calls as the denominator, so a call logged with 2 attempts and an established line counts as 1 of 2 (50%), not 1 of 1 (100%).
- **2026-07-03 — "Teched by Unit Type" card moved under the "Unit Type" `SLabel`, dropped its own header.** It's grouped with "Shifts by Unit Type" / "Hours by Unit Type" as a third card under the same section rather than getting its own top-level "Teched Calls" label.
- **2026-07-03 — "Teched by Unit Type" stats section added below Unit Type.** New `techedByUnitType()` in `callStats.ts` groups by unit type (B/IM/AM, constants now exported from `shiftStats.ts`) and computes the % of calls tagged `techedCall`. Cancelled calls (en route/on scene) are excluded from both numerator and denominator. Rendered with a new `TechedByUnitTypeBar` component — a per-row progress bar rather than `UnitTypeStackedBar`'s shared stacked bar, since each unit type's rate is independent and the values don't sum to a meaningful total.
- **2026-07-03 — Acuity section added between Notes and Transport.** New `acuity` field (`"" | "low" | "emergent" | "critical"`) on `CallForm`/`CallRecord`, rendered as a 3-way tab toggle styled after `TransportCard`. No validation/requirement enforced — acuity can be left unset.
- **2026-07-03 — "Teched Call" toggle added to the New Call header.** Simple boolean flag (`techedCall`) rendered as a pill next to the date, using the same pill styling as the Cancelled status tags.
- **Transport section supports three modes:** `hospital` (destination dropdown), `refusal`, `nurse_navigation`. `hospital` field is cleared when mode is `refusal`.
- **All persistence is local (Dexie/IndexedDB).** No server sync — export via CSV/PDF is the only way data leaves the device. Keep it that way unless explicitly asked to add a backend.

## Workflow notes

- Run `npx tsc --noEmit` before considering a change done — this project has no test suite, so the type checker is the main safety net.
- `npm run build` (vite build) should also succeed before shipping a change.
