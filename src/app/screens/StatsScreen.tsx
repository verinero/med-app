import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HOME_COLOR } from "../constants";
import type { CallOutcomeSegment, HospitalCount } from "../callStats";
import type { ShiftSummary, UnitTypeSegment } from "../shiftStats";
import type { ShiftDraft, SetShiftFld } from "../shiftForm";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { CallOutcomeDonut } from "../components/CallOutcomeDonut";
import { HospitalBarChart } from "../components/HospitalBarChart";
import { UnitTypeStackedBar } from "../components/UnitTypeStackedBar";
import { ShiftPill } from "../components/ShiftPill";
import { ShiftManagerModal } from "../components/ShiftManagerModal";
import { ShiftHistoryList } from "../components/ShiftHistoryList";
import { eyebrow } from "../styles";

export function StatsScreen({
  totalCalls, outcomeSegments, hospitalData, shiftHistory, shiftsByUnitType, hoursByUnitType,
  navTab, setNavTab, onHome, onExport, onNewCall,
  pillUnitLabel, pillElapsedLabel,
  showShiftManager, shiftManagerTab, setShiftManagerTab, shiftDraft, setShiftFld, editingShiftId,
  onOpenShiftManager, onCloseShiftManager, onSaveShift, onNewShiftInManager, onSelectHistoryShift,
  deleteShiftTarget, onRequestDeleteShift, onCancelDeleteShift, onConfirmDeleteShift,
}: {
  totalCalls: number; outcomeSegments: CallOutcomeSegment[]; hospitalData: HospitalCount[]; shiftHistory: ShiftSummary[];
  shiftsByUnitType: UnitTypeSegment[]; hoursByUnitType: UnitTypeSegment[];
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onExport: () => void; onNewCall: () => void;
  pillUnitLabel: string | null; pillElapsedLabel?: string;
  showShiftManager: boolean; shiftManagerTab: "add" | "history"; setShiftManagerTab: (t: "add" | "history") => void;
  shiftDraft: ShiftDraft; setShiftFld: SetShiftFld; editingShiftId: number | null;
  onOpenShiftManager: () => void; onCloseShiftManager: () => void;
  onSaveShift: () => void; onNewShiftInManager: () => void; onSelectHistoryShift: (id: number) => void;
  deleteShiftTarget: number | null; onRequestDeleteShift: (id: number) => void; onCancelDeleteShift: () => void; onConfirmDeleteShift: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <PhoneShell>
      <ShiftManagerModal
        show={showShiftManager}
        tab={shiftManagerTab} onSetTab={setShiftManagerTab}
        draft={shiftDraft} setDraftFld={setShiftFld} isEditing={editingShiftId != null}
        onSave={onSaveShift} onNewShift={onNewShiftInManager} onClose={onCloseShiftManager}
        history={shiftHistory} onSelectHistoryShift={onSelectHistoryShift}
        deleteTargetId={deleteShiftTarget} onRequestDelete={onRequestDeleteShift}
        onCancelDelete={onCancelDeleteShift} onConfirmDelete={onConfirmDeleteShift}
      />
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={eyebrow}>EMS Dashboard</div>
            <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Stats</h1>
          </div>
          <ShiftPill unitLabel={pillUnitLabel} elapsedLabel={pillElapsedLabel} onClick={onOpenShiftManager} />
        </div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Call Outcomes</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="All-Time Breakdown" />
          <CallOutcomeDonut total={totalCalls} segments={outcomeSegments} />
        </FormCard>

        <SLabel>Hospitals</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Most Transported To" />
          <HospitalBarChart data={hospitalData} />
        </FormCard>

        <SLabel>Shifts</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <button onClick={() => setHistoryOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
            <CardHead color={HOME_COLOR.p} label="Shift History" />
            {historyOpen ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
          </button>
          {historyOpen && <ShiftHistoryList shifts={shiftHistory} />}
        </FormCard>

        <SLabel>Unit Type</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Shifts by Unit Type" />
          <UnitTypeStackedBar segments={shiftsByUnitType} />
        </FormCard>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Hours by Unit Type" />
          <UnitTypeStackedBar segments={hoursByUnitType} formatValue={v => `${v}h`} />
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onActivity={onHome} />
    </PhoneShell>
  );
}
