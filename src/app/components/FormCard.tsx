export function FormCard({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", border: `1.5px solid ${accent}18`, boxShadow: "0 1px 5px rgba(0,0,0,0.05)", marginBottom: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </div>
  );
}
