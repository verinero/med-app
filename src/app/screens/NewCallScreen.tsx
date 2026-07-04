import { Zap, Heart } from "lucide-react";
import type { Medication, InterventionDef } from "../../db";
import type { ThemeColors } from "../constants";
import { contrastTextColor } from "../constants";
import type { CallForm, SetFld } from "../callForm";
import type { ShiftDraft, SetShiftFld } from "../shiftForm";
import type { ShiftSummary } from "../shiftStats";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { BottomNav } from "../components/BottomNav";
import { ShiftPill } from "../components/ShiftPill";
import { ShiftManagerModal } from "../components/ShiftManagerModal";
import { CancelWarningModal } from "../components/CancelWarningModal";
import { NoShiftWarningModal } from "../components/NoShiftWarningModal";
import { ShiftTagCard } from "./sections/ShiftTagCard";
import { PatientBasicsCard } from "./sections/PatientBasicsCard";
import { VitalsCard } from "./sections/VitalsCard";
import { InterventionsCard } from "./sections/InterventionsCard";
import { IvAccessCard } from "./sections/IvAccessCard";
import { PatientHistoryCard } from "./sections/PatientHistoryCard";
import { NotesCard } from "./sections/NotesCard";
import { AcuityCard } from "./sections/AcuityCard";
import { TransportCard } from "./sections/TransportCard";
import { eyebrow } from "../styles";

