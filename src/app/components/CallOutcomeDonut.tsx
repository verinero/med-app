import type { CallOutcomeSegment } from "../callStats";
import { microLabel } from "../styles";

const SIZE = 136;
const CENTER = SIZE / 2;
const RADIUS = 50;
const STROKE = 20;
const GAP_PX = 3;

function polarToCartesian(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + RADIUS * Math.cos(rad), y: CENTER + RADIUS * Math.sin(rad) };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(endAngle);
  const end = polarToCartesian(startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function CallOutcomeDonut({ total, segments }: { total: number; segments: CallOutcomeSegment[] }) {
  const active = segments.filter(s => s.value > 0);
  const gapDeg = (GAP_PX / (2 * Math.PI * RADIUS)) * 360;

  let cursor = 0;
  const arcs = active.map(seg => {
    const sweep = (seg.value / total) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const inset = active.length > 1 ? gapDeg / 2 : 0;
    return { seg, start: start + inset, end: end - inset };
  });

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {total === 0 ? (
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#E2E5EC" strokeWidth={STROKE} />
          ) : active.length === 1 ? (
            // A single 100% segment is a full 360° sweep — an SVG arc can't draw
            // that (start/end points coincide, so browsers render nothing), so
            // fall back to a plain circle in that one-segment case.
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={active[0].color} strokeWidth={STROKE}>
              <title>{active[0].label}: {active[0].value} (100%)</title>
            </circle>
          ) : (
            arcs.map(({ seg, start, end }) => (
              <path key={seg.key} d={describeArc(start, end)} fill="none" stroke={seg.color} strokeWidth={STROKE} strokeLinecap="butt">
                <title>{seg.label}: {seg.value} ({Math.round((seg.value / total) * 100)}%)</title>
              </path>
            ))
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#0d1117", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1 }}>{total}</span>
          <span style={{ ...microLabel, marginTop: 4, fontSize: 9 }}>Calls</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
        {segments.map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: "#0d1117" }}>{seg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>{seg.value}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", minWidth: 34, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
