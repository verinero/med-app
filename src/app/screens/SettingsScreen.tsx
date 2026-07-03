import { HOME_COLOR } from "../constants";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { DeleteModal } from "../components/DeleteModal";
import { eyebrow } from "../styles";

export function SettingsScreen({
  navTab, setNavTab, onHome, onStats, onExport, onNewCall,
  showClearDataConfirm, onRequestClearData, onCancelClearData, onConfirmClearData,
}: {
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onStats: () => void; onExport: () => void; onNewCall: () => void;
  showClearDataConfirm: boolean; onRequestClearData: () => void; onCancelClearData: () => void; onConfirmClearData: () => void;
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
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={eyebrow}>EMS Dashboard</div>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Settings</h1>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
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
