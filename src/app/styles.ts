import type { CSSProperties } from "react";

// ── Style constants ───────────────────────────────────────────
export const microLabel: CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", textTransform: "uppercase",
};
export const uLabelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", textTransform: "uppercase",
  display: "block", marginBottom: 8,
};
export const eyebrow: CSSProperties = {
  color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600,
  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2,
};
export const stepperBtn: CSSProperties = {
  width: 36, height: 36, background: "#F8F9FC", border: "none",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
// `transform: translateZ(0)` forces this fixed-position overlay onto its own
// GPU compositing layer — without it, iOS Safari can clip/mis-position
// fixed elements during and right after a scroll-driven browser-chrome
// (address bar) show/hide transition, so a sheet opened right after
// scrolling can render cut off until the next reflow. Same fix applied to
// BottomNav.tsx, which is fixed-position for the same reason.
export const overlayStyle: CSSProperties = {
  position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.48)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  transform: "translateZ(0)", WebkitTransform: "translateZ(0)",
};
export const sheetStyle: CSSProperties = {
  width: "100%", maxWidth: 430, background: "#fff",
  borderRadius: "22px 22px 0 0", padding: "8px 24px 44px",
  boxShadow: "0 -4px 32px rgba(0,0,0,0.2)",
};
export const dragHandle: CSSProperties = {
  width: 36, height: 4, borderRadius: 2, background: "#E2E5EC", margin: "12px auto 22px",
};
export const sheetTitle: CSSProperties = {
  margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0d1117",
};
export const textInputStyle: CSSProperties = {
  display: "block", width: "100%", boxSizing: "border-box",
  background: "#F2F3F7", border: "1.5px solid #E2E5EC", borderRadius: 11,
  padding: "11px 14px", fontSize: 14, fontWeight: 500, color: "#0d1117", outline: "none",
};
export const primaryBtn: CSSProperties = {
  width: "100%", padding: "15px 0", border: "none", borderRadius: 14,
  color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
};
