import type { CallRecord } from "../db";
import { HOME_COLOR } from "./constants";

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
  let cancelledEnRoute = 0, cancelledOnScene = 0, refusal = 0, transported = 0, unknown = 0;
  for (const call of calls) {
    if (call.callStatus === "cancelled_enroute") cancelledEnRoute++;
    else if (call.callStatus === "cancelled_onscene") cancelledOnScene++;
    else if (call.transportMode === "refusal") refusal++;
    else if (call.hospital) transported++;
    else unknown++;
  }
  return [
    { key: "transported",       label: "Transported",         value: transported,      color: HOME_COLOR.p },
    { key: "cancelled_enroute", label: "Cancelled En Route",  value: cancelledEnRoute, color: "#F59E0B" },
    { key: "refusal",           label: "Refusal",             value: refusal,          color: "#BE123C" },
    { key: "unknown",           label: "Unknown Disposition", value: unknown,          color: "#9CA3AF" },
    { key: "cancelled_onscene", label: "Cancelled On Scene",  value: cancelledOnScene, color: "#FB923C" },
  ];
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
