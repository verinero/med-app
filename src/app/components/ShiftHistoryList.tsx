import { Trash2 } from "lucide-react";
import type { ShiftSummary } from "../shiftStats";
import { formatDuration } from "../shiftStats";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ShiftHistoryList({ shifts, onSelect, onDelete }: {
  shifts: ShiftSummary[]; onSelect?: (id: number) => void; onDelete?: (id: number) => void;
}) {
  if (shifts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px 10px", color: "#9ca3af" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>No shifts logged yet</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {shifts.map(s => (
        <div key={s.id} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2",
        }}>
          <button
            onClick={onSelect ? () => onSelect(s.id) : undefined}
            disabled={!onSelect}
            style={{
              flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "none", border: "none", padding: 0, textAlign: "left",
              cursor: onSelect ? "pointer" : "default",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0d1117" }}>
                {formatDate(s.startTime)} · {s.unitType}-{s.unitNum}{s.crew ? ` · ${s.crew}` : ""}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                {s.endTime ? formatDuration(s.endTime - s.startTime) : "In progress"} · {s.callCount} call{s.callCount === 1 ? "" : "s"}
              </div>
            </div>
            {!s.endTime && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0, marginLeft: 8 }} />}
          </button>
          {onDelete && (
            <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0 }}>
              <Trash2 size={14} color="#D1D5DB" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
