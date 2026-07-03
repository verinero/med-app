export function CardHead({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
