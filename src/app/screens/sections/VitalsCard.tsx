import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AO_ITEMS, type ThemeColors, type VitalLevel } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { gcsTotal } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { VitalSlider } from "../../components/VitalSlider";
import { GcsSelector } from "../../components/GcsSelector";
import { microLabel } from "../../styles";

const GCS_EYE = [
  { value: 4, description: "Spontaneously" },
  { value: 3, description: "To speech" },
  { value: 2, description: "To pain" },
  { value: 1, description: "No response" },
];
const GCS_VERBAL = [
  { value: 5, description: "Appropriate" },
  { value: 4, description: "Confused" },
  { value: 3, description: "Inappropriate words" },
  { value: 2, description: "Incomprehensible sounds" },
  { value: 1, description: "No response" },
];
const GCS_MOTOR = [
  { value: 6, description: "Obeys commands" },
  { value: 5, description: "Moves to localized pain" },
  { value: 4, description: "Flexion to pain" },
  { value: 3, description: "Abnormal flexion (decorticate)" },
  { value: 2, description: "Abnormal extension (decerebrate)" },
  { value: 1, description: "No response" },
];

export function VitalsCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  const total = gcsTotal(f.gcsEye, f.gcsVerbal, f.gcsMotor);
  const [gcsOpen, setGcsOpen] = useState(true);
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

      {/* GCS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <button onClick={() => setGcsOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
          <span style={microLabel}>Glasgow Coma Scale (GCS)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: total ? c.p : "#9ca3af", background: total ? c.l : "#F2F3F7", padding: "3px 10px", borderRadius: 100, fontFamily: "'JetBrains Mono', monospace" }}>
              {total || "—"}
            </span>
            {gcsOpen ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
          </div>
        </button>
        {gcsOpen && (
          <>
            <GcsSelector label="EYE (E)" value={f.gcsEye} onChange={v => setFld("gcsEye", v)} options={GCS_EYE} maxOptions={6} c={c} />
            <GcsSelector label="VERBAL (V)" value={f.gcsVerbal} onChange={v => setFld("gcsVerbal", v)} options={GCS_VERBAL} maxOptions={6} c={c} />
            <GcsSelector label="MOTOR (M)" value={f.gcsMotor} onChange={v => setFld("gcsMotor", v)} options={GCS_MOTOR} maxOptions={6} c={c} />
          </>
        )}
      </div>

      {/* Horizontal vital sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
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
