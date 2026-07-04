import { Download } from "lucide-react";
import { HOME_COLOR } from "../constants";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { primaryBtn } from "../styles";

export function ExportScreen({
  totalCalls, navTab, setNavTab, onHome, onNewCall, onStats, onSettings, onExportCSV, onExportPDF, onExportPresets,
}: {
  totalCalls: number;
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onNewCall: () => void; onStats: () => void; onSettings: () => void;
  onExportCSV: () => void; onExportPDF: () => void; onExportPresets: () => void;
}) {
  return (
    <PhoneShell>
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800 }}>Export Data</h1>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>{totalCalls} calls stored</div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 104px", display: "flex", flexDirection: "column", gap: 12 }}>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Export Calls" />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Download all records from your local database.</p>
          <button onClick={onExportCSV} style={{ ...primaryBtn, background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Download size={16} color="#fff" /> Export as CSV
          </button>
          <button onClick={onExportPDF} style={{ ...primaryBtn, background: HOME_COLOR.p, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Download size={16} color="#fff" /> Export as PDF
          </button>
        </FormCard>

        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Export Presets" />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Download Hospitals, Medications, Interventions, and Chief Complaints as one CSV — for backup or loading onto another device.
          </p>
          <button onClick={onExportPresets} style={{ ...primaryBtn, background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Download size={16} color="#fff" /> Export as CSV
          </button>
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={() => {}} onActivity={onHome} onStats={onStats} onSettings={onSettings} />
    </PhoneShell>
  );
}
