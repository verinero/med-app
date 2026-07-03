import { HOME_COLOR, type UType } from "../constants";
import { overlayStyle, sheetStyle, dragHandle, sheetTitle, uLabelStyle, textInputStyle, primaryBtn } from "../styles";

export function UnitModal({ show, unitType, unitNum, onSetUnitType, onSetUnitNum, onSave, onClose }: {
  show: boolean;
  unitType: UType; unitNum: string;
  onSetUnitType: (t: UType) => void; onSetUnitNum: (n: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={sheetTitle}>Unit Setup</h3>
        <div style={uLabelStyle}>Unit Type</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["B", "IM", "AM"] as UType[]).map(t => (
            <button key={t} onClick={() => onSetUnitType(t)} style={{
              flex: 1, padding: "13px 0", borderRadius: 12, cursor: "pointer",
              border: `1.5px solid ${unitType === t ? HOME_COLOR.p : "#E2E5EC"}`,
              background: unitType === t ? HOME_COLOR.l : "#F8F9FC",
              color: unitType === t ? HOME_COLOR.p : "#9ca3af",
              fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        <div style={uLabelStyle}>Unit Number</div>
        <input type="text" value={unitNum} onChange={e => onSetUnitNum(e.target.value)}
          style={{ ...textInputStyle, borderColor: `${HOME_COLOR.p}55`, fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, marginBottom: 28 }} />
        <button onClick={onSave} style={{ ...primaryBtn, background: HOME_COLOR.p }}>Done</button>
      </div>
    </div>
  );
}
