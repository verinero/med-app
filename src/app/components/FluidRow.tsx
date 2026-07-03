import { FLUID } from "../constants";

export function FluidRow({ label, value, onChange, color, light }: { label: string; value: number; onChange: (v: number) => void; color: string; light: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", minWidth: 48, letterSpacing: "0.04em" }}>{label}</span>
      <div style={{ display: "flex", gap: 5 }}>
        {FLUID.map(a => (
          <button key={a} onClick={() => onChange(a)} style={{
            padding: "5px 9px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${value === a ? color : "#E2E5EC"}`,
            background: value === a ? light : "#F8F9FC",
            color: value === a ? color : "#6b7280",
            fontSize: 11, fontWeight: 700, transition: "all 0.15s",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{a === 0 ? "0" : `${a}`}</button>
        ))}
      </div>
    </div>
  );
}
