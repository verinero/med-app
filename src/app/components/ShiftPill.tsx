// `textColor` defaults to white — the header this pill sits on is usually a
// solid theme accent, but callers pass the theme-aware contrastTextColor()
// result so the pill still reads once that accent color is customized light.
export function ShiftPill({ unitLabel, elapsedLabel, onClick, textColor = "#fff" }: {
  unitLabel: string | null; elapsedLabel?: string; onClick: () => void; textColor?: string;
}) {
  const open = elapsedLabel != null;
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: open ? "rgba(34,197,94,0.22)" : `${textColor === "#fff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
      border: `1px solid ${open ? "rgba(34,197,94,0.55)" : (textColor === "#fff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)")}`,
      borderRadius: 20, padding: "6px 14px", color: textColor, fontSize: 12, fontWeight: 700,
      cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
    }}>
      {open && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />}
      {unitLabel ? (open ? `${unitLabel} · ${elapsedLabel}` : unitLabel) : "Add Shift"}
    </button>
  );
}
