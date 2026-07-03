import { Download } from "lucide-react";
import { HOME_COLOR } from "../constants";
import type { CallRecord } from "../../db";
import type { ShiftDraft, SetShiftFld } from "../shiftForm";
import type { ShiftSummary } from "../shiftStats";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { StatCard } from "../components/StatCard";
import { BottomNav } from "../components/BottomNav";
import { DeleteModal } from "../components/DeleteModal";
import { ShiftPill } from "../components/ShiftPill";
import { ShiftManagerModal } from "../components/ShiftManagerModal";
import { CallListItem } from "./CallListItem";
import { eyebrow } from "../styles";

export function HomeScreen({
  savedCalls, callsToday, callsWeek, ivSuccessRate, medsTotal, today,
  navTab, setNavTab,
  deleteTarget, onSetDeleteTarget, onConfirmDelete,
  onOpenCall, onExport, onNewCall, onStats, onSettings,
  pillUnitLabel, pillElapsedLabel,
  showShiftManager, shiftManagerTab, setShiftManagerTab, shiftDraft, setShiftFld, editingShiftId,
  shiftHistory, onOpenShiftManager, onCloseShiftManager, onSaveShift, onNewShiftInManager, onSelectHistoryShift,
  deleteShiftTarget, onRequestDeleteShift, onCancelDeleteShift, onConfirmDeleteShift,
}: {
  savedCalls: CallRecord[]; callsToday: number; callsWeek: number; ivSuccessRate: number; medsTotal: number; today: string;
  navTab: string; setNavTab: (t: string) => void;
  deleteTarget: number | null; onSetDeleteTarget: (id: number | null) => void; onConfirmDelete: () => void;
  onOpenCall: (call: CallRecord) => void; onExport: () => void; onNewCall: () => void; onStats: () => void; onSettings: () => void;
  pillUnitLabel: string | null; pillElapsedLabel?: string;
  showShiftManager: boolean; shiftManagerTab: "add" | "history"; setShiftManagerTab: (t: "add" | "history") => void;
  shiftDraft: ShiftDraft; setShiftFld: SetShiftFld; editingShiftId: number | null;
  shiftHistory: ShiftSummary[]; onOpenShiftManager: () => void; onCloseShiftManager: () => void;
  onSaveShift: () => void; onNewShiftInManager: () => void; onSelectHistoryShift: (id: number) => void;
  deleteShiftTarget: number | null; onRequestDeleteShift: (id: number) => void; onCancelDeleteShift: () => void; onConfirmDeleteShift: () => void;
}) {
  return (
    <PhoneShell>
      <DeleteModal
        show={deleteTarget != null}
        onCancel={() => onSetDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
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
            <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Overview</h1>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, marginTop: 5 }}>{today}</div>
          </div>
          <ShiftPill unitLabel={pillUnitLabel} elapsedLabel={pillElapsedLabel} onClick={onOpenShiftManager} />
        </div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Calls</SLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <StatCard label="Today"     value={callsToday}        color={HOME_COLOR.p} light={HOME_COLOR.l} />
          <StatCard label="This Week" value={callsWeek}         color={HOME_COLOR.p} light={HOME_COLOR.l} />
          <StatCard label="All Time"  value={savedCalls.length} color={HOME_COLOR.p} light={HOME_COLOR.l} />
        </div>
        <SLabel>Procedures</SLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <StatCard label="IV Success" value={`${ivSuccessRate}%`} color={HOME_COLOR.p} light={HOME_COLOR.l} />
          <StatCard label="Meds Given" value={medsTotal} color={HOME_COLOR.p} light={HOME_COLOR.l} />
        </div>

        {savedCalls.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SLabel>Recent Calls</SLabel>
              <button onClick={onExport} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: HOME_COLOR.p, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Download size={12} color={HOME_COLOR.p} /> Export
              </button>
            </div>
            {savedCalls.slice(0, 10).map(call => (
              <CallListItem
                key={call.id}
                call={call}
                onOpen={() => onOpenCall(call)}
                onDelete={() => onSetDeleteTarget(call.id ?? null)}
              />
            ))}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No calls yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Tap + to log your first call</div>
          </div>
        )}
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onStats={onStats} onSettings={onSettings} />
    </PhoneShell>
  );
}
