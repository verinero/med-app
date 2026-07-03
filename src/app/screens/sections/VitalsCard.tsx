import { AO_ITEMS, type ThemeColors, type VitalLevel } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { VitalSlider } from "../../components/VitalSlider";
import { microLabel } from "../../styles";

export function VitalsCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Vitals" />

      {/* A&O at top */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={microLabel}>ALERT & ORIENTED</span>
          {f.alertOriented.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, color: c.p, background: c.l, padding: "2px 8px", borderRadius: 100 }}>
              A&Ox{f.alertOriented.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {AO_ITEMS.map(item => {
            const on = f.alertOriented.includes(item);
            return (
              <button key={item} onClick={() => {
                const next = on ? f.alertOriented.filter(i => i !== item) : [...f.alertOriented, item];
                setFld("alertOriented", next);
              }} style={{
                flex: 1, padding: "7px 0", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${on ? c.p : "#E2E5EC"}`,
                background: on ? c.l : "#F8F9FC",
                color: on ? c.p : "#9ca3af",
                fontSize: 11, fontWeight: 700, transition: "all 0.15s",
              }}>{item}</button>
            );
          })}
        </div>
      </div>

      {/* GCS at top */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...microLabel, minWidth: 56 }}>GCS</span>
        <input type="number" min={3} max={15} placeholder="3–15" value={f.gcs}
          onChange={e => setFld("gcs", e.target.value)}
          style={{ width: 80, background: "#F8F9FC", border: `1.5px solid ${f.gcs ? c.p + "66" : "#E2E5EC"}`, borderRadius: 10, padding: "7px 10px", fontSize: 14, fontWeight: f.gcs ? 700 : 400, color: f.gcs ? "#0d1117" : "#A0A6B4", outline: "none", fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }} />
      </div>

      {/* Horizontal vital sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(["hr", "bp", "spo2", "rr", "glucose"] as const).map(key => (
          <VitalSlider
            key={key}
            label={key === "spo2" ? "SpO₂" : key === "glucose" ? "Glucose" : key.toUpperCase()}
            value={f[key] as VitalLevel}
            onChange={v => setFld(key, v)}
          />
        ))}
      </div>
    </FormCard>
  );
}
