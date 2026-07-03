import { HOME_COLOR } from "../constants";
import type { HospitalCount } from "../callStats";

export function HospitalBarChart({ data }: { data: HospitalCount[] }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px 10px", color: "#9ca3af" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>No transports recorded yet</div>
      </div>
    );
  }

  const max = data[0].count;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map(({ hospital, count }) => {
        const pct = Math.max((count / max) * 100, 4);
        return (
          <div key={hospital} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span title={hospital} style={{ fontSize: 12, fontWeight: 600, color: "#0d1117", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hospital}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{count}</span>
            </div>
            <div style={{ background: "#F2F3F7", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: HOME_COLOR.p, borderRadius: 6 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
