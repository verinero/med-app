import { SEG_COLORS, type VitalLevel } from "../constants";
import { microLabel } from "../styles";

export function VitalSlider({ label, value, onChange }: {
  label: string; value: VitalLevel; onChange: (v: VitalLevel) => void;
}) {
  // min=1,max=5 so positions 1–5 sit at 0%,25%,50%,75%,100% of the track
  // value="" = unset (gray, shown at midpoint visually)
  const unset = value === "";
  const num = unset ? 3 : parseInt(value);
  const thumbColor = unset ? "#C4C8D0" : SEG_COLORS[num - 1];
  const pct = ((num - 1) / 4) * 100;
  const trackBg = unset
    ? "#E8EAED"
    : `linear-gradient(to right, ${thumbColor} ${pct}%, #E8EAED ${pct}%)`;

  const activeColor = (pos: number) => (!unset && num === pos) ? SEG_COLORS[pos - 1] : "#C4C8D0";

  // Let a single tap anywhere on the track jump straight to that value,
  // instead of requiring a drag from the thumb.
  function snapToPointer(e: React.PointerEvent<HTMLInputElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onChange(String(Math.round(ratio * 4) + 1) as VitalLevel);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Tap label to clear */}
      <span
        onClick={() => onChange("")}
        style={{ ...microLabel, minWidth: 52, fontSize: 10, cursor: "pointer" }}
        title="Tap to clear"
      >{label}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <input
          type="range" min={1} max={5} step={1} value={num}
          onChange={e => onChange(e.target.value as VitalLevel)}
          onPointerDown={snapToPointer}
          className="vital-slider"
          style={{
            "--thumb-color": thumbColor,
            background: trackBg,
            opacity: unset ? 0.45 : 1,
          } as React.CSSProperties}
        />
        {/* Low at left (0%), Normal at center (50%), High at right (100%) — tappable.
            Active one gets a filled pill, since the thumb alone doesn't move
            when landing on Normal (already visually centered when unset). */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span onClick={() => onChange("1")} style={{
            fontSize: 9, fontWeight: 700, cursor: "pointer", padding: "2px 6px", borderRadius: 100,
            color: !unset && num === 1 ? "#fff" : activeColor(1),
            background: !unset && num === 1 ? SEG_COLORS[0] : "transparent",
            transition: "background 0.15s, color 0.15s",
          }}>Low</span>
          <span onClick={() => onChange("3")} style={{
            fontSize: 9, fontWeight: 700, cursor: "pointer", padding: "2px 6px", borderRadius: 100,
            color: !unset && num === 3 ? "#fff" : activeColor(3),
            background: !unset && num === 3 ? SEG_COLORS[2] : "transparent",
            transition: "background 0.15s, color 0.15s",
          }}>Normal</span>
          <span onClick={() => onChange("5")} style={{
            fontSize: 9, fontWeight: 700, cursor: "pointer", padding: "2px 6px", borderRadius: 100,
            color: !unset && num === 5 ? "#fff" : activeColor(5),
            background: !unset && num === 5 ? SEG_COLORS[4] : "transparent",
            transition: "background 0.15s, color 0.15s",
          }}>High</span>
        </div>
      </div>
    </div>
  );
}
