import { useState, useEffect, useMemo } from "react";
import { db, getSetting, setSetting, callsToCSV, downloadCSV, type CallRecord } from "../db";
import { HOME_COLOR, TH, T_CHIPS, M_CHIPS, type Screen, type UType } from "./constants";
import { blankForm, callToForm, dateStr, sevenDaysAgo, type CallForm } from "./callForm";
import { ExportScreen } from "./screens/ExportScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { NewCallScreen } from "./screens/NewCallScreen";

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
  const setFld = <K extends keyof CallForm>(k: K, v: CallForm[K]) =>
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
  function formSnapshot(form: CallForm) {
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

  // ══════════════════════════════════════════════════════════
  // EXPORT SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "export") {
    return (
      <ExportScreen
        totalCalls={savedCalls.length}
        ivsTotal={ivsTotal}
        medsTotal={medsTotal}
        onBack={() => setScreen("home")}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
      />
    );
  }

  // ══════════════════════════════════════════════════════════
  // HOME SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "home") {
    return (
      <HomeScreen
        savedCalls={savedCalls}
        callsToday={callsToday}
        callsWeek={callsWeek}
        ivsTotal={ivsTotal}
        medsTotal={medsTotal}
        today={today}
        navTab={navTab}
        setNavTab={setNavTab}
        unitType={unitType}
        unitNum={unitNum}
        showUnitModal={showUnitModal}
        onOpenUnitModal={() => setShowUnitModal(true)}
        onCloseUnitModal={() => setShowUnitModal(false)}
        onSetUnitType={setUnitType}
        onSetUnitNum={setUnitNum}
        onSaveUnitPrefs={saveUnitPrefs}
        deleteTarget={deleteTarget}
        onSetDeleteTarget={setDeleteTarget}
        onConfirmDelete={confirmDelete}
        onOpenCall={openEditCall}
        onExport={() => setScreen("export")}
        onNewCall={startNewCall}
      />
    );
  }

  // ══════════════════════════════════════════════════════════
  // NEW CALL SCREEN
  // ══════════════════════════════════════════════════════════
  return (
    <NewCallScreen
      f={f}
      setFld={setFld}
      c={c}
      editingCallId={editingCallId}
      isLocked={isLocked}
      today={today}
      chips={chips}
      complaintSuggestions={complaintSuggestions}
      navTab={navTab}
      setNavTab={setNavTab}
      unitType={unitType}
      unitNum={unitNum}
      showUnitModal={showUnitModal}
      onOpenUnitModal={() => setShowUnitModal(true)}
      onCloseUnitModal={() => setShowUnitModal(false)}
      onSetUnitType={setUnitType}
      onSetUnitNum={setUnitNum}
      onSaveUnitPrefs={saveUnitPrefs}
      showCancelWarning={showCancelWarning}
      onKeepEditing={() => setShowCancelWarning(false)}
      onDiscard={doCancel}
      onSave={() => saveCall(isLocked)}
      onExport={() => setScreen("export")}
      onToggleLock={() => setIsLocked(prev => !prev)}
      onTryCancel={tryCancel}
    />
  );
}
