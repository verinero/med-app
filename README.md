# EMS Medical Documentation App

A high-fidelity EMS field documentation PWA built with React + Vite. Runs fully offline on your phone after install.

## Features

- **New Call** — log trauma or medical calls with chief complaint, patient age/sex, vitals, interventions, IV access, and patient history
- **Call Status tags** — mark a call as Cancelled (En Route or On Scene) from the call header
- **Transport** — two-tab section: select destination hospital from a dropdown, or mark as patient refusal
- **Vitals sliders** — horizontal 5-position sliders for HR, BP, SpO₂, RR, and Glucose (Low → High); A&O and GCS at the top
- **Interventions** — oxygen, medications (saline/LR/Zofran/Toradol), 12-lead ECG, trauma-specific (C-spine, backboard, splinting, bandaging)
- **IV access** — gauge color tiles, L/R side, site dropdown
- **Autocomplete** — chief complaint field suggests from past calls as you type
- **Edit past calls** — tap any call card on the home screen to reopen and edit it
- **Lock Chart** — locks the call into view-only mode (color-coded by trauma/medical); tap again to unlock and edit; saves lock state with the chart
- **Discard warning** — canceling a call or edit with unsaved changes shows a confirmation sheet; empty/unchanged forms cancel immediately without a prompt
- **Home dashboard** — live stats (calls today, this week, all time; IVs; meds) pulled from the local database
- **Call history** — recent calls list; locked calls show a 🔒 icon; tap to edit, trash to delete
- **Export** — CSV and PDF export of all calls
- **PWA** — installable on iOS/Android, works fully offline via service worker

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

All data is stored locally in IndexedDB via Dexie — no server required. The `calls` table stores every logged call including vitals, interventions, and call status. Export to CSV or PDF from the Export screen.

## Call Status

Each call can be tagged with one of three statuses from the new call header:

- **Cancelled: En Route** — unit turned around before reaching scene
- **Cancelled: On Scene** — arrived but call cancelled on scene
- **Refusal** — patient refused care/transport

Status tags appear on call cards in the home dashboard and are included in CSV/PDF exports.
