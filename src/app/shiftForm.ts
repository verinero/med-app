import type { UType } from "./constants";

export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): number {
  return new Date(value).getTime();
}

export function blankShiftDraft() {
  return {
    crew: "",
    unitType: "B" as UType,
    unitNum: "12",
    start: toDatetimeLocalValue(Date.now()),
    endMode: "duration" as "time" | "duration",
    end: "",
    durationHours: "",
  };
}

export type ShiftDraft = ReturnType<typeof blankShiftDraft>;
export type SetShiftFld = <K extends keyof ShiftDraft>(k: K, v: ShiftDraft[K]) => void;
