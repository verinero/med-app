import { Check } from "lucide-react";
import { ROUTES } from "../constants";

export function MedicationRow({ name, active, route, onToggle, onRouteChange, color, light }: {
  name: string; active: boolean; route: string;
  onToggle: () => void; onRouteChange: (route: string) => void;
  color: string; light: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onToggle} style={{
        flexShrink: 0, width: 104, padding: "7px 10px", borderRadius: 10, cursor: "pointer",
        border: `1.5px solid ${active ? color : "#E2E5EC"}`,
        background: active ? light : "#F8F9FC",
        color: active ? color : "#6b7280",
        fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5,
        transition: "all 0.15s",
      }}>
        {active && <Check size={12} color={color} strokeWidth={3} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{name}</span>
      </button>
      <div style={{ display: "flex", gap: 4, flex: 1, opacity: active ? 1 : 0.4 }}>
        {ROUTES.map(r => (
          <button key={r} disabled={!active} onClick={() => onRouteChange(r)} style={{
            flex: 1, padding: "6px 0", borderRadius: 7, cursor: active ? "pointer" : "default",
            border: `1.5px solid ${active && route === r ? color : "#E2E5EC"}`,
            background: active && route === r ? light : "#F8F9FC",
            color: active && route === r ? color : "#9ca3af",
            fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
          }}>{r}</button>
        ))}
      </div>
    </div>
  );
}
