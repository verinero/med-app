import type { UnitTypeSegment } from "../shiftStats";

const GAP_PX = 2;
const HEIGHT = 26;

export function UnitTypeStackedBar({ segments, formatValue }: {
  segments: UnitTypeSegment[]; formatValue?: (v: number) => string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const fmt = formatValue ?? (v => `${v}`);
  const active = segments.filter(s => s.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", height: HEIGHT, borderRadius: HEIGHT / 2, overflow: "hidden", background: "#E2E5EC", gap: total > 0 ? GAP_PX : 0 }}>
        {total === 0 ? null : active.map(seg => (
          <div key={seg.key} title={`${seg.label}: ${fmt(seg.value)} (${Math.round((seg.value / total) * 100)}%)`}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color, height: "100%" }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: "#0d1117" }}>{seg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(seg.value)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", minWidth: 34, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