export function NewCallScreen({
  f, setFld, c, editingCallId, isLocked, today, chips, complaintSuggestions, shifts,
  hospitals, medications, interventionDefs,
  navTab, setNavTab,
  showCancelWarning, onKeepEditing, onDiscard,
  showNoShiftWarning, onCancelNoShiftWarning, onLogAnyway,
  onSave, onExport, onToggleLock, onTryCancel,
  pillUnitLabel, pillElapsedLabel,
  showShiftManager, shiftManagerTab, setShiftManagerTab, shiftDraft, setShiftFld, editingShiftId,
  shiftHistory, onOpenShiftManager, onCloseShiftManager, onSaveShift, onNewShiftInManager, onSelectHistoryShift,
  deleteShiftTarget, onRequestDeleteShift, onCancelDeleteShift, onConfirmDeleteShift,
}: {
  f: CallForm; setFld: SetFld; c: ThemeColors; editingCallId: number | null; isLocked: boolean;
  today: string; chips: string[]; complaintSuggestions: string[]; shifts: ShiftSummary[];
  hospitals: string[]; medications: Medication[]; interventionDefs: InterventionDef[];
  navTab: string; setNavTab: (t: string) => void;
  showCancelWarning: boolean; onKeepEditing: () => void; onDiscard: () => void;
  showNoShiftWarning: boolean; onCancelNoShiftWarning: () => void; onLogAnyway: () => void;
  onSave: () => void; onExport: () => void; onToggleLock: () => void; onTryCancel: () => void;
  pillUnitLabel: string | null; pillElapsedLabel?: string;
  showShiftManager: boolean; shiftManagerTab: "add" | "history"; setShiftManagerTab: (t: "add" | "history") => void;
  shiftDraft: ShiftDraft; setShiftFld: SetShiftFld; editingShiftId: number | null;
  shiftHistory: ShiftSummary[]; onOpenShiftManager: () => void; onCloseShiftManager: () => void;
  onSaveShift: () => void; onNewShiftInManager: () => void; onSelectHistoryShift: (id: number) => void;
  deleteShiftTarget: number | null; onRequestDeleteShift: (id: number) => void; onCancelDeleteShift: () => void; onConfirmDeleteShift: () => void;
}) {
  const headerText = contrastTextColor(c.p);
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
      <CancelWarningModal
        show={showCancelWarning}
        isEditing={editingCallId != null}
        onKeepEditing={onKeepEditing}
        onDiscard={onDiscard}
      />
      <NoShiftWarningModal
        show={showNoShiftWarning}
        onCancel={onCancelNoShiftWarning}
        onLogAnyway={onLogAnyway}
      />

      <div style={{ background: c.p, padding: "16px 20px 0", transition: "background 0.3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...eyebrow, color: headerText, opacity: 0.65, marginBottom: 2 }}>{editingCallId != null ? "Editing Call" : "New Call"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {f.mode === "trauma" ? <Zap size={17} color={headerText} fill={headerText} /> : <Heart size={17} color={headerText} fill={headerText} />}
              <h1 style={{ margin: 0, color: headerText, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.complaint || (editingCallId != null ? "Edit Call" : "New Call")}
              </h1>
            </div>
          </div>
          <ShiftPill unitLabel={pillUnitLabel} elapsedLabel={pillElapsedLabel} onClick={onOpenShiftManager} textColor={headerText} />
        </div>

        <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 12, padding: 3, display: "flex", marginBottom: 12, pointerEvents: isLocked ? "none" : undefined, opacity: isLocked ? 0.6 : 1 }}>
          {(["trauma", "medical"] as const).map(m => (
            <button key={m} disabled={isLocked} onClick={() => !isLocked && setFld("mode", m)} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: isLocked ? "default" : "pointer",
              fontSize: 13, fontWeight: 700, transition: "all 0.22s ease",
              background: f.mode === m ? "#fff" : "transparent",
              color: f.mode === m ? c.p : "rgba(255,255,255,0.72)",
              boxShadow: f.mode === m ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
            }}>{m === "trauma" ? "Trauma" : "Medical"}</button>
          ))}
        </div>

        <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-block", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 600,
              background: headerText === "#000000" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.14)",
              border: `1px solid ${headerText === "#000000" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.22)"}`,
              color: headerText, opacity: 0.92,
            }}>
              {today}
            </span>
            <button
              onClick={() => setFld("techedCall", !f.techedCall)}
              style={{
                padding: "4px 11px", borderRadius: 100, cursor: "pointer",
                border: `1.5px solid ${f.techedCall ? "#fff" : (headerText === "#000000" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)")}`,
                background: f.techedCall ? "#fff" : (headerText === "#000000" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)"),
                color: f.techedCall ? "#0D9488" : headerText,
                opacity: f.techedCall ? 1 : 0.75,
                fontSize: 11, fontWeight: f.techedCall ? 800 : 600,
                transition: "all 0.15s",
              }}
            >Teched Call</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([
              { key: "cancelled_enroute",  label: "Cancelled: En Route" },
              { key: "cancelled_onscene",  label: "Cancelled: On Scene" },
            ] as const).map(opt => {
              const active = f.callStatus === opt.key;
              return (
                <button key={opt.key}
                  onClick={() => setFld("callStatus", active ? "" : opt.key)}
                  style={{
                    padding: "4px 11px", borderRadius: 100, cursor: "pointer",
                    border: `1.5px solid ${active ? "#fff" : (headerText === "#000000" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)")}`,
                    background: active ? "#fff" : (headerText === "#000000" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)"),
                    color: active ? "#DC2626" : headerText,
                    opacity: active ? 1 : 0.75,
                    fontSize: 11, fontWeight: active ? 800 : 600,
                    transition: "all 0.15s",
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>
      </div>
      <CurvedShelf bg={c.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 104px", scrollbarWidth: "none" }}
        onClick={() => { setFld("showSite", false); setFld("showComplaintSuggest", false); }}>

        <div style={{ padding: "0 16px", pointerEvents: isLocked ? "none" : undefined }}>
          <ShiftTagCard f={f} setFld={setFld} c={c} shifts={shifts} />
          <PatientBasicsCard f={f} setFld={setFld} c={c} chips={chips} complaintSuggestions={complaintSuggestions} />
          <VitalsCard f={f} setFld={setFld} c={c} />
          <InterventionsCard f={f} setFld={setFld} c={c} medications={medications} interventionDefs={interventionDefs} />
          <IvAccessCard f={f} setFld={setFld} c={c} />
          <PatientHistoryCard f={f} setFld={setFld} c={c} />
          <NotesCard f={f} setFld={setFld} c={c} />
          <AcuityCard f={f} setFld={setFld} c={c} />
          <TransportCard f={f} setFld={setFld} c={c} hospitals={hospitals} />
        </div>
      </div>

      <BottomNav color={c.p} light={c.l} fabShadow={c.fab} navTab={navTab} setNavTab={setNavTab} isSave={true}
        onFAB={onSave}
        onExport={onExport}
        onLock={onToggleLock}
        onCancel={onTryCancel}
        isLocked={isLocked}
        lockColor={c.p}
      />
    </PhoneShell>
  );
}
