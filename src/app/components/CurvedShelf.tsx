export function CurvedShelf({ bg }: { bg: string }) {
  return (
    <div style={{ height: 18, background: bg, position: "relative", transition: "background 0.3s" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18, background: "#F2F3F7", borderRadius: "18px 18px 0 0" }} />
    </div>
  );
}
