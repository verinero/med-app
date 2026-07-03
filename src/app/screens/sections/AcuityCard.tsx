import type { ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";

const OPTIONS = [
  { key: "low", label: "Low Acuity", color: "#16A34A" },
  { key: "emergent", label: "Emergent", color: "#D97706" },
  { key: "critical", label: "Critical", color: "#DC2626" },
] as const;

export function AcuityCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Acuity" />
      <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
        {OPTIONS.map(opt => {
          const active = f.acuity === opt.key;
          return (
            <button key={opt.key} onClick={() => setFld("acuity", active ? "" : opt.key)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: active ? "#fff" : "transparent",
                color: active ? opt.color : "#9ca3af",
                boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}
            >{opt.label}</button>
          );
        })}
      </div>
    </FormCard>
  );
}
