import { HOME_COLOR } from "../constants";
import type { CallOutcomeSegment } from "../callStats";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { CallOutcomeDonut } from "../components/CallOutcomeDonut";
import { eyebrow } from "../styles";

export function StatsScreen({
  totalCalls, outcomeSegments,
  navTab, setNavTab, onHome, onExport, onNewCall,
}: {
  totalCalls: number; outcomeSegments: CallOutcomeSegment[];
  navTab: string; setNavTab: (t: string) => void;
  onHome: () => void; onExport: () => void; onNewCall: () => void;
}) {
  return (
    <PhoneShell>
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={eyebrow}>EMS Dashboard</div>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Stats</h1>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Call Outcomes</SLabel>
        <FormCard accent={HOME_COLOR.p}>
          <CardHead color={HOME_COLOR.p} label="All-Time Breakdown" />
          <CallOutcomeDonut total={totalCalls} segments={outcomeSegments} />
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onActivity={onHome} />
    </PhoneShell>
  );
}
