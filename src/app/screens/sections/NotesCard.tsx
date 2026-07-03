import type { ThemeColors } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";

export function NotesCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="Notes" />
      <textarea placeholder="Additional notes, observations…" value={f.notes}
        onChange={e => setFld("notes", e.target.value)} rows={4}
        style={{ width: "100%", boxSizing: "border-box", background: "#F8F9FC", border: "1.5px solid #E2E5EC", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "#0d1117", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }} />
    </FormCard>
  );
}
