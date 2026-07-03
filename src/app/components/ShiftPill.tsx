export function ShiftPill({ unitLabel, elapsedLabel, onClick }: {
  unitLabel: string | null; elapsedLabel?: string; onClick: () => void;
}) {
  const open = elapsedLabel != null;
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: open ? "rgba(34,197,94,0.22)" : "rgba(255,255,255,0.15)",
      border: `1px solid ${open ? "rgba(34,197,94,0.55)" : "rgba(255,255,255,0.25)"}`,
      borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700,
      cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
    }}>
      {open && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />}
      {unitLabel ? (open ? `${unitLabel} · ${elapsedLabel}` : unitLabel) : "Add Shift"}
    </button>
  );
}
