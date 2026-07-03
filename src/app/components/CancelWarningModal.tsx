import { overlayStyle, sheetStyle, dragHandle, sheetTitle } from "../styles";

export function CancelWarningModal({ show, isEditing, onKeepEditing, onDiscard }: {
  show: boolean; isEditing: boolean; onKeepEditing: () => void; onDiscard: () => void;
}) {
  if (!show) return null;
  return (
    <div onClick={onKeepEditing} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={{ ...sheetTitle, color: "#D97706" }}>Discard changes?</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
          {isEditing
            ? "You have unsaved edits to this call. Leaving now will discard them."
            : "Information has been entered. Leaving now will discard this call."}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onKeepEditing} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Keep Editing</button>
          <button onClick={onDiscard} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D97706", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Discard</button>
        </div>
      </div>
    </div>
  );
}
