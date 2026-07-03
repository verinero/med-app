import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { HOME_COLOR, ROUTES } from "../constants";
import type { Hospital, Medication } from "../../db";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { DeleteModal } from "../components/DeleteModal";
import { eyebrow, textInputStyle } from "../styles";

function ManageListCard({ label, items, placeholder, onAdd, onRequestDelete, onSetDefaultRoute }: {
  label: string; items: { id?: number; name: string; defaultRoute?: string }[]; placeholder: string;
  onAdd: (name: string) => void; onRequestDelete: (id: number) => void;
  onSetDefaultRoute?: (id: number, route: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  function submit() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }
  return (
    <FormCard accent={HOME_COLOR.p}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
        <CardHead color={HOME_COLOR.p} label={label} />
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>
      {open && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              placeholder={placeholder} style={{ ...textInputStyle, flex: 1 }} />
            <button onClick={submit} style={{
              padding: "0 18px", border: "none", borderRadius: 11,
              background: HOME_COLOR.p, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Add</button>
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {items.map(item => {
                const currentRoute = item.defaultRoute || ROUTES[0];
                return (
                  <div key={item.id} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "9px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0d1117" }}>{item.name}</span>
                      <button onClick={() => item.id != null && onRequestDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0 }}>
                        <Trash2 size={14} color="#D1D5DB" />
                      </button>
                    </div>
                    {onSetDefaultRoute && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em", flexShrink: 0 }}>DEFAULT ROUTE</span>
                        <div style={{ display: "flex", gap: 4, flex: 1 }}>
                          {ROUTES.map(r => (
                            <button key={r} onClick={() => item.id != null && onSetDefaultRoute(item.id, r)} style={{
                              flex: 1, padding: "5px 0", borderRadius: 6, cursor: "pointer",
                              border: `1.5px solid ${currentRoute === r ? HOME_COLOR.p : "#E2E5EC"}`,
                              background: currentRoute === r ? HOME_COLOR.l : "#fff",
                              color: currentRoute === r ? HOME_COLOR.p : "#9ca3af",
                              fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
                            }}>{r}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </FormCard>
  );
}

export function SettingsScreen({
  navTab, setNavTab, onHome, onStats, onExport, onNewCall,
  showClearDataConfirm, onRequestClearData, onCancelClearData, onConfirmClearData,
  hospitals, onAddHospital, deleteHospitalTarget, deleteHospitalMessage,
  onRequestDeleteHospital, onCancelDeleteHospital, onConfirmDeleteHospital,
  medications, onAddMedication, deleteMedicationTarget, deleteMedicationMessage,
  onRequestDeleteMedication, onCancelDeleteMedication, onConfirmDeleteMedication, onSetMedicationDefaultRoute,
}: {
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onStats: () => void; onExport: () => void; onNewCall: () => void;
  showClearDataConfirm: boolean; onRequestClearData: () => void; onCancelClearData: () => void; onConfirmClearData: () => void;
  hospitals: Hospital[]; onAddHospital: (name: string) => void;
  deleteHospitalTarget: number | null; deleteHospitalMessage?: string;
  onRequestDeleteHospital: (id: number) => void; onCancelDeleteHospital: () => void; onConfirmDeleteHospital: () => void;
  medications: Medication[]; onAddMedication: (name: string) => void;
  deleteMedicationTarget: number | null; deleteMedicationMessage?: string;
  onRequestDeleteMedication: (id: number) => void; onCancelDeleteMedication: () => void; onConfirmDeleteMedication: () => void;
  onSetMedicationDefaultRoute: (id: number, route: string) => void;
}) {
  return (
    <PhoneShell>
      <DeleteModal
        show={showClearDataConfirm}
        title="Clear all data?"
        message="This permanently deletes every call and shift stored on this device. This cannot be undone."
        confirmLabel="Clear All Data"
        onCancel={onCancelClearData}
        onConfirm={onConfirmClearData}
      />
      <DeleteModal
        show={deleteHospitalTarget != null}
        title="Delete this hospital?"
        message={deleteHospitalMessage}
        onCancel={onCancelDeleteHospital}
        onConfirm={onConfirmDeleteHospital}
      />
      <DeleteModal
        show={deleteMedicationTarget != null}
        title="Delete this medication?"
        message={deleteMedicationMessage}
        onCancel={onCancelDeleteMedication}
        onConfirm={onConfirmDeleteMedication}
      />
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={eyebrow}>EMS Dashboard</div>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Settings</h1>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Hospitals</SLabel>
        <ManageListCard label="Manage Hospitals" items={hospitals} placeholder="e.g. Grady"
          onAdd={onAddHospital} onRequestDelete={onRequestDeleteHospital} />

        <SLabel>Medications</SLabel>
        <ManageListCard label="Manage Medications" items={medications} placeholder="e.g. Fentanyl"
          onAdd={onAddMedication} onRequestDelete={onRequestDeleteMedication} onSetDefaultRoute={onSetMedicationDefaultRoute} />

        <SLabel>Data</SLabel>
        <FormCard accent="#D32F2F">
          <CardHead color="#D32F2F" label="Danger Zone" />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Permanently erase every call and shift stored locally on this device. Use this only if you want to start completely fresh.
          </p>
          <button onClick={onRequestClearData} style={{
            width: "100%", padding: "15px 0", border: "1.5px solid #D32F2F", borderRadius: 14,
            color: "#D32F2F", background: "#FEF2F2", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>Clear All Data</button>
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onActivity={onHome} onStats={onStats} />
    </PhoneShell>
  );
}
