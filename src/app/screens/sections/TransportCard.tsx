import type { ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";

export function TransportCard({ f, setFld, c, hospitals }: { f: CallForm; setFld: SetFld; c: ThemeColors; hospitals: string[] }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Transport" />
      {/* Tab toggle */}
      <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
        {(["hospital", "refusal", "nurse_navigation"] as const).map(tab => {
          const active = f.transportMode === tab;
          return (
            <button key={tab} onClick={() => { setFld("transportMode", tab); if (tab !== "hospital") setFld("hospital", ""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: active ? "#fff" : "transparent",
                color: active ? (tab === "refusal" ? "#BE123C" : tab === "nurse_navigation" ? "#0D9488" : c.p) : "#9ca3af",
                boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}
            >{tab === "hospital" ? "Hospital" : tab === "refusal" ? "Refusal" : "Nurse Nav"}</button>
          );
        })}
      </div>

      {f.transportMode === "hospital" ? (
        <select
          value={f.hospital}
          onChange={e => setFld("hospital", e.target.value)}
          style={{
            width: "100%", appearance: "none", WebkitAppearance: "none",
            background: `#F8F9FC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center`,
            border: `1.5px solid ${f.hospital ? c.p + "66" : "#E2E5EC"}`,
            borderRadius: 12, padding: "11px 36px 11px 13px",
            fontSize: 14, fontWeight: f.hospital ? 600 : 400,
            color: f.hospital ? "#0d1117" : "#A0A6B4",
            outline: "none", cursor: "pointer",
          }}
        >
          <option value="">Select hospital…</option>
          {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      ) : f.transportMode === "refusal" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FFE4E6", borderRadius: 12, border: "1.5px solid #FECDD3" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BE123C", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#BE123C" }}>Patient refused transport</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#CCFBF1", borderRadius: 12, border: "1.5px solid #99F6E4" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0D9488", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>Patient referred to nurse navigation</span>
        </div>
      )}
    </FormCard>
  );
}
