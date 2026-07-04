import { Download } from "lucide-react";
import { HOME_COLOR, contrastTextColor } from "../constants";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { eyebrow, primaryBtn } from "../styles";

export function ExportScreen({
  totalCalls, today, navTab, setNavTab, onHome, onNewCall, onStats, onSettings, onExportCSV, onExportPDF, onExportPresets,
}: {
  totalCalls: number; today: string;
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onNewCall: () => void; onStats: () => void; onSettings: () => void;
  onExportCSV: () => void; onExportPDF: () => void; onExportPresets: () => void;
}) {
  const headerText = contrastTextColor(HOME_COLOR.p);
  return (
    <PhoneShell>
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ ...eyebrow, color: headerText, opacity: 0.65 }}>Weewoo Tracker</div>
            <h1 style={{ margin: 0, color: headerText, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Export Data</h1>
            <div style={{ color: headerText, opacity: 0.7, fontSize: 12, fontWeight: 500, marginTop: 5 }}>{today}</div>
          </div>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            background: headerText === "#000000" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)",
            border: `1px solid ${headerText === "#000000" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.25)"}`,
            borderRadius: 20, padding: "6px 14px", color: headerText, fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
          }}>{totalCalls} calls stored</span>
        </div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 104px", display: "flex", flexDirection: "column", gap: 12 }}>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="Export Calls" />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Download all calls and shifts from your local database as one CSV.</p>
          <button onClick={onExportCSV} style={{ ...primaryBtn, background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Download size={16} color="#fff" /> Export as CSV
          </button>
          <button onClick={onExportPDF} style={{ ...primaryBtn, background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
