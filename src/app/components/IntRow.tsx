import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { contrastTextColor } from "../constants";

export function IntRow({
  enabled, onToggle, label, color, expandable, expanded, onToggleExpand, last = false, summary, children,
}: {
  enabled: boolean; onToggle: () => void; label: string; color: string;
  expandable?: boolean; expanded?: boolean; onToggleExpand?: () => void; last?: boolean;
  summary?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid #F2F3F7" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px" }}>
        <button onClick={onToggle} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${enabled ? color : "#D1D5DB"}`, background: enabled ? color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}>
          {enabled && <Check size={12} color={contrastTextColor(color)} strokeWidth={3} />}
        </button>
        <div onClick={onToggle} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, cursor: "pointer", minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: enabled ? "#0d1117" : "#6b7280" }}>{label}</span>
          {summary && !expanded && (
            <span style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
          )}
        </div>
        {expandable && (
          <button onClick={onToggleExpand} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", display: "flex" }}>
            {expanded ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
          </button>
        )}
      </div>
      {expandable && expanded && <div>{children}</div>}
    </div>
  );
}
