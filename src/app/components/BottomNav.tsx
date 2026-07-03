import { Check, Plus, X, Activity, Download, BarChart2, Settings, Lock } from "lucide-react";

export function BottomNav({ color, light, fabShadow, navTab, setNavTab, isSave, onFAB, onExport, onActivity, onStats, onSettings, onLock, onCancel, isLocked, lockColor }: {
  color: string; light: string; fabShadow: string; navTab: string; setNavTab: (t: string) => void;
  isSave: boolean; onFAB: () => void; onExport: () => void; onActivity?: () => void; onStats?: () => void; onSettings?: () => void;
  onLock?: () => void; onCancel?: () => void; isLocked?: boolean; lockColor?: string;
}) {
  const lc = lockColor ?? color;
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, height: 88, background: "#fff", borderTop: "1px solid #E2E5EC", boxShadow: "0 -6px 24px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", padding: "10px 0 16px", zIndex: 100 }}>

      {/* Left quarter */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {isSave ? (
          <button onClick={onLock} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: isLocked ? `${lc}18` : "#F3F4F6", border: `1.5px solid ${isLocked ? lc : "#E2E5EC"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <Lock size={19} color={isLocked ? lc : "#6B7280"} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isLocked ? lc : "#6B7280", letterSpacing: "0.04em", transition: "color 0.2s" }}>
              {isLocked ? "Locked" : "Lock Chart"}
            </span>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 18 }}>
            {[{ key: "activity", I: Activity, l: "Calls" }, { key: "stats", I: BarChart2, l: "Stats" }].map(({ key, I, l }) => {
              const active = navTab === key;
              return (
                <button key={key} onClick={() => { setNavTab(key); if (key === "stats") onStats?.(); if (key === "activity") onActivity?.(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 44 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? light : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <I size={20} color={active ? color : "#9ca3af"} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? color : "#9ca3af", letterSpacing: "0.04em" }}>{l}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center FAB */}
      <button onClick={onFAB} style={{ width: 62, height: 62, borderRadius: "50%", background: color, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: fabShadow, transition: "all 0.25s ease", marginTop: -28, flexShrink: 0 }}>
        {isSave ? <Check size={28} color="#fff" strokeWidth={3} /> : <Plus size={30} color="#fff" strokeWidth={2.5} />}
      </button>

      {/* Right quarter */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {isSave ? (
          <button onClick={onCancel} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "#FEF2F2", border: "1.5px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={19} color="#DC2626" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: "0.04em" }}>Cancel</span>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 18 }}>
            {[{ key: "export", I: Download, l: "Export" }, { key: "settings", I: Settings, l: "Settings" }].map(({ key, I, l }) => {
              const active = navTab === key;
              return (
                <button key={key} onClick={() => { setNavTab(key); if (key === "export") onExport(); if (key === "settings") onSettings?.(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 44 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? light : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <I size={20} color={active ? color : "#9ca3af"} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? color : "#9ca3af", letterSpacing: "0.04em" }}>{l}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
