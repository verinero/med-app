import { Lock, Trash2 } from "lucide-react";
import { TH } from "../constants";
import type { CallRecord } from "../../db";

export function CallListItem({ call, onOpen, onDelete }: {
  call: CallRecord; onOpen: () => void; onDelete: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: `1.5px solid ${call.locked ? "#D1D5DB" : "#E2E5EC"}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: TH[call.mode].p, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0d1117", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {call.complaint || "No complaint recorded"}
            </span>
            {call.locked && <Lock size={11} color="#9ca3af" />}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
            Unit {call.unitType}{call.unitNum} · {call.date}{call.age ? ` · ${call.age}` : ""}{call.hospital ? ` → ${call.hospital}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
        {call.callStatus === "cancelled_enroute" && <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Cxl En Route</span>}
        {call.callStatus === "cancelled_onscene" && <span style={{ background: "#FFEDD5", color: "#C2410C", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Cxl On Scene</span>}
        {call.transportMode === "refusal" && <span style={{ background: "#FFE4E6", color: "#BE123C", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Refusal</span>}
        {call.transportMode === "nurse_navigation" && <span style={{ background: "#CCFBF1", color: "#0D9488", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Nurse Nav</span>}
        <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
          <Trash2 size={14} color="#D1D5DB" />
        </button>
      </div>
    </div>
  );
}
