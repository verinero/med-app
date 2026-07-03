import { Download } from "lucide-react";
import { HOME_COLOR } from "../constants";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { StatCard } from "../components/StatCard";
import { primaryBtn } from "../styles";

export function ExportScreen({ totalCalls, ivsTotal, medsTotal, onBack, onExportCSV, onExportPDF }: {
  totalCalls: number; ivsTotal: number; medsTotal: number;
  onBack: () => void; onExportCSV: () => void; onExportPDF: () => void;
}) {
  return (
    <PhoneShell>
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Back</button>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800 }}>Export Data</h1>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>{totalCalls} calls stored</div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
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
          <CardHead color={HOME_COLOR.p} label="Stats" />
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard label="Total" value={totalCalls} color={HOME_COLOR.p} light={HOME_COLOR.l} />
            <StatCard label="IVs"   value={ivsTotal}    color={HOME_COLOR.p} light={HOME_COLOR.l} />
            <StatCard label="Meds"  value={medsTotal}   color={HOME_COLOR.p} light={HOME_COLOR.l} />
          </div>
        </FormCard>
      </div>
    </PhoneShell>
  );
}
