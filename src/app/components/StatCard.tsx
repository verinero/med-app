export function StatCard({ label, value, color }: { label: string; value: number | string; color: string; light: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: "13px 14px", border: "1.5px solid #E2E5EC", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
