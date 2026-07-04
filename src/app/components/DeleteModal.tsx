import { sheetTitle } from "../styles";
import { DragSheet } from "./DragSheet";

export function DeleteModal({ show, title = "Delete this call?", message = "This cannot be undone.", confirmLabel = "Delete", onCancel, onConfirm }: {
  show: boolean; title?: string; message?: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <DragSheet show={show} onClose={onCancel}>
      <h3 style={{ ...sheetTitle, color: "#D32F2F" }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>{message}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D32F2F", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>{confirmLabel}</button>
      </div>
    </DragSheet>
  );
}
