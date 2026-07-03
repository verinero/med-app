import { Minus, Plus } from "lucide-react";
import { OXY_T, type ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { IntRow } from "../../components/IntRow";
import { FluidRow } from "../../components/FluidRow";
import { DrugBtn } from "../../components/DrugBtn";
import { microLabel, stepperBtn } from "../../styles";

export function InterventionsCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Interventions" />
      <div style={{ borderRadius: 12, border: "1.5px solid #ECEEF2", overflow: "visible" }}>
        {f.mode === "trauma" && (
          <>
            <IntRow enabled={f.tCspine}    onToggle={() => setFld("tCspine", !f.tCspine)}       label="C-Spine Immobilization" color={c.p} />
            <IntRow enabled={f.tBackboard} onToggle={() => setFld("tBackboard", !f.tBackboard)} label="Backboard"              color={c.p} />
            <IntRow enabled={f.tSplint}    onToggle={() => setFld("tSplint", !f.tSplint)}       label="Extremity Splinting"    color={c.p} />
            <IntRow enabled={f.tBandage}   onToggle={() => setFld("tBandage", !f.tBandage)}     label="Bandaging"              color={c.p} />
          </>
        )}

        <IntRow enabled={f.oxyOn} onToggle={() => { const n = !f.oxyOn; setFld("oxyOn", n); if (n) setFld("oxyOpen", true); }}
          label="Oxygen" color={c.p} expandable expanded={f.oxyOpen} onToggleExpand={() => setFld("oxyOpen", !f.oxyOpen)}>
          <div style={{ padding: "2px 12px 14px 46px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {OXY_T.map(t => (
                <button key={t} onClick={() => setFld("oxyType", t)} style={{
                  padding: "5px 11px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${f.oxyType === t ? c.p : "#E2E5EC"}`,
                  background: f.oxyType === t ? c.l : "#F8F9FC",
                  color: f.oxyType === t ? c.p : "#6b7280",
                  fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                }}>{t}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", minWidth: 42 }}>LITERS</span>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E2E5EC", borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setFld("oxyLiters", Math.max(0, f.oxyLiters - 1))} style={stepperBtn}><Minus size={13} color={c.p} /></button>
                <span style={{ minWidth: 52, textAlign: "center", fontSize: 16, fontWeight: 800, color: c.p, fontFamily: "'JetBrains Mono', monospace", background: "#F8F9FC", padding: "6px 4px" }}>{f.oxyLiters}L</span>
                <button onClick={() => setFld("oxyLiters", Math.min(25, f.oxyLiters + 1))} style={stepperBtn}><Plus size={13} color={c.p} /></button>
              </div>
            </div>
          </div>
        </IntRow>

        <IntRow enabled={f.medOn} onToggle={() => { const n = !f.medOn; setFld("medOn", n); if (n) setFld("medOpen", true); }}
          label="Medication" color={c.p} expandable expanded={f.medOpen} onToggleExpand={() => setFld("medOpen", !f.medOpen)}
          last={f.mode !== "medical"}>
          <div style={{ padding: "2px 12px 14px 46px", display: "flex", flexDirection: "column", gap: 10 }}>
            <FluidRow label="Saline" value={f.salineAmt} onChange={v => setFld("salineAmt", v)} color={c.p} light={c.l} />
            <FluidRow label="LR"     value={f.lrAmt}     onChange={v => setFld("lrAmt", v)}     color={c.p} light={c.l} />
            <div style={{ display: "flex", gap: 8 }}>
              <DrugBtn active={f.zofran}  onClick={() => setFld("zofran", !f.zofran)}   label="Zofran"  color={c.p} light={c.l} />
              <DrugBtn active={f.toradol} onClick={() => setFld("toradol", !f.toradol)} label="Toradol" color={c.p} light={c.l} />
            </div>
          </div>
        </IntRow>

        {f.mode === "medical" && (
          <IntRow enabled={f.leadOn} onToggle={() => { const n = !f.leadOn; setFld("leadOn", n); if (n) setFld("leadOpen", true); }}
            label="12-Lead ECG" color={c.p} expandable expanded={f.leadOpen} onToggleExpand={() => setFld("leadOpen", !f.leadOpen)} last>
            <div style={{ padding: "2px 12px 14px 46px" }}>
              <span style={{ ...microLabel, display: "block", marginBottom: 6 }}>INTERPRETATION</span>
              <textarea placeholder="e.g. Normal sinus rhythm, STEMI inferior…" value={f.leadInterp}
                onChange={e => setFld("leadInterp", e.target.value)} rows={3}
                style={{ width: "100%", boxSizing: "border-box", background: "#F8F9FC", border: "1.5px solid #E2E5EC", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#0d1117", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }} />
            </div>
          </IntRow>
        )}
      </div>
    </FormCard>
  );
}
