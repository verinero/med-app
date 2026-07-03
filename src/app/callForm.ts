import type { CallRecord } from "../db";
import type { Mode, LR, VitalLevel } from "./constants";

export function dateStrFor(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function dateStr() {
  return dateStrFor(Date.now());
}
export function sevenDaysAgo() { return Date.now() - 7 * 24 * 60 * 60 * 1000; }

// ── Blank call form ───────────────────────────────────────────
export function blankForm() {
  return {
    mode: "medical" as Mode,
    ageYears: "", ageMonths: "", sex: "", complaint: "", activeChip: "",
    showComplaintSuggest: false,
    interventions: [] as { name: string; note?: string }[],
    expandedInterventions: [] as string[],
    oxyOn: false, oxyOpen: false, oxyType: "Nasal Cannula", oxyLiters: 2,
    medOn: false, medOpen: false, salineAmt: 0, lrAmt: 0,
    meds: [] as { name: string; route: string }[],
    ivOn: false, gauge: "18G", ivLR: "R" as LR, ivSite: "AC", showSite: false,
    ivEstablished: true, ivAttempts: "",
    hr: "" as VitalLevel, bp: "" as VitalLevel, spo2: "" as VitalLevel,
    rr: "" as VitalLevel, glucose: "" as VitalLevel,
    gcs: "",
    alertOriented: [] as string[],
    allergies: "", medHistory: "", notes: "",
    callStatus: "" as "" | "cancelled_enroute" | "cancelled_onscene",
    techedCall: false,
    acuity: "" as "" | "low" | "emergent" | "critical",
    hospital: "",
    transportMode: "hospital" as "hospital" | "refusal" | "nurse_navigation",
    shiftId: undefined as number | undefined,
  };
}

export type CallForm = ReturnType<typeof blankForm>;
export type SetFld = <K extends keyof CallForm>(k: K, v: CallForm[K]) => void;

// ── Load an existing call into the form ──────────────────────
export function callToForm(call: CallRecord): CallForm {
  return {
    mode: call.mode,
    ageYears: call.ageYears || "", ageMonths: call.ageMonths || "",
    sex: call.sex, complaint: call.complaint, activeChip: "",
    showComplaintSuggest: false,
    interventions: call.interventions ?? [],
    expandedInterventions: [],
    oxyOn: call.oxyOn, oxyOpen: call.oxyOn, oxyType: call.oxyType, oxyLiters: call.oxyLiters,
    medOn: call.medOn, medOpen: call.medOn, salineAmt: call.salineAmt, lrAmt: call.lrAmt,
    meds: call.meds ?? [],
    ivOn: call.ivOn, gauge: call.gauge, ivLR: (call.ivLR || "R") as "L" | "R", ivSite: call.ivSite, showSite: false,
    ivEstablished: call.ivEstablished ?? true, ivAttempts: call.ivAttempts || "",
    hr: (call.hr || "") as VitalLevel, bp: (call.bp || "") as VitalLevel,
    spo2: (call.spo2 || "") as VitalLevel, rr: (call.rr || "") as VitalLevel,
    glucose: (call.glucose || "") as VitalLevel, gcs: call.gcs,
    alertOriented: call.alertOriented ? call.alertOriented.split(",").filter(Boolean) : [],
    allergies: call.allergies, medHistory: call.medHistory, notes: call.notes,
    callStatus: (call.callStatus || "") as "" | "cancelled_enroute" | "cancelled_onscene",
    techedCall: call.techedCall ?? false,
    acuity: (call.acuity || "") as "" | "low" | "emergent" | "critical",
    hospital: call.hospital || "",
    transportMode: (call.transportMode || "hospital") as "hospital" | "refusal" | "nurse_navigation",
    shiftId: call.shiftId,
  };
}
