import { Minus, Plus } from "lucide-react";
import type { Medication, InterventionDef } from "../../../db";
import { OXY_T, ROUTES, type ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { IntRow } from "../../components/IntRow";
import { FluidRow } from "../../components/FluidRow";
import { MedicationRow } from "../../components/MedicationRow";
import { microLabel, stepperBtn, textInputStyle } from "../../styles";

export function InterventionsCard({ f, setFld, c, medications, interventionDefs }: {
  f: CallForm; setFld: SetFld; c: ThemeColors; medications: Medication[]; interventionDefs: InterventionDef[];
}) {
  const defs = interventionDefs.filter(d => d.mode === f.mode).sort((a, b) => a.order - b.order);

  function toggleIntervention(name: string) {
    const entry = f.interventions.find(i => i.name === name);
    if (entry) setFld("interventions", f.interventions.filter(i => i.name !== name));
    else setFld("interventions", [...f.interventions, { name, note: "" }]);
  }
  function setInterventionNote(name: string, note: string) {
    setFld("interventions", f.interventions.map(i => i.name === name ? { ...i, note } : i));
  }
  function toggleExpanded(name: string) {
    const open = f.expandedInterventions.includes(name);
    setFld("expandedInterventions", open ? f.expandedInterventions.filter(n => n !== name) : [...f.expandedInterventions, name]);
  }

  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Interventions" />
      <div style={{ borderRadius: 12, border: "1.5px solid #ECEEF2", overflow: "visible" }}>
        {defs.map(def => {
          const entry = f.interventions.find(i => i.name === def.name);
          const enabled = !!entry;
          return (
            <IntRow key={def.id} enabled={enabled} onToggle={() => toggleIntervention(def.name)} label={def.name} color={c.p}
              expandable={def.notesEnabled} expanded={f.expandedInterventions.includes(def.name)}
              onToggleExpand={() => toggleExpanded(def.name)}>
              {def.notesEnabled && (
                <div style={{ padding: "2px 12px 14px 46px" }}>
                  <span style={{ ...microLabel, display: "block", marginBottom: 6 }}>NOTES</span>
                  <textarea placeholder="Add a note…" value={entry?.note ?? ""}
                    onChange={e => setInterventionNote(def.name, e.target.value)} rows={3}
                    style={{ ...textInputStyle, width: "100%", boxSizing: "border-box", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }} />
                </div>
              )}
            </IntRow>
          );
        })}

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
          last>
          <div style={{ padding: "2px 12px 14px 46px", display: "flex", flexDirection: "column", gap: 10 }}>
            <FluidRow label="Saline" value={f.salineAmt} onChange={v => setFld("salineAmt", v)} color={c.p} light={c.l} />
            <FluidRow label="LR"     value={f.lrAmt}     onChange={v => setFld("lrAmt", v)}     color={c.p} light={c.l} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {medications.map(med => {
                const { name } = med;
                const defaultRoute = med.defaultRoute || ROUTES[0];
                const entry = f.meds.find(m => m.name === name);
                const active = !!entry;
                return (
                  <MedicationRow key={name} name={name} active={active} route={entry?.route ?? defaultRoute}
                    onToggle={() => {
                      if (active) setFld("meds", f.meds.filter(m => m.name !== name));
                      else setFld("meds", [...f.meds, { name, route: defaultRoute }]);
                    }}
                    onRouteChange={route => setFld("meds", f.meds.map(m => m.name === name ? { ...m, route } : m))}
                    color={c.p} light={c.l} />
                );
              })}
            </div>
          </div>
        </IntRow>
      </div>
    </FormCard>
  );
}
