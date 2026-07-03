import type { CallRecord } from "../db";
import { HOME_COLOR } from "./constants";
import { UNIT_TYPE_ORDER, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from "./shiftStats";

export interface CallOutcomeSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

// Each call is bucketed into exactly one outcome, in priority order, so
// segments always sum to calls.length. "Transported" requires an actual
// hospital on the record; anything left over (not cancelled/refused, no
// hospital marked) is a data-quality gap, not a completed transport.
export function callOutcomeSegments(calls: CallRecord[]): CallOutcomeSegment[] {
  let cancelledEnRoute = 0, cancelledOnScene = 0, refusal = 0, nurseNavigation = 0, transported = 0, unknown = 0;
  for (const call of calls) {
    if (call.callStatus === "cancelled_enroute") cancelledEnRoute++;
    else if (call.callStatus === "cancelled_onscene") cancelledOnScene++;
    else if (call.transportMode === "refusal") refusal++;
    else if (call.transportMode === "nurse_navigation") nurseNavigation++;
    else if (call.hospital) transported++;
    else unknown++;
  }
  return [
    { key: "transported",       label: "Transported",         value: transported,      color: HOME_COLOR.p },
    { key: "cancelled_enroute", label: "Cancelled En Route",  value: cancelledEnRoute, color: "#F59E0B" },
    { key: "refusal",           label: "Refusal",             value: refusal,          color: "#BE123C" },
    { key: "nurse_navigation",  label: "Nurse Navigation",    value: nurseNavigation,  color: "#0D9488" },
    { key: "unknown",           label: "Unknown Disposition", value: unknown,          color: "#9CA3AF" },
    { key: "cancelled_onscene", label: "Cancelled On Scene",  value: cancelledOnScene, color: "#FB923C" },
  ];
}

export interface IvSuccessStats {
  rate: number;
  established: number;
  attempted: number;
}

// Only counts calls where an IV was actually attempted and the established
// outcome was recorded — older records without that field are excluded
// rather than silently treated as failures. Rate is per attempt, not per
// call: a call logged with 2 attempts contributes 2 to the denominator
// even though only 1 successful stick (if established) is possible.
export function ivSuccessStats(calls: CallRecord[]): IvSuccessStats {
  const calledOn = calls.filter(c => c.ivOn && c.ivEstablished !== undefined);
  const established = calledOn.filter(c => c.ivEstablished).length;
  const attempted = calledOn.reduce((sum, c) => sum + (parseInt(c.ivAttempts || "", 10) || 1), 0);
  const rate = attempted ? Math.round((established / attempted) * 100) : 0;
  return { rate, established, attempted };
}

export interface TechedByUnitTypeSegment {
  key: string;
  label: string;
  teched: number;
  total: number;
  pct: number;
  color: string;
}

// Percent of calls teched, grouped by the unit type that ran the call.
// Cancelled calls (en route or on scene) are excluded from both the
// teched count and the total, since the crew never reached a patient.
export function techedByUnitType(calls: CallRecord[]): TechedByUnitTypeSegment[] {
  const counted = calls.filter(c => c.callStatus !== "cancelled_enroute" && c.callStatus !== "cancelled_onscene");
  const totals = new Map<string, number>();
  const teched = new Map<string, number>();
  for (const call of counted) {
    totals.set(call.unitType, (totals.get(call.unitType) ?? 0) + 1);
    if (call.techedCall) teched.set(call.unitType, (teched.get(call.unitType) ?? 0) + 1);
  }
  return UNIT_TYPE_ORDER.map(t => {
    const total = totals.get(t) ?? 0;
    const techedCount = teched.get(t) ?? 0;
    return {
      key: t, label: UNIT_TYPE_LABELS[t],
      teched: techedCount, total,
      pct: total > 0 ? Math.round((techedCount / total) * 100) : 0,
      color: UNIT_TYPE_COLORS[t],
    };
  });
}

export interface HospitalCount {
  hospital: string;
  count: number;
}

// Transported calls only, grouped by hospital, ranked most to least common.
export function hospitalCounts(calls: CallRecord[]): HospitalCount[] {
  const counts = new Map<string, number>();
  for (const call of calls) {
    if (!call.hospital) continue;
    counts.set(call.hospital, (counts.get(call.hospital) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([hospital, count]) => ({ hospital, count }))
    .sort((a, b) => b.count - a.count);
}
