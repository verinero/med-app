export function PhoneShell({ children }: { children: React.ReactNode }) {
  // `height` (not `minHeight`) caps the shell to the viewport — otherwise a
  // flex child further down (a screen's `flex: 1; overflow-y: auto` content
  // area) never gets a bounded height to scroll within: the whole shell
  // just grows to fit its content instead. That used to be reachable by
  // scrolling the whole page (which is exactly what caused the bottom nav
  // to visually disappear mid-scroll — see theme.css's html/body lock);
  // with the page itself now locked from scrolling, that overflow was
  // simply getting clipped instead. Capping the height here is what makes
  // the inner `overflow-y: auto` areas actually scroll like they're meant to.
  return (
    <div style={{ height: "100dvh", background: "#c8cdd6", display: "flex", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430, height: "100dvh", background: "#F2F3F7", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
