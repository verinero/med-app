import { X } from "lucide-react";
import { HOME_COLOR, type UType } from "../constants";
import type { ShiftDraft, SetShiftFld } from "../shiftForm";
import type { ShiftSummary } from "../shiftStats";
import { ShiftHistoryList } from "./ShiftHistoryList";
import { DeleteModal } from "./DeleteModal";
import { DragSheet } from "./DragSheet";
import { uLabelStyle, textInputStyle, primaryBtn } from "../styles";

export function ShiftManagerModal({
  show, tab, onSetTab,
  draft, setDraftFld, isEditing, onSave, onNewShift, onClose,
  history, onSelectHistoryShift,
  deleteTargetId, onRequestDelete, onCancelDelete, onConfirmDelete,
}: {
  show: boolean; tab: "add" | "history"; onSetTab: (t: "add" | "history") => void;
  draft: ShiftDraft; setDraftFld: SetShiftFld; isEditing: boolean; onSave: () => void; onNewShift: () => void; onClose: () => void;
  history: ShiftSummary[]; onSelectHistoryShift: (id: number) => void;
  deleteTargetId: number | null; onRequestDelete: (id: number) => void; onCancelDelete: () => void; onConfirmDelete: () => void;
}) {
  return (
    <>
      <DragSheet show={show} onClose={onClose} maxHeight="88dvh">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 3, flex: 1, background: "#F2F3F7", borderRadius: 11, padding: 3 }}>
            {(["add", "history"] as const).map(t => (
              <button key={t} onClick={() => onSetTab(t)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? HOME_COLOR.p : "#6b7280",
                boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}>{t === "add" ? (isEditing ? "Edit Shift" : "Add Shift") : "History"}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: "#F2F3F7", border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {tab === "add" && isEditing && (
          <button onClick={onNewShift} style={{ background: "none", border: "none", padding: 0, marginBottom: 16, color: HOME_COLOR.p, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            + Log a different shift instead
          </button>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ display: "grid" }}>
            <div style={{
              gridArea: "1 / 1", visibility: tab === "add" ? "visible" : "hidden",
              pointerEvents: tab === "add" ? "auto" : "none",
            }}>
              <div style={uLabelStyle}>Crew (optional)</div>
              <input type="text" value={draft.crew} onChange={e => setDraftFld("crew", e.target.value)}
                placeholder="e.g. Smith / Rodriguez" style={{ ...textInputStyle, marginBottom: 20 }} />

              <div style={uLabelStyle}>Unit Type</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {(["B", "IM", "AM"] as UType[]).map(t => (
                  <button key={t} onClick={() => setDraftFld("unitType", t)} style={{
                    flex: 1, padding: "13px 0", borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${draft.unitType === t ? HOME_COLOR.p : "#E2E5EC"}`,
                    background: draft.unitType === t ? HOME_COLOR.l : "#F8F9FC",
                    color: draft.unitType === t ? HOME_COLOR.p : "#9ca3af",
                    fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
                  }}>{t}</button>
                ))}
              </div>

              <div style={uLabelStyle}>Unit Number</div>
              <input type="text" value={draft.unitNum} onChange={e => setDraftFld("unitNum", e.target.value)}
                style={{ ...textInputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, marginBottom: 20 }} />

              <div style={uLabelStyle}>Start Time</div>
              <input type="datetime-local" value={draft.start} onChange={e => setDraftFld("start", e.target.value)}
                style={{ ...textInputStyle, marginBottom: 20 }} />

              <div style={uLabelStyle}>End</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {(["duration", "time"] as const).map(mode => (
                  <button key={mode} onClick={() => setDraftFld("endMode", mode)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                    border: `1.5px solid ${draft.endMode === mode ? HOME_COLOR.p : "#E2E5EC"}`,
                    background: draft.endMode === mode ? HOME_COLOR.l : "#F8F9FC",
                    color: draft.endMode === mode ? HOME_COLOR.p : "#9ca3af",
                    fontSize: 12, fontWeight: 700,
                  }}>{mode === "duration" ? "Duration" : "End Time"}</button>
                ))}
              </div>
              {draft.endMode === "duration" ? (
                <input type="number" min={0} step={0.5} value={draft.durationHours} onChange={e => setDraftFld("durationHours", e.target.value)}
                  placeholder="Hours (leave blank if still on shift)" style={{ ...textInputStyle, marginBottom: 8 }} />
              ) : (
                <input type="datetime-local" value={draft.end} onChange={e => setDraftFld("end", e.target.value)}
                  style={{ ...textInputStyle, marginBottom: 8 }} />
              )}
            </div>

            <div style={{
              gridArea: "1 / 1", visibility: tab === "history" ? "visible" : "hidden",
              pointerEvents: tab === "history" ? "auto" : "none",
            }}>
              <ShiftHistoryList shifts={history} onSelect={onSelectHistoryShift} onDelete={onRequestDelete} />
            </div>
          </div>
        </div>

        {tab === "add" && (
          <button onClick={onSave} style={{ ...primaryBtn, background: "#16A34A", marginTop: 20, flexShrink: 0 }}>{isEditing ? "Save Changes" : "Add Shift"}</button>
        )}
      </DragSheet>

      <DeleteModal
        show={deleteTargetId != null}
        title="Delete this shift?"
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
