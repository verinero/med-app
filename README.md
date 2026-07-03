# EMS Medical Documentation App

A high-fidelity EMS field documentation PWA built with React + Vite. Runs fully offline on your phone after install.

## Features

- **New Call** — log trauma or medical calls with chief complaint, patient age/sex, vitals, interventions, IV access, and patient history
- **Shift tagging** — every call is tagged to a manually-logged shift; the call's date and unit are always derived from that shift, not entered independently
- **Call Status tags** — mark a call as Cancelled (En Route or On Scene), or Teched, from the call header
- **Acuity** — tag the call as Low Acuity, Emergent, or Critical
- **Transport** — three-tab section: select destination hospital from a dropdown, mark as patient refusal, or refer to nurse navigation. The hospital list is editable in Settings
- **Vitals sliders** — horizontal 5-position sliders for HR, BP, SpO₂, RR, and Glucose (Low → High); tap anywhere on the track or tap a Low/Normal/High label to set a value directly, no drag needed; A&O and GCS at the top
- **Interventions** — oxygen, IV fluids (saline/LR), a customizable medication list (each with a toggle and an administration route — IV/IM/SL/IN/PO/TD), 12-lead ECG, trauma-specific (C-spine, backboard, splinting, bandaging)
- **IV access** — gauge color tiles, L/R side, site dropdown, Established Yes/No toggle, and number of attempts
- **Autocomplete** — chief complaint field suggests from past calls as you type
- **Edit past calls** — tap any call card on the home screen to reopen and edit it; hospital/medication options always reflect what's currently configured in Settings, even for older calls
- **Lock Chart** — locks the call into view-only mode (color-coded by trauma/medical); tap again to unlock and edit; saves lock state with the chart
- **Discard warning** — canceling a call or edit with unsaved changes shows a confirmation sheet; empty/unchanged forms cancel immediately without a prompt
- **Home dashboard** — live stats (calls today, this week, all time; IVs; meds) pulled from the local database
- **Call history** — recent calls list; locked calls show a 🔒 icon; tap to edit, trash to delete
- **Shift management** — a header pill (unit + live elapsed time, if a shift is currently open) opens a bottom sheet to add a new shift (crew, unit type/number, start time, and either an end time or a duration) or browse/edit/delete past shifts from History; drag the sheet's handle down to dismiss
- **Stats screen** — call outcome donut (Transported / Cancelled En Route / Cancelled On Scene / Refusal / Nurse Navigation / Unknown Disposition), most-transported-to hospitals bar chart, IV success rate (shown once at least one IV has been attempted), collapsible read-only shift history, shifts/hours/teched-rate by unit type
- **Settings** — manage the Hospitals and Medications lists (add/delete, each collapsible; deleting one that's used on a saved call warns you first instead of deleting silently), set each medication's default administration route, and Clear All Data (with a confirmation step)
- **Export** — CSV and PDF export of all calls
- **PWA** — installable on iOS/Android, works fully offline via service worker; pinch-zoom is disabled so tapping into a text field doesn't trigger iOS's auto-zoom

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Database | Dexie.js (IndexedDB — unlimited local storage) |
| PDF export | jsPDF |
| Icons | lucide-react |
| Styles | Inline styles (+ Tailwind CSS v4 for base reset) |
| PWA | Manual service worker + Web App Manifest |

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

To install as a PWA: open the app in Safari/Chrome on your phone and use "Add to Home Screen".

## Database

All data is stored locally in IndexedDB via Dexie — no server required. The `calls` table stores every logged call including vitals, interventions, and call status. The `hospitals` and `medications` tables hold the crew-editable option lists used in New Call, seeded with a default list on first launch. Export to CSV or PDF from the Export screen.

## Hospitals & Medications

Both lists start out pre-populated (hospitals with a default set of local facilities, medications with a default set of common EMS drugs) and are fully editable from **Settings**:

- **Add** a hospital or medication with the input at the top of its section.
- **Delete** one with the trash icon on its row. If it's still referenced by a saved call, you'll see a warning naming how many calls use it before you can confirm — deleting never changes those saved calls, it just removes the option going forward.
- Each medication also has a **default administration route** (IV/IM/SL/IN/PO/TD), set from its row in Settings — when you toggle that medication on in a call, it starts on its default route instead of always defaulting to IV.

Changes take effect immediately: opening an older call for editing always shows whatever hospitals/medications are currently configured, not just what existed when that call was first saved.

## Call Status

The new call header supports:

- **Cancelled: En Route** — unit turned around before reaching scene
- **Cancelled: On Scene** — arrived but call cancelled on scene
- **Teched** — call was handled by this crew

Patient disposition (**Refusal**, transport to a hospital, or **Nurse Navigation**) is set in the Transport section of the call form, not the header.

Status tags appear on call cards in the home dashboard and are included in CSV/PDF exports.

## Contributing

See `CLAUDE.md` for architecture notes and the project's decisions log (why things are built the way they are, tracked as changes are made).
