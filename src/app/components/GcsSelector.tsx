import type { ThemeColors } from "../constants";
import { microLabel } from "../styles";

const GAP = 6;

export function GcsSelector({ label, value, onChange, options, maxOptions, c }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: number; description: string }[]; maxOptions: number; c: ThemeColors;
}) {
  const selected = options.find(o => String(o.value) === value);
  const pillWidth = `calc((100% - ${(maxOptions - 1) * GAP}px) / ${maxOptions})`;
  return (
    <div>
      <span style={microLabel}>{label}</span>
      <div style={{ display: "flex", gap: GAP, marginTop: 6 }}>
        {options.map(o => {
          const on = String(o.value) === value;
          return (
            <button key={o.value} onClick={() => onChange(on ? "" : String(o.value))} style={{
              width: pillWidth, flexShrink: 0, padding: "8px 0", borderRadius: 9, cursor: "pointer",
              border: `1.5px solid ${on ? c.p : "#E2E5EC"}`,
              background: on ? c.l : "#F8F9FC",
              color: on ? c.p : "#9ca3af",
              fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
            }}>{o.value}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, minHeight: 14, lineHeight: "14px" }}>
        {selected?.description ?? ""}
      </div>
    </div>
  );
}
