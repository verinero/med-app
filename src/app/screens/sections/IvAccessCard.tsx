import { MapPin, ChevronDown } from "lucide-react";
import { GAUGES, SITES, type ThemeColors, type LR } from "../../constants";
import type { CallForm, SetFld } from "../../callForm";
import { FormCard } from "../../components/FormCard";
import { CardHead } from "../../components/CardHead";
import { microLabel } from "../../styles";

export function IvAccessCard({ f, setFld, c }: { f: CallForm; setFld: SetFld; c: ThemeColors }) {
  return (
    <FormCard accent={c.p}>
      <CardHead color={c.p} label="IV Access" />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={microLabel}>IV?</span>
          <div style={{ background: "#F2F3F7", borderRadius: 12, padding: 3, border: "1px solid #E2E5EC", display: "flex", flexDirection: "column", gap: 3 }}>
            {["No", "Yes"].map(opt => {
              const on = (opt === "Yes") === f.ivOn;
              return (
                <button key={opt} onClick={() => setFld("ivOn", opt === "Yes")} style={{
                  padding: "8px 13px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, minWidth: 50, transition: "all 0.2s",
                  background: on ? c.p : "transparent", color: on ? "#fff" : "#9ca3af",
                  boxShadow: on ? `0 2px 8px ${c.p}44` : "none",
                }}>{opt}</button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <span style={{ ...microLabel, display: "block", marginBottom: 7 }}>GAUGE</span>
            <div style={{ display: "flex", gap: 5 }}>
              {GAUGES.map(g => (
                <button key={g.g} onClick={() => f.ivOn && setFld("gauge", g.g)} style={{
                  flex: 1, height: 34, borderRadius: 8, background: g.bg,
                  cursor: f.ivOn ? "pointer" : "default", opacity: f.ivOn ? 1 : 0.33,
                  border: f.gauge === g.g && f.ivOn ? "2.5px solid #0d1117" : "2.5px solid transparent",
                  boxShadow: f.gauge === g.g && f.ivOn ? "0 0 0 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: g.tx, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{g.g}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={{ ...microLabel, display: "block", marginBottom: 7 }}>ESTABLISHED?</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <button key={label as string} onClick={() => f.ivOn && setFld("ivEstablished", val as boolean)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 9, cursor: f.ivOn ? "pointer" : "default",
                    border: `1.5px solid ${f.ivEstablished === val && f.ivOn ? c.p : "#E2E5EC"}`,
                    background: f.ivEstablished === val && f.ivOn ? c.l : "#F8F9FC",
                    color: f.ivEstablished === val && f.ivOn ? c.p : "#9ca3af",
                    fontSize: 13, fontWeight: 800, opacity: f.ivOn ? 1 : 0.4, transition: "all 0.15s",
                  }}>{label as string}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ ...microLabel, display: "block", marginBottom: 7 }}>ATTEMPTS</span>
              <input type="number" min={1} inputMode="numeric" placeholder="1" value={f.ivAttempts}
                disabled={!f.ivOn}
                onChange={e => setFld("ivAttempts", e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", background: f.ivOn ? "#F8F9FC" : "#F2F3F7",
                  border: "1.5px solid #E2E5EC", borderRadius: 10, padding: "7px 11px",
                  fontSize: 13, fontWeight: 700, color: "#0d1117", outline: "none",
                  opacity: f.ivOn ? 1 : 0.45, fontFamily: "'JetBrains Mono', monospace", textAlign: "center",
                }} />
            </div>
          </div>
          <div>
            <span style={{ ...microLabel, display: "block", marginBottom: 7 }}>LOCATION</span>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {(["L", "R"] as LR[]).map(side => (
                <button key={side} onClick={() => f.ivOn && setFld("ivLR", side)} style={{
                  flex: 1, padding: "7px 0", borderRadius: 9, cursor: f.ivOn ? "pointer" : "default",
                  border: `1.5px solid ${f.ivLR === side && f.ivOn ? c.p : "#E2E5EC"}`,
                  background: f.ivLR === side && f.ivOn ? c.l : "#F8F9FC",
                  color: f.ivLR === side && f.ivOn ? c.p : "#9ca3af",
                  fontSize: 13, fontWeight: 800, opacity: f.ivOn ? 1 : 0.4, transition: "all 0.15s",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{side}</button>
              ))}
            </div>
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { if (!f.ivOn) return; setFld("showSite", !f.showSite); }} style={{
                width: "100%", background: f.ivOn ? "#F8F9FC" : "#F2F3F7", border: "1.5px solid #E2E5EC", borderRadius: 10,
                padding: "8px 11px", display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: f.ivOn ? "pointer" : "default", opacity: f.ivOn ? 1 : 0.45,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <MapPin size={13} color={f.ivOn ? c.p : "#9ca3af"} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0d1117" }}>{f.ivLR}&nbsp;·&nbsp;{f.ivSite}</span>
                </div>
                <ChevronDown size={14} color="#A0A6B4" />
              </button>
              {f.showSite && f.ivOn && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2E5EC", borderRadius: 12, overflow: "hidden", zIndex: 50, boxShadow: "0 8px 28px rgba(0,0,0,0.13)" }}>
                  {SITES.map((s, i) => (
                    <button key={s} onClick={() => { setFld("ivSite", s); setFld("showSite", false); }} style={{
                      width: "100%", padding: "10px 14px", background: f.ivSite === s ? c.l : "#fff",
                      border: "none", borderBottom: i < SITES.length - 1 ? "1px solid #F2F3F7" : "none",
                      textAlign: "left", fontSize: 13, fontWeight: f.ivSite === s ? 700 : 500,
                      color: f.ivSite === s ? c.p : "#374151", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      {s}
                      {f.ivSite === s && <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.p }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormCard>
  );
}
