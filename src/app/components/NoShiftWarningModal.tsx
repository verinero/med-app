import { overlayStyle, sheetStyle, dragHandle, sheetTitle } from "../styles";

export function NoShiftWarningModal({ show, onCancel, onLogAnyway }: {
  show: boolean; onCancel: () => void; onLogAnyway: () => void;
}) {
  if (!show) return null;
  return (
    <div onClick={onCancel} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={{ ...sheetTitle, color: "#D97706" }}>No shift tagged</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
          This call isn't tagged to a shift yet. It will be logged without one — you can still tag it to a shift later.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          <button onClick={onLogAnyway} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D97706", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Log Anyway</button>
        </div>
      </div>
    </div>
  );
}
