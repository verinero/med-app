import { X } from "lucide-react";
import { SEX_OPTS, type ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { microLabel } from "../../styles";

export function PatientBasicsCard({ f, setFld, c, chips, complaintSuggestions }: {
  f: CallForm; setFld: SetFld; c: ThemeColors;
  chips: string[]; complaintSuggestions: string[];
}) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Patient Basics" />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

        {/* Age pill — wider rect so nothing clips */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 88, borderRadius: 16,
            border: `2px solid ${c.p}`, background: c.l,
            padding: "10px 8px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            {/* Years row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <input
                type="number" min={0} max={120} placeholder="—" value={f.ageYears}
                onChange={e => setFld("ageYears", e.target.value)}
                style={{ width: 44, background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 22, fontWeight: 800, color: f.ageYears ? c.p : "#c4c8d0", fontFamily: "'JetBrains Mono', monospace" }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: `${c.p}99` }}>yrs</span>
            </div>
            {/* Divider */}
            <div style={{ width: "70%", height: 1, background: `${c.p}30` }} />
            {/* Months row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <input
                type="number" min={0} max={12} placeholder="—" value={f.ageMonths}
                onChange={e => setFld("ageMonths", e.target.value)}
                style={{ width: 44, background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 16, fontWeight: 700, color: f.ageMonths ? c.p : "#c4c8d0", fontFamily: "'JetBrains Mono', monospace" }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: `${c.p}99` }}>mo</span>
            </div>
          </div>
          <span style={microLabel}>AGE</span>
          {/* Sex */}
          <div style={{ display: "flex", gap: 3 }}>
            {SEX_OPTS.map(s => (
              <button key={s} onClick={() => setFld("sex", f.sex === s ? "" : s)} style={{
                padding: "3px 6px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                border: `1.5px solid ${f.sex === s ? c.p : "#E2E5EC"}`,
                background: f.sex === s ? c.l : "#F8F9FC",
                color: f.sex === s ? c.p : "#9ca3af",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Complaint with autocomplete */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...microLabel, display: "block", marginBottom: 5 }}>CHIEF COMPLAINT</span>
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "#F8F9FC", border: `1.5px solid ${f.complaint ? c.p + "66" : "#E2E5EC"}`, borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
              <input type="text" placeholder="Type complaint…" value={f.complaint}
                onChange={e => { setFld("complaint", e.target.value); setFld("activeChip", ""); setFld("showComplaintSuggest", true); }}
                onFocus={() => setFld("showComplaintSuggest", true)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: f.complaint ? 600 : 400, color: f.complaint ? "#0d1117" : "#A0A6B4", fontFamily: "'Inter', sans-serif" }} />
              {f.complaint && (
                <button onClick={() => { setFld("complaint", ""); setFld("activeChip", ""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={14} color="#9ca3af" />
                </button>
              )}
            </div>
            {/* Autocomplete dropdown */}
            {f.showComplaintSuggest && complaintSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2E5EC", borderRadius: 12, overflow: "hidden", zIndex: 60, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
                {complaintSuggestions.slice(0, 5).map((s, i, arr) => (
                  <button key={s} onClick={() => { setFld("complaint", s); setFld("activeChip", ""); setFld("showComplaintSuggest", false); }}
                    style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderBottom: i < arr.length - 1 ? "1px solid #F2F3F7" : "none", textAlign: "left", fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Chips */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
            {chips.map(chip => (
              <button key={chip} onClick={() => {
                if (f.activeChip === chip) { setFld("activeChip", ""); setFld("complaint", ""); }
                else { setFld("activeChip", chip); setFld("complaint", chip); setFld("showComplaintSuggest", false); }
              }} style={{
                padding: "4px 10px", borderRadius: 100, cursor: "pointer",
                border: `1.5px solid ${f.activeChip === chip ? c.p : "#E2E5EC"}`,
                background: f.activeChip === chip ? c.l : "#F8F9FC",
                color: f.activeChip === chip ? c.p : "#6b7280",
                fontSize: 11, fontWeight: 600, transition: "all 0.15s",
              }}>{chip}</button>
            ))}
          </div>
        </div>
      </div>
    </FormCard>
  );
}
