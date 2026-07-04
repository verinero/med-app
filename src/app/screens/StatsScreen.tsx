import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HOME_COLOR, contrastTextColor } from "../constants";
import type { CallOutcomeSegment, HospitalCount, IvSuccessStats, TechedByUnitTypeSegment, AcuitySegment } from "../callStats";
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
import { TechedByUnitTypeBar } from "../components/TechedByUnitTypeBar";
import { ShiftPill } from "../components/ShiftPill";
import { ShiftManagerModal } from "../components/ShiftManagerModal";
import { ShiftHistoryList } from "../components/ShiftHistoryList";
import { eyebrow } from "../styles";

export function StatsScreen({
  totalCalls, outcomeSegments, hospitalData, ivStats, shiftHistory, shiftsByUnitType, hoursByUnitType, techedByUnitType, acuityData,
  navTab, setNavTab, onHome, onExport, onNewCall, onSettings,
  pillUnitLabel, pillElapsedLabel,
  showShiftManager, shiftManagerTab, setShiftManagerTab, shiftDraft, setShiftFld, editingShiftId,
  onOpenShiftManager, onCloseShiftManager, onSaveShift, onNewShiftInManager, onSelectHistoryShift,
  deleteShiftTarget, onRequestDeleteShift, onCancelDeleteShift, onConfirmDeleteShift,
}: {
  totalCalls: number; outcomeSegments: CallOutcomeSegment[]; hospitalData: HospitalCount[]; ivStats: IvSuccessStats; shiftHistory: ShiftSummary[];
  shiftsByUnitType: UnitTypeSegment[]; hoursByUnitType: UnitTypeSegment[]; techedByUnitType: TechedByUnitTypeSegment[]; acuityData: AcuitySegment[];
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onExport: () => void; onNewCall: () => void; onSettings: () => void;
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
            <div style={{ ...eyebrow, color: contrastTextColor(HOME_COLOR.p), opacity: 0.65 }}>Weewoo Tracker</div>
            <h1 style={{ margin: 0, color: contrastTextColor(HOME_COLOR.p), fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Stats</h1>
          </div>
          <ShiftPill unitLabel={pillUnitLabel} elapsedLabel={pillElapsedLabel} onClick={onOpenShiftManager} textColor={contrastTextColor(HOME_COLOR.p)} />
        </div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Call Outcomes</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="All-Time Breakdown" />
          <CallOutcomeDonut total={totalCalls} segments={outcomeSegments} />
        </FormCard>

        <SLabel>Patient Acuity</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Calls by Acuity" />
          <UnitTypeStackedBar segments={acuityData} />
        </FormCard>

        <SLabel>Hospitals</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Most Transported To" />
          <HospitalBarChart data={hospitalData} />
        </FormCard>

        {ivStats.attempted > 0 && (
          <>
            <SLabel>IV Access</SLabel>
            <FormCard accent={HOME_COLOR.p}>
              <CardHead color={HOME_COLOR.p} label="Success Rate" />
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#16A34A", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em" }}>
                  {ivStats.rate}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                  {ivStats.established} of {ivStats.attempted} established
                </span>
              </div>
            </FormCard>
          </>
        )}

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
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Teched by Unit Type" />
          <TechedByUnitTypeBar segments={techedByUnitType} />
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onActivity={onHome} onSettings={onSettings} />
    </PhoneShell>
  );
}
