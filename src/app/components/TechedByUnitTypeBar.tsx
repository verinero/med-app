import type { TechedByUnitTypeSegment } from "../callStats";

export function TechedByUnitTypeBar({ segments }: { segments: TechedByUnitTypeSegment[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {segments.map(seg => (
        <div key={seg.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: "#0d1117" }}>{seg.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>{seg.teched} of {seg.total}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", minWidth: 34, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{seg.pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#E2E5EC", overflow: "hidden" }}>
            <div style={{ width: `${seg.pct}%`, height: "100%", background: seg.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
