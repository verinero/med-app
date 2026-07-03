import { overlayStyle, sheetStyle, dragHandle, sheetTitle } from "../styles";

export function DeleteModal({ show, onCancel, onConfirm }: {
  show: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  if (!show) return null;
  return (
    <div onClick={onCancel} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={{ ...sheetTitle, color: "#D32F2F" }}>Delete this call?</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D32F2F", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
