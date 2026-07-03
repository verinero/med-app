import type { CallRecord, Shift } from "../db";

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export interface ShiftSummary {
  id: number;
  startTime: number;
  endTime?: number;
  crew: string;
  unitType: string;
  unitNum: string;
  callCount: number;
}

// Most recent shift first; call counts come from CallRecord.shiftId.
export function shiftSummaries(shifts: Shift[], calls: CallRecord[]): ShiftSummary[] {
  return shifts
    .filter((s): s is Shift & { id: number } => s.id != null)
    .map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      crew: s.crew,
      unitType: s.unitType,
      unitNum: s.unitNum,
      callCount: calls.filter(c => c.shiftId === s.id).length,
    }))
    .sort((a, b) => b.startTime - a.startTime);
}

export interface UnitTypeSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export const UNIT_TYPE_ORDER = ["B", "IM", "AM"] as const;
export const UNIT_TYPE_LABELS: Record<string, string> = {
  B: "Basic (B)",
  IM: "Intermediate (IM)",
  AM: "Advanced (AM)",
};
export const UNIT_TYPE_COLORS: Record<string, string> = {
  B: "#7B1FA2",
  IM: "#0D9488",
  AM: "#4338CA",
};

// Number of shifts logged per unit type (includes in-progress shifts).
export function shiftsByUnitType(shifts: Shift[]): UnitTypeSegment[] {
  const counts = new Map<string, number>();
  for (const s of shifts) counts.set(s.unitType, (counts.get(s.unitType) ?? 0) + 1);
  return UNIT_TYPE_ORDER.map(t => ({
    key: t, label: UNIT_TYPE_LABELS[t], value: counts.get(t) ?? 0, color: UNIT_TYPE_COLORS[t],
  }));
}

// Hours worked per unit type, from completed shifts only (endTime required).
export function hoursByUnitType(shifts: Shift[]): UnitTypeSegment[] {
  const hours = new Map<string, number>();
  for (const s of shifts) {
    if (s.endTime == null) continue;
    hours.set(s.unitType, (hours.get(s.unitType) ?? 0) + (s.endTime - s.startTime) / 3600000);
  }
  return UNIT_TYPE_ORDER.map(t => ({
    key: t, label: UNIT_TYPE_LABELS[t], value: Math.round((hours.get(t) ?? 0) * 10) / 10, color: UNIT_TYPE_COLORS[t],
  }));
}
