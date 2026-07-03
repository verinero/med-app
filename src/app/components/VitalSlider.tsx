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
          className="vital-slider"
          style={{
            "--thumb-color": thumbColor,
            background: trackBg,
            opacity: unset ? 0.45 : 1,
          } as React.CSSProperties}
        />
        {/* Low at left (0%), Normal at center (50%), High at right (100%) */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(1) }}>Low</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(3) }}>Normal</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(5) }}>High</span>
        </div>
      </div>
    </div>
  );
}
