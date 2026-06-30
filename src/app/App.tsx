import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Settings, BarChart2,
  Plus, Check, MapPin, Zap, Heart, X, Minus,
  Download, Activity, Trash2, Lock,
} from "lucide-react";
import { db, getSetting, setSetting, callsToCSV, downloadCSV, type CallRecord } from "../db";

// ── Types ────────────────────────────────────────────────────
type Screen = "home" | "newCall" | "export";
type Mode   = "trauma" | "medical";
type UType  = "B" | "IM" | "AM";
type LR     = "L" | "R";
// 5-level vital: "1"=low … "5"=high, ""=not assessed
type VitalLevel = "1" | "2" | "3" | "4" | "5" | "";

// ── Theme ────────────────────────────────────────────────────
const HOME_COLOR = { p: "#7B1FA2", l: "#F3E5F5", fab: "0 8px 28px rgba(123,31,162,0.42)" };
const TH = {
  trauma:  { p: "#D32F2F", l: "#FFEBEE", fab: "0 8px 28px rgba(211,47,47,0.42)" },
  medical: { p: "#1976D2", l: "#E3F2FD", fab: "0 8px 28px rgba(25,118,210,0.42)" },
} as const;

// 5-level colors: 1=blue, 2=sky, 3=green, 4=orange, 5=red
const SEG_COLORS = ["#3B82F6", "#60A5FA", "#16A34A", "#FB923C", "#DC2626"];

// ── Static data ───────────────────────────────────────────────
const GAUGES = [
  { g: "14G", bg: "#E65100", tx: "#fff" },
  { g: "16G", bg: "#616161", tx: "#fff" },
  { g: "18G", bg: "#2E7D32", tx: "#fff" },
  { g: "20G", bg: "#C2185B", tx: "#fff" },
  { g: "22G", bg: "#1565C0", tx: "#fff" },
  { g: "24G", bg: "#F9A825", tx: "#111" },
];
const SITES    = ["AC", "Hand", "Wrist", "Forearm", "EJ", "Other"];
const HOSPITALS = [
  "Emory Decatur", "Emory University", "Emory Midtown", "Emory Hillandale",
  "Grady", "Northside Atlanta", "Northside Gwinnett",
  "St. Joe's", "Piedmont Eastside", "Piedmont Eastside South Campus", "Piedmont Rockdale",
  "CHOA Arthur M. Blank", "CHOA Scottish Rite", "CHOA Hughes Spalding",
  "Southern Regional",
];
const T_CHIPS  = ["MVA", "Fall", "Assault", "GSW", "Burns", "Crush"];
const M_CHIPS  = ["Chest Pain", "Dyspnea", "AMS", "Seizure", "Syncope", "Stroke"];
const OXY_T    = ["Nasal Cannula", "NRB", "BVM", "CPAP"];
const FLUID    = [0, 250, 500, 1000];
const SEX_OPTS = ["M", "F", "Other"];
const AO_ITEMS = ["Person", "Place", "Time", "Event"] as const;

function dateStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function sevenDaysAgo() { return Date.now() - 7 * 24 * 60 * 60 * 1000; }

// ── Load an existing call into the form ──────────────────────
function callToForm(call: CallRecord): ReturnType<typeof blankForm> {
  return {
    mode: call.mode,
    ageYears: call.ageYears || "", ageMonths: call.ageMonths || "",
    sex: call.sex, complaint: call.complaint, activeChip: "",
    showComplaintSuggest: false,
    tCspine: call.tCspine, tBackboard: call.tBackboard, tSplint: call.tSplint, tBandage: call.tBandage,
    oxyOn: call.oxyOn, oxyOpen: call.oxyOn, oxyType: call.oxyType, oxyLiters: call.oxyLiters,
    medOn: call.medOn, medOpen: call.medOn, salineAmt: call.salineAmt, lrAmt: call.lrAmt, zofran: call.zofran, toradol: call.toradol,
    leadOn: call.leadOn, leadOpen: call.leadOn, leadInterp: call.leadInterp,
    ivOn: call.ivOn, gauge: call.gauge, ivLR: (call.ivLR || "R") as "L" | "R", ivSite: call.ivSite, showSite: false,
    hr: (call.hr || "") as VitalLevel, bp: (call.bp || "") as VitalLevel,
    spo2: (call.spo2 || "") as VitalLevel, rr: (call.rr || "") as VitalLevel,
    glucose: (call.glucose || "") as VitalLevel, gcs: call.gcs,
    alertOriented: call.alertOriented ? call.alertOriented.split(",").filter(Boolean) : [],
    allergies: call.allergies, medHistory: call.medHistory, notes: call.notes,
    callStatus: (call.callStatus || "") as "" | "cancelled_enroute" | "cancelled_onscene",
    hospital: call.hospital || "",
    transportMode: ((call as any).transportMode || "hospital") as "hospital" | "refusal",
  };
}

