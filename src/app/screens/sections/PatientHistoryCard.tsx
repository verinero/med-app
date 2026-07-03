import type { ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { microLabel, textInputStyle } from "../../styles";

export function PatientHistoryCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Patient History" />
      <div>
        <span style={{ ...microLabel, display: "block", marginBottom: 5 }}>ALLERGIES</span>
        <input type="text" placeholder="e.g. PCN, Sulfa, NKDA" value={f.allergies}
          onChange={e => setFld("allergies", e.target.value)} style={{ ...textInputStyle, marginBottom: 12 }} />
      </div>
      <div>
        <span style={{ ...microLabel, display: "block", marginBottom: 5 }}>MEDICATIONS / PMH</span>
        <textarea placeholder="Current medications, past medical history…" value={f.medHistory}
          onChange={e => setFld("medHistory", e.target.value)} rows={3}
          style={{ width: "100%", boxSizing: "border-box", background: "#F8F9FC", border: "1.5px solid #E2E5EC", borderRadius: 12, padding: "11px 13px", fontSize: 13, color: "#0d1117", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }} />
      </div>
    </FormCard>
  );
}
