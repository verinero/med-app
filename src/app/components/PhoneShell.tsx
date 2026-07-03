export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#c8cdd6", display: "flex", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", background: "#F2F3F7", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
