import type { ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import type { ShiftSummary } from "../../shiftStats";
import { formatDuration } from "../../shiftStats";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { microLabel } from "../../styles";

function formatShiftDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shiftOptionLabel(s: ShiftSummary) {
  const dur = s.endTime ? formatDuration(s.endTime - s.startTime) : "in progress";
  return `${formatShiftDate(s.startTime)} · ${s.unitType}-${s.unitNum}${s.crew ? ` · ${s.crew}` : ""} (${dur})`;
}

export function ShiftTagCard({ f, setFld, c, shifts }: {
  f: CallForm; setFld: SetFld; c: ThemeColors; shifts: ShiftSummary[];
}) {
  const tagged = shifts.find(s => s.id === f.shiftId);

  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Shift" />
      <div>
        <span style={{ ...microLabel, display: "block", marginBottom: 6 }}>TAGGED TO</span>
        <select
          value={f.shiftId ?? ""}
          onChange={e => setFld("shiftId", e.target.value ? Number(e.target.value) : undefined)}
          style={{
            width: "100%", appearance: "none", WebkitAppearance: "none",
            background: `#F8F9FC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center`,
            border: `1.5px solid ${f.shiftId ? c.p + "66" : "#E2E5EC"}`,
            borderRadius: 12, padding: "11px 36px 11px 13px",
            fontSize: 14, fontWeight: f.shiftId ? 600 : 400,
            color: f.shiftId ? "#0d1117" : "#A0A6B4",
            outline: "none", cursor: "pointer",
          }}
        >
          <option value="">No shift tagged</option>
          {shifts.map(s => (
            <option key={s.id} value={s.id}>{shiftOptionLabel(s)}</option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          {tagged
            ? `Date and unit for this call come from this shift: ${formatShiftDate(tagged.startTime)} · ${tagged.unitType}-${tagged.unitNum}`
            : "Date and unit will be blank until this call is tagged to a shift."}
        </div>
      </div>
    </FormCard>
  );
}