// ── Blank call form ───────────────────────────────────────────
function blankForm() {
  return {
    mode: "medical" as Mode,
    ageYears: "", ageMonths: "", sex: "", complaint: "", activeChip: "",
    showComplaintSuggest: false,
    tCspine: false, tBackboard: false, tSplint: false, tBandage: false,
    oxyOn: false, oxyOpen: false, oxyType: "Nasal Cannula", oxyLiters: 2,
    medOn: false, medOpen: false, salineAmt: 0, lrAmt: 0, zofran: false, toradol: false,
    leadOn: false, leadOpen: false, leadInterp: "",
    ivOn: false, gauge: "18G", ivLR: "R" as LR, ivSite: "AC", showSite: false,
    hr: "" as VitalLevel, bp: "" as VitalLevel, spo2: "" as VitalLevel,
    rr: "" as VitalLevel, glucose: "" as VitalLevel,
    gcs: "",
    alertOriented: [] as string[],
    allergies: "", medHistory: "", notes: "",
    callStatus: "" as "" | "cancelled_enroute" | "cancelled_onscene",
    hospital: "",
    transportMode: "hospital" as "hospital" | "refusal",
  };
}

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [screen,    setScreen]    = useState<Screen>("home");
  const [navTab,    setNavTab]    = useState("stats");

  const [unitNum,       setUnitNum]       = useState("12");
  const [unitType,      setUnitType]      = useState<UType>("B");
  const [showUnitModal,     setShowUnitModal]     = useState(false);
  const [deleteTarget,      setDeleteTarget]      = useState<number | null>(null);
  const [editingCallId,     setEditingCallId]     = useState<number | null>(null);
  const [isLocked,          setIsLocked]          = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [initialForm,       setInitialForm]       = useState(blankForm());

  const [f, setF] = useState(blankForm());
  const setFld = <K extends keyof ReturnType<typeof blankForm>>(k: K, v: ReturnType<typeof blankForm>[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  const [savedCalls, setSavedCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    async function init() {
      const [num, type] = await Promise.all([getSetting("unitNum", "12"), getSetting("unitType", "B")]);
      setUnitNum(num);
      setUnitType(type as UType);
      const calls = await db.calls.orderBy("timestamp").reverse().limit(100).toArray();
      setSavedCalls(calls);
    }
    init();
  }, []);

  // unique past complaints for autocomplete
  const pastComplaints = useMemo(() =>
    [...new Set(savedCalls.map(c => c.complaint).filter(Boolean))],
    [savedCalls]
  );

  const today = dateStr();
  const c = TH[f.mode];

  const callsToday = savedCalls.filter(c => c.date === today).length;
  const callsWeek  = savedCalls.filter(c => c.timestamp >= sevenDaysAgo()).length;
  const ivsTotal   = savedCalls.filter(c => c.ivOn).length;
  const medsTotal  = savedCalls.filter(c => c.medOn).length;

  const chips = f.mode === "trauma" ? T_CHIPS : M_CHIPS;

  // complaint suggestions filtered by current input
  const complaintSuggestions = f.complaint.length > 0
    ? pastComplaints.filter(p => p.toLowerCase().includes(f.complaint.toLowerCase()) && p !== f.complaint)
    : [];

  // Fields that are UI-only and don't count as "dirty"
  const UI_FIELDS = ["showComplaintSuggest", "showSite", "oxyOpen", "medOpen", "leadOpen", "activeChip"] as const;
  function formSnapshot(form: ReturnType<typeof blankForm>) {
    const copy = { ...form } as Record<string, unknown>;
    UI_FIELDS.forEach(k => delete copy[k]);
    return JSON.stringify(copy);
  }
  function isDirty() { return formSnapshot(f) !== formSnapshot(initialForm); }

  function doCancel() {
    setEditingCallId(null);
    setIsLocked(false);
    setShowCancelWarning(false);
    setScreen("home");
  }

  function tryCancel() {
    if (isDirty()) setShowCancelWarning(true);
    else doCancel();
  }

  function startNewCall() {
    const blank = blankForm();
    setF(blank);
    setInitialForm(blank);
    setEditingCallId(null);
    setIsLocked(false);
    setScreen("newCall");
  }

  function openEditCall(call: CallRecord) {
    const form = callToForm(call);
    setF(form);
    setInitialForm(form);
    setEditingCallId(call.id ?? null);
    setIsLocked(call.locked ?? false);
    setScreen("newCall");
  }

  async function saveCall(locked: boolean) {
    const { ageYears, ageMonths } = f;
    const age = ageYears
      ? (ageMonths ? `${ageYears}y ${ageMonths}m` : `${ageYears}y`)
      : (ageMonths ? `${ageMonths}m` : "");

    const record: Omit<CallRecord, "id"> = {
      date: editingCallId
        ? (savedCalls.find(c => c.id === editingCallId)?.date ?? today)
        : today,
      timestamp: editingCallId
        ? (savedCalls.find(c => c.id === editingCallId)?.timestamp ?? Date.now())
        : Date.now(),
      unitNum, unitType, mode: f.mode,
      age, ageYears, ageMonths,
      sex: f.sex, complaint: f.complaint,
      hr: f.hr, bp: f.bp, spo2: f.spo2, rr: f.rr, gcs: f.gcs, glucose: f.glucose,
      alertOriented: f.alertOriented.join(","),
      tCspine: f.tCspine, tBackboard: f.tBackboard, tSplint: f.tSplint, tBandage: f.tBandage,
      oxyOn: f.oxyOn, oxyType: f.oxyType, oxyLiters: f.oxyLiters,
      medOn: f.medOn, salineAmt: f.salineAmt, lrAmt: f.lrAmt, zofran: f.zofran, toradol: f.toradol,
      leadOn: f.leadOn, leadInterp: f.leadInterp,
      ivOn: f.ivOn, gauge: f.gauge, ivLR: f.ivLR, ivSite: f.ivSite,
      allergies: f.allergies, medHistory: f.medHistory, notes: f.notes,
      callStatus: f.callStatus,
      hospital: f.transportMode === "refusal" ? "" : f.hospital,
      transportMode: f.transportMode,
      locked,
    };

    if (editingCallId != null) {
      await db.calls.update(editingCallId, record);
    } else {
      await db.calls.add(record as CallRecord);
    }
    const updated = await db.calls.orderBy("timestamp").reverse().limit(100).toArray();
    setSavedCalls(updated);
    setEditingCallId(null);
    setIsLocked(false);
    setScreen("home");
  }

  async function confirmDelete() {
    if (deleteTarget == null) return;
    await db.calls.delete(deleteTarget);
    const updated = await db.calls.orderBy("timestamp").reverse().limit(100).toArray();
    setSavedCalls(updated);
    setDeleteTarget(null);
  }

  async function saveUnitPrefs() {
    await Promise.all([setSetting("unitNum", unitNum), setSetting("unitType", unitType)]);
    setShowUnitModal(false);
  }

  async function exportCSV() {
    const all = await db.calls.orderBy("timestamp").toArray();
    downloadCSV(callsToCSV(all), `ems-calls-${today.replace(/ /g, "-")}.csv`);
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const all = await db.calls.orderBy("timestamp").reverse().toArray();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = 20;
    doc.setFontSize(20); doc.setTextColor(HOME_COLOR.p);
    doc.text("EMS Call Report", 20, y); y += 8;
    doc.setFontSize(9); doc.setTextColor("#666666");
    doc.text(`Unit ${unitType}-${unitNum} · Generated ${today} · ${all.length} calls`, 20, y); y += 10;
    for (const call of all) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(call.mode === "trauma" ? "#FFEBEE" : "#E3F2FD");
      doc.roundedRect(15, y, 180, 7, 1, 1, "F");
      doc.setFontSize(10);
      doc.setTextColor(call.mode === "trauma" ? "#D32F2F" : "#1976D2");
      doc.text(`${call.date}  ·  ${call.complaint || "No complaint"}  ·  Age ${call.age || "—"}  ${call.sex || ""}`, 18, y + 5);
      y += 9;
      doc.setFontSize(8); doc.setTextColor("#374151");
      doc.text(`HR:${call.hr||"—"} BP:${call.bp||"—"} SpO2:${call.spo2||"—"} RR:${call.rr||"—"} GCS:${call.gcs||"—"} A&O:${call.alertOriented||"—"}`, 18, y);
      y += 5;
      const tx: string[] = [];
      if (call.oxyOn) tx.push(`O2 ${call.oxyType} ${call.oxyLiters}L`);
      if (call.ivOn) tx.push(`IV ${call.gauge} ${call.ivLR}·${call.ivSite}`);
      if (call.medOn) {
        if (call.salineAmt) tx.push(`NS ${call.salineAmt}mL`);
        if (call.lrAmt) tx.push(`LR ${call.lrAmt}mL`);
        if (call.zofran) tx.push("Zofran");
        if (call.toradol) tx.push("Toradol");
      }
      if (tx.length) { doc.text("Tx: " + tx.join(" · "), 18, y); y += 5; }
      if (call.notes) { const lines = doc.splitTextToSize(`Notes: ${call.notes}`, 172); doc.text(lines, 18, y); y += lines.length * 4.5; }
      y += 3;
    }
    doc.save(`ems-calls-${today.replace(/ /g, "-")}.pdf`);
  }

  // ── Unit Modal ─────────────────────────────────────────────
  const UnitModal = showUnitModal ? (
    <div onClick={() => setShowUnitModal(false)} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={sheetTitle}>Unit Setup</h3>
        <div style={uLabelStyle}>Unit Type</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["B", "IM", "AM"] as UType[]).map(t => (
            <button key={t} onClick={() => setUnitType(t)} style={{
              flex: 1, padding: "13px 0", borderRadius: 12, cursor: "pointer",
              border: `1.5px solid ${unitType === t ? HOME_COLOR.p : "#E2E5EC"}`,
              background: unitType === t ? HOME_COLOR.l : "#F8F9FC",
              color: unitType === t ? HOME_COLOR.p : "#9ca3af",
              fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        <div style={uLabelStyle}>Unit Number</div>
        <input type="text" value={unitNum} onChange={e => setUnitNum(e.target.value)}
          style={{ ...textInputStyle, borderColor: `${HOME_COLOR.p}55`, fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, marginBottom: 28 }} />
        <button onClick={saveUnitPrefs} style={{ ...primaryBtn, background: HOME_COLOR.p }}>Done</button>
      </div>
    </div>
  ) : null;

  // ── Delete Confirmation Modal ──────────────────────────────
  const DeleteModal = deleteTarget != null ? (
    <div onClick={() => setDeleteTarget(null)} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={{ ...sheetTitle, color: "#D32F2F" }}>Delete this call?</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmDelete} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D32F2F", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Cancel Warning Modal ───────────────────────────────────
  const CancelWarningModal = showCancelWarning ? (
    <div onClick={() => setShowCancelWarning(false)} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={dragHandle} />
        <h3 style={{ ...sheetTitle, color: "#D97706" }}>Discard changes?</h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
          {editingCallId != null
            ? "You have unsaved edits to this call. Leaving now will discard them."
            : "Information has been entered. Leaving now will discard this call."}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowCancelWarning(false)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 15, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Keep Editing</button>
          <button onClick={doCancel} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "#D97706", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Discard</button>
        </div>
      </div>
    </div>
  ) : null;

  // ══════════════════════════════════════════════════════════
  // EXPORT SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "export") {
    return (
      <PhoneShell>
        <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Back</button>
          <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800 }}>Export Data</h1>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>{savedCalls.length} calls stored</div>
        </div>
        <CurvedShelf bg={HOME_COLOR.p} />
        <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <FormCard accent={HOME_COLOR.p}>
            <CardHead color={HOME_COLOR.p} label="Export Calls" />
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Download all records from your local database.</p>
            <button onClick={exportCSV} style={{ ...primaryBtn, background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Download size={16} color="#fff" /> Export as CSV
            </button>
            <button onClick={exportPDF} style={{ ...primaryBtn, background: HOME_COLOR.p, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Download size={16} color="#fff" /> Export as PDF
            </button>
          </FormCard>
          <FormCard accent={HOME_COLOR.p}>
            <CardHead color={HOME_COLOR.p} label="Stats" />
            <div style={{ display: "flex", gap: 8 }}>
              <StatCard label="Total" value={savedCalls.length} color={HOME_COLOR.p} light={HOME_COLOR.l} />
              <StatCard label="IVs"   value={ivsTotal}          color={HOME_COLOR.p} light={HOME_COLOR.l} />
              <StatCard label="Meds"  value={medsTotal}         color={HOME_COLOR.p} light={HOME_COLOR.l} />
            </div>
          </FormCard>
        </div>
      </PhoneShell>
    );
  }

  // ══════════════════════════════════════════════════════════
  // HOME SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "home") {
    return (
      <PhoneShell>
        {UnitModal}
        {DeleteModal}
        <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={eyebrow}>EMS Dashboard</div>
              <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Overview</h1>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, marginTop: 5 }}>{today}</div>
            </div>
            <button onClick={() => setShowUnitModal(true)} style={unitPill}>{unitType}-{unitNum}</button>
          </div>
        </div>
        <CurvedShelf bg={HOME_COLOR.p} />

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
          <SLabel>Calls</SLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatCard label="Today"     value={callsToday}        color={HOME_COLOR.p} light={HOME_COLOR.l} />
            <StatCard label="This Week" value={callsWeek}         color={HOME_COLOR.p} light={HOME_COLOR.l} />
            <StatCard label="All Time"  value={savedCalls.length} color={HOME_COLOR.p} light={HOME_COLOR.l} />
          </div>
          <SLabel>Procedures</SLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatCard label="IVs Done"   value={ivsTotal}  color={HOME_COLOR.p} light={HOME_COLOR.l} />
            <StatCard label="Meds Given" value={medsTotal} color={HOME_COLOR.p} light={HOME_COLOR.l} />
          </div>

          {savedCalls.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SLabel>Recent Calls</SLabel>
                <button onClick={() => setScreen("export")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: HOME_COLOR.p, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <Download size={12} color={HOME_COLOR.p} /> Export
                </button>
              </div>
              {savedCalls.slice(0, 10).map(call => (
                <div key={call.id}
                  onClick={() => openEditCall(call)}
                  style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: `1.5px solid ${(call as any).locked ? "#D1D5DB" : "#E2E5EC"}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: TH[call.mode].p, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0d1117", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {call.complaint || "No complaint recorded"}
                        </span>
                        {(call as any).locked && <Lock size={11} color="#9ca3af" />}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                        Unit {call.unitType}-{call.unitNum} · {call.date}{call.age ? ` · ${call.age}` : ""}{call.hospital ? ` → ${call.hospital}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                    {call.callStatus === "cancelled_enroute" && <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Cxl En Route</span>}
                    {call.callStatus === "cancelled_onscene" && <span style={{ background: "#FFEDD5", color: "#C2410C", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Cxl On Scene</span>}
                    {(call as any).transportMode === "refusal" && <span style={{ background: "#FFE4E6", color: "#BE123C", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>Refusal</span>}
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(call.id ?? null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
                      <Trash2 size={14} color="#D1D5DB" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No calls yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Tap + to log your first call</div>
            </div>
          )}
        </div>

        <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={startNewCall} onExport={() => setScreen("export")} />
      </PhoneShell>
    );
  }

  // ══════════════════════���═══════════════════════════════════
  // NEW CALL SCREEN
  // ══════════════════════════════════════════════════════════
  return (
    <PhoneShell>
      {UnitModal}
      {CancelWarningModal}

      <div style={{ background: c.p, padding: "16px 20px 0", transition: "background 0.3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...eyebrow, marginBottom: 2 }}>{editingCallId != null ? "Editing Call" : "New Call"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {f.mode === "trauma" ? <Zap size={17} color="#fff" fill="#fff" /> : <Heart size={17} color="#fff" fill="#fff" />}
              <h1 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.complaint || (editingCallId != null ? "Edit Call" : "New Call")}
              </h1>
            </div>
          </div>
          <button onClick={() => setShowUnitModal(true)} style={{ ...unitPill, marginLeft: 10 }}>{unitType}-{unitNum}</button>
        </div>

        <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 12, padding: 3, display: "flex", marginBottom: 12 }}>
          {(["trauma", "medical"] as Mode[]).map(m => (
            <button key={m} onClick={() => setFld("mode", m)} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, transition: "all 0.22s ease",
              background: f.mode === m ? "#fff" : "transparent",
              color: f.mode === m ? c.p : "rgba(255,255,255,0.72)",
              boxShadow: f.mode === m ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
            }}>{m === "trauma" ? "Trauma" : "Medical"}</button>
          ))}
        </div>

        <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.92)", alignSelf: "flex-start" }}>
            {today}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([
              { key: "cancelled_enroute",  label: "Cancelled: En Route", color: "#F59E0B" },
              { key: "cancelled_onscene",  label: "Cancelled: On Scene", color: "#FB923C" },
            ] as const).map(opt => {
              const active = f.callStatus === opt.key;
              return (
                <button key={opt.key}
                  onClick={() => setFld("callStatus", active ? "" : opt.key)}
                  style={{
                    padding: "4px 11px", borderRadius: 100, cursor: "pointer",
                    border: `1.5px solid ${active ? "#fff" : "rgba(255,255,255,0.35)"}`,
                    background: active ? "#fff" : "rgba(255,255,255,0.12)",
                    color: active ? opt.color : "rgba(255,255,255,0.75)",
                    fontSize: 11, fontWeight: active ? 800 : 600,
                    transition: "all 0.15s",
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>
      </div>
      <CurvedShelf bg={c.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 104px", scrollbarWidth: "none" }}
        onClick={() => { setFld("showSite", false); setFld("showComplaintSuggest", false); }}>



        <div style={{ padding: "0 16px", pointerEvents: isLocked ? "none" : undefined }}>

          {/* ─ Patient Basics ─────────────────────────────── */}
          <FormCard accent={c.p}>
            <CardHead color={c.p} label="Patient Basics" />
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

              {/* Age pill — wider rect so nothing clips */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 88, borderRadius: 16,
                  border: `2px solid ${c.p}`, background: c.l,
                  padding: "10px 8px 8px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  {/* Years row */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <input
                      type="number" min={0} max={120} placeholder="—" value={f.ageYears}
                      onChange={e => setFld("ageYears", e.target.value)}
                      style={{ width: 44, background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 22, fontWeight: 800, color: f.ageYears ? c.p : "#c4c8d0", fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, color: `${c.p}99` }}>yrs</span>
                  </div>
                  {/* Divider */}
                  <div style={{ width: "70%", height: 1, background: `${c.p}30` }} />
                  {/* Months row */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <input
                      type="number" min={0} max={12} placeholder="—" value={f.ageMonths}
                      onChange={e => setFld("ageMonths", e.target.value)}
                      style={{ width: 44, background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 16, fontWeight: 700, color: f.ageMonths ? c.p : "#c4c8d0", fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, color: `${c.p}99` }}>mo</span>
                  </div>
                </div>
                <span style={microLabel}>AGE</span>
                {/* Sex */}
                <div style={{ display: "flex", gap: 3 }}>
                  {SEX_OPTS.map(s => (
                    <button key={s} onClick={() => setFld("sex", f.sex === s ? "" : s)} style={{
                      padding: "3px 6px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                      border: `1.5px solid ${f.sex === s ? c.p : "#E2E5EC"}`,
                      background: f.sex === s ? c.l : "#F8F9FC",
                      color: f.sex === s ? c.p : "#9ca3af",
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Complaint with autocomplete */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...microLabel, display: "block", marginBottom: 5 }}>CHIEF COMPLAINT</span>
                <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                  <div style={{ background: "#F8F9FC", border: `1.5px solid ${f.complaint ? c.p + "66" : "#E2E5EC"}`, borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
                    <input type="text" placeholder="Type complaint…" value={f.complaint}
                      onChange={e => { setFld("complaint", e.target.value); setFld("activeChip", ""); setFld("showComplaintSuggest", true); }}
                      onFocus={() => setFld("showComplaintSuggest", true)}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: f.complaint ? 600 : 400, color: f.complaint ? "#0d1117" : "#A0A6B4", fontFamily: "'Inter', sans-serif" }} />
                    {f.complaint && (
                      <button onClick={() => { setFld("complaint", ""); setFld("activeChip", ""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <X size={14} color="#9ca3af" />
                      </button>
                    )}
                  </div>
                  {/* Autocomplete dropdown */}
                  {f.showComplaintSuggest && complaintSuggestions.length > 0 && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2E5EC", borderRadius: 12, overflow: "hidden", zIndex: 60, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
                      {complaintSuggestions.slice(0, 5).map((s, i, arr) => (
                        <button key={s} onClick={() => { setFld("complaint", s); setFld("activeChip", ""); setFld("showComplaintSuggest", false); }}
                          style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "none", borderBottom: i < arr.length - 1 ? "1px solid #F2F3F7" : "none", textAlign: "left", fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Chips */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                  {chips.map(chip => (
                    <button key={chip} onClick={() => {
                      if (f.activeChip === chip) { setFld("activeChip", ""); setFld("complaint", ""); }
                      else { setFld("activeChip", chip); setFld("complaint", chip); setFld("showComplaintSuggest", false); }
                    }} style={{
                      padding: "4px 10px", borderRadius: 100, cursor: "pointer",
                      border: `1.5px solid ${f.activeChip === chip ? c.p : "#E2E5EC"}`,
                      background: f.activeChip === chip ? c.l : "#F8F9FC",
                      color: f.activeChip === chip ? c.p : "#6b7280",
                      fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                    }}>{chip}</button>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          {/* ─ Vitals ─────────────────────────────────────── */}
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

          {/* ─ Interventions ──────────────────────────────── */}
          <FormCard accent={c.p}>
            <CardHead color={c.p} label="Interventions" />
            <div style={{ borderRadius: 12, border: "1.5px solid #ECEEF2", overflow: "visible" }}>
              {f.mode === "trauma" && (
                <>
                  <IntRow enabled={f.tCspine}    onToggle={() => setFld("tCspine", !f.tCspine)}       label="C-Spine Immobilization" color={c.p} />
                  <IntRow enabled={f.tBackboard} onToggle={() => setFld("tBackboard", !f.tBackboard)} label="Backboard"              color={c.p} />
                  <IntRow enabled={f.tSplint}    onToggle={() => setFld("tSplint", !f.tSplint)}       label="Extremity Splinting"    color={c.p} />
                  <IntRow enabled={f.tBandage}   onToggle={() => setFld("tBandage", !f.tBandage)}     label="Bandaging"              color={c.p} />
                </>
              )}

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
                last={f.mode !== "medical"}>
                <div style={{ padding: "2px 12px 14px 46px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <FluidRow label="Saline" value={f.salineAmt} onChange={v => setFld("salineAmt", v)} color={c.p} light={c.l} />
                  <FluidRow label="LR"     value={f.lrAmt}     onChange={v => setFld("lrAmt", v)}     color={c.p} light={c.l} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <DrugBtn active={f.zofran}  onClick={() => setFld("zofran", !f.zofran)}   label="Zofran"  color={c.p} light={c.l} />
                    <DrugBtn active={f.toradol} onClick={() => setFld("toradol", !f.toradol)} label="Toradol" color={c.p} light={c.l} />
                  </div>
                </div>
              </IntRow>

              {f.mode === "medical" && (
                <IntRow enabled={f.leadOn} onToggle={() => { const n = !f.leadOn; setFld("leadOn", n); if (n) setFld("leadOpen", true); }}
                  label="12-Lead ECG" color={c.p} expandable expanded={f.leadOpen} onToggleExpand={() => setFld("leadOpen", !f.leadOpen)} last>
                  <div style={{ padding: "2px 12px 14px 46px" }}>
                    <span style={{ ...microLabel, display: "block", marginBottom: 6 }}>INTERPRETATION</span>
                    <textarea placeholder="e.g. Normal sinus rhythm, STEMI inferior…" value={f.leadInterp}
                      onChange={e => setFld("leadInterp", e.target.value)} rows={3}
                      style={{ width: "100%", boxSizing: "border-box", background: "#F8F9FC", border: "1.5px solid #E2E5EC", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#0d1117", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }} />
                  </div>
                </IntRow>
              )}
            </div>
          </FormCard>

          {/* ─ IV Access ──────────────────────────────────── */}
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

          {/* ─ Patient History ────────────────────────────── */}
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

          {/* ─ Notes ─────────────────────────────────────── */}
          <FormCard accent={c.p}>
            <CardHead color={c.p} label="Notes" />
            <textarea placeholder="Additional notes, observations…" value={f.notes}
              onChange={e => setFld("notes", e.target.value)} rows={4}
              style={{ width: "100%", boxSizing: "border-box", background: "#F8F9FC", border: "1.5px solid #E2E5EC", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "#0d1117", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }} />
          </FormCard>

          {/* ─ Transport ─────────────────────────────────── */}
          <FormCard accent={c.p}>
            <CardHead color={c.p} label="Transport" />
            {/* Tab toggle */}
            <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
              {(["hospital", "refusal"] as const).map(tab => {
                const active = f.transportMode === tab;
                return (
                  <button key={tab} onClick={() => { setFld("transportMode", tab); if (tab === "refusal") setFld("hospital", ""); }}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                      background: active ? "#fff" : "transparent",
                      color: active ? (tab === "refusal" ? "#BE123C" : c.p) : "#9ca3af",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                    }}
                  >{tab === "hospital" ? "Hospital" : "Refusal"}</button>
                );
              })}
            </div>

            {f.transportMode === "hospital" ? (
              <select
                value={f.hospital}
                onChange={e => setFld("hospital", e.target.value)}
                style={{
                  width: "100%", appearance: "none", WebkitAppearance: "none",
                  background: `#F8F9FC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center`,
                  border: `1.5px solid ${f.hospital ? c.p + "66" : "#E2E5EC"}`,
                  borderRadius: 12, padding: "11px 36px 11px 13px",
                  fontSize: 14, fontWeight: f.hospital ? 600 : 400,
                  color: f.hospital ? "#0d1117" : "#A0A6B4",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="">Select hospital…</option>
                {HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FFE4E6", borderRadius: 12, border: "1.5px solid #FECDD3" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BE123C", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#BE123C" }}>Patient refused transport</span>
              </div>
            )}
          </FormCard>
        </div>
      </div>

      <BottomNav color={c.p} light={c.l} fabShadow={c.fab} navTab={navTab} setNavTab={setNavTab} isSave={true}
        onFAB={() => saveCall(isLocked)}
        onExport={() => setScreen("export")}
        onLock={() => setIsLocked(prev => !prev)}
        onCancel={tryCancel}
        isLocked={isLocked}
        lockColor={c.p}
      />
    </PhoneShell>
  );
}

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#c8cdd6", display: "flex", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", background: "#F2F3F7", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function CurvedShelf({ bg }: { bg: string }) {
  return (
    <div style={{ height: 18, background: bg, position: "relative", transition: "background 0.3s" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18, background: "#F2F3F7", borderRadius: "18px 18px 0 0" }} />
    </div>
  );
}

function FormCard({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", border: `1.5px solid ${accent}18`, boxShadow: "0 1px 5px rgba(0,0,0,0.05)", marginBottom: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </div>
  );
}

function CardHead({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.09em", textTransform: "uppercase", margin: "6px 0 6px" }}>{children}</div>;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string; light: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: "13px 14px", border: "1.5px solid #E2E5EC", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function IntRow({
  enabled, onToggle, label, color, expandable, expanded, onToggleExpand, last = false, children,
}: {
  enabled: boolean; onToggle: () => void; label: string; color: string;
  expandable?: boolean; expanded?: boolean; onToggleExpand?: () => void; last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid #F2F3F7" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px" }}>
        <button onClick={onToggle} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${enabled ? color : "#D1D5DB"}`, background: enabled ? color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}>
          {enabled && <Check size={12} color="#fff" strokeWidth={3} />}
        </button>
        <span onClick={onToggle} style={{ flex: 1, fontSize: 14, fontWeight: 600, color: enabled ? "#0d1117" : "#6b7280", cursor: "pointer" }}>{label}</span>
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

function FluidRow({ label, value, onChange, color, light }: { label: string; value: number; onChange: (v: number) => void; color: string; light: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", minWidth: 48, letterSpacing: "0.04em" }}>{label}</span>
      <div style={{ display: "flex", gap: 5 }}>
        {FLUID.map(a => (
          <button key={a} onClick={() => onChange(a)} style={{
            padding: "5px 9px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${value === a ? color : "#E2E5EC"}`,
            background: value === a ? light : "#F8F9FC",
            color: value === a ? color : "#6b7280",
            fontSize: 11, fontWeight: 700, transition: "all 0.15s",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{a === 0 ? "0" : `${a}`}</button>
        ))}
      </div>
    </div>
  );
}

function DrugBtn({ active, onClick, label, color, light }: { active: boolean; onClick: () => void; label: string; color: string; light: string }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${active ? color : "#E2E5EC"}`, background: active ? light : "#F8F9FC", color: active ? color : "#6b7280", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s" }}>
      {active && <Check size={13} color={color} strokeWidth={3} />}
      {label}
    </button>
  );
}

function BottomNav({ color, light, fabShadow, navTab, setNavTab, isSave, onFAB, onExport, onLock, onCancel, isLocked, lockColor }: {
  color: string; light: string; fabShadow: string; navTab: string; setNavTab: (t: string) => void;
  isSave: boolean; onFAB: () => void; onExport: () => void;
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
            {[{ key: "activity", I: Activity, l: "Calls" }, { key: "export", I: Download, l: "Export" }].map(({ key, I, l }) => {
              const active = navTab === key;
              return (
                <button key={key} onClick={() => { setNavTab(key); if (key === "export") onExport(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 44 }}>
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
            {[{ key: "stats", I: BarChart2, l: "Stats" }, { key: "settings", I: Settings, l: "Settings" }].map(({ key, I, l }) => {
              const active = navTab === key;
              return (
                <button key={key} onClick={() => setNavTab(key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 44 }}>
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

function VitalSlider({ label, value, onChange }: {
  label: string; value: VitalLevel; onChange: (v: VitalLevel) => void;
}) {
  // min=1,max=5 so positions 1–5 sit at 0%,25%,50%,75%,100% of the track
  // value="" = unset (gray, shown at midpoint visually)
  const unset = value === "";
  const num = unset ? 3 : parseInt(value);
  const thumbColor = unset ? "#C4C8D0" : SEG_COLORS[num - 1];
  const pct = ((num - 1) / 4) * 100;
  const trackBg = unset
    ? "#E8EAED"
    : `linear-gradient(to right, ${thumbColor} ${pct}%, #E8EAED ${pct}%)`;

  const activeColor = (pos: number) => (!unset && num === pos) ? SEG_COLORS[pos - 1] : "#C4C8D0";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Tap label to clear */}
      <span
        onClick={() => onChange("")}
        style={{ ...microLabel, minWidth: 52, fontSize: 10, cursor: "pointer" }}
        title="Tap to clear"
      >{label}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <input
          type="range" min={1} max={5} step={1} value={num}
          onChange={e => onChange(e.target.value as VitalLevel)}
          className="vital-slider"
          style={{
            "--thumb-color": thumbColor,
            background: trackBg,
            opacity: unset ? 0.45 : 1,
          } as React.CSSProperties}
        />
        {/* Low at left (0%), Normal at center (50%), High at right (100%) */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(1) }}>Low</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(3) }}>Normal</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: activeColor(5) }}>High</span>
        </div>
      </div>
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────
const microLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", textTransform: "uppercase",
};
const uLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", textTransform: "uppercase",
  display: "block", marginBottom: 8,
};
const unitPill: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 700,
  cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: "nowrap", flexShrink: 0,
};
const eyebrow: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600,
  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2,
};
const stepperBtn: React.CSSProperties = {
  width: 36, height: 36, background: "#F8F9FC", border: "none",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.48)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
};
const sheetStyle: React.CSSProperties = {
  width: "100%", maxWidth: 430, background: "#fff",
  borderRadius: "22px 22px 0 0", padding: "8px 24px 44px",
  boxShadow: "0 -4px 32px rgba(0,0,0,0.2)",
};
const dragHandle: React.CSSProperties = {
  width: 36, height: 4, borderRadius: 2, background: "#E2E5EC", margin: "12px auto 22px",
};
const sheetTitle: React.CSSProperties = {
  margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0d1117",
};
const textInputStyle: React.CSSProperties = {
  display: "block", width: "100%", boxSizing: "border-box",
  background: "#F2F3F7", border: "1.5px solid #E2E5EC", borderRadius: 11,
  padding: "11px 14px", fontSize: 14, fontWeight: 500, color: "#0d1117", outline: "none",
};
const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "15px 0", border: "none", borderRadius: 14,
  color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
};
