import { Check } from "lucide-react";

export function DrugBtn({ active, onClick, label, color, light }: { active: boolean; onClick: () => void; label: string; color: string; light: string }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${active ? color : "#E2E5EC"}`, background: active ? light : "#F8F9FC", color: active ? color : "#6b7280", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s" }}>
      {active && <Check size={13} color={color} strokeWidth={3} />}
      {label}
    </button>
  );
}
