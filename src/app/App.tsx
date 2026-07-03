import { useState, useEffect, useMemo } from "react";
import { db, callsToCSV, downloadCSV, medsSummary, interventionsSummary, type CallRecord, type Shift, type Hospital, type Medication, type InterventionDef } from "../db";
import { HOME_COLOR, TH, T_CHIPS, M_CHIPS, HOSPITALS, DEFAULT_MEDS, DEFAULT_INTERVENTIONS, type Screen } from "./constants";
import { blankForm, callToForm, dateStr, dateStrFor, sevenDaysAgo, type CallForm } from "./callForm";
import { blankShiftDraft, toDatetimeLocalValue, fromDatetimeLocalValue, type ShiftDraft } from "./shiftForm";
import { callOutcomeSegments, hospitalCounts, ivSuccessStats, techedByUnitType as computeTechedByUnitType, acuitySegments } from "./callStats";
import { shiftSummaries, shiftsByUnitType as computeShiftsByUnitType, hoursByUnitType as computeHoursByUnitType } from "./shiftStats";
import { formatDuration } from "./shiftStats";
import { ExportScreen } from "./screens/ExportScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { NewCallScreen } from "./screens/NewCallScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [screen,    setScreen]    = useState<Screen>("home");
  const [navTab,    setNavTab]    = useState("activity");

  const [deleteTarget,      setDeleteTarget]      = useState<number | null>(null);
  const [editingCallId,     setEditingCallId]     = useState<number | null>(null);
  const [isLocked,          setIsLocked]          = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [initialForm,       setInitialForm]       = useState(blankForm());

  const [f, setF] = useState(blankForm());
  const setFld = <K extends keyof CallForm>(k: K, v: CallForm[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  const [savedCalls, setSavedCalls] = useState<CallRecord[]>([]);
  const [allCalls,   setAllCalls]   = useState<CallRecord[]>([]);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftManager, setShowShiftManager] = useState(false);
  const [shiftManagerTab,  setShiftManagerTab]  = useState<"add" | "history">("add");
  const [editingShiftId,   setEditingShiftId]   = useState<number | null>(null);
  const [deleteShiftTarget, setDeleteShiftTarget] = useState<number | null>(null);
  const [shiftDraft, setShiftDraftState] = useState<ShiftDraft>(blankShiftDraft());
  const setShiftFld = <K extends keyof ShiftDraft>(k: K, v: ShiftDraft[K]) =>
    setShiftDraftState(prev => ({ ...prev, [k]: v }));

  const [showNoShiftWarning, setShowNoShiftWarning] = useState(false);
  const [pendingSaveLocked,  setPendingSaveLocked]  = useState<boolean | null>(null);
  const [now, setNow] = useState(Date.now());

  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [deleteHospitalTarget, setDeleteHospitalTarget] = useState<number | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [deleteMedicationTarget, setDeleteMedicationTarget] = useState<number | null>(null);
  const [interventionDefs, setInterventionDefs] = useState<InterventionDef[]>([]);
  const [deleteInterventionTarget, setDeleteInterventionTarget] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      const [calls, all, allShifts] = await Promise.all([
        db.calls.orderBy("timestamp").reverse().limit(100).toArray(),
        db.calls.toArray(),
        db.shifts.toArray(),
      ]);
      setSavedCalls(calls);
      setAllCalls(all);
      setShifts(allShifts);

      let hospitalRows = await db.hospitals.toArray();
      if (hospitalRows.length === 0) {
        await db.hospitals.bulkAdd(HOSPITALS.map(name => ({ name })));
        hospitalRows = await db.hospitals.toArray();
      }
      setHospitals(hospitalRows);

      let medicationRows = await db.medications.toArray();
      if (medicationRows.length === 0) {
        await db.medications.bulkAdd(DEFAULT_MEDS.map(name => ({ name })));
        medicationRows = await db.medications.toArray();
      }
      setMedications(medicationRows);

      let interventionRows = await db.interventions.toArray();
      if (interventionRows.length === 0) {
        await db.interventions.bulkAdd(DEFAULT_INTERVENTIONS.map((d, order) => ({ ...d, order })));
        interventionRows = await db.interventions.toArray();
      }
      setInterventionDefs(interventionRows.sort((a, b) => a.order - b.order));
    }
    init();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
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
  const medsTotal  = savedCalls.filter(c => c.medOn).length;

  const outcomeSegments  = useMemo(() => callOutcomeSegments(allCalls), [allCalls]);
  const hospitalData     = useMemo(() => hospitalCounts(allCalls), [allCalls]);
  const ivStats          = useMemo(() => ivSuccessStats(allCalls), [allCalls]);
  const shiftHistory     = useMemo(() => shiftSummaries(shifts, allCalls), [shifts, allCalls]);
  const shiftsByUnitType = useMemo(() => computeShiftsByUnitType(shifts), [shifts]);
  const hoursByUnitType  = useMemo(() => computeHoursByUnitType(shifts), [shifts]);
  const techedByUnitType = useMemo(() => computeTechedByUnitType(allCalls), [allCalls]);
  const acuityData       = useMemo(() => acuitySegments(allCalls), [allCalls]);

  // Most recently started shift (by startTime) — used to prefill new shifts/calls.
  const mostRecentShift = useMemo(() =>
    [...shifts].sort((a, b) => b.startTime - a.startTime)[0] ?? null,
    [shifts]
  );
  // A shift with no endTime is treated as currently open, for the header pill.
  const openShift = useMemo(() => shifts.find(s => s.endTime == null) ?? null, [shifts]);

  const pillUnitLabel = mostRecentShift ? `${mostRecentShift.unitType}${mostRecentShift.unitNum}` : null;
  const pillElapsedLabel = openShift ? formatDuration(now - openShift.startTime) : undefined;

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

  // A call defaults to whichever shift most recently started (and has already
  // started, not a future one) — the tag stays freely editable per call.
  function defaultShiftIdForNewCall(): number | undefined {
    const eligible = shifts.filter(s => s.startTime <= Date.now()).sort((a, b) => b.startTime - a.startTime);
    return eligible[0]?.id;
  }

  function goExport() {
    setNavTab("export");
    setScreen("export");
  }

  function startNewCall() {
    const blank = blankForm();
    blank.shiftId = defaultShiftIdForNewCall();
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

    const editingCall = editingCallId != null ? savedCalls.find(c => c.id === editingCallId) : undefined;
    const taggedShift = f.shiftId != null ? shifts.find(s => s.id === f.shiftId) : undefined;

    const record: Omit<CallRecord, "id"> = {
      date: taggedShift ? dateStrFor(taggedShift.startTime) : (editingCall?.date ?? today),
      timestamp: editingCall?.timestamp ?? Date.now(),
      unitNum: taggedShift?.unitNum ?? "",
      unitType: taggedShift?.unitType ?? "",
      mode: f.mode,
      age, ageYears, ageMonths,
      sex: f.sex, complaint: f.complaint,
      hr: f.hr, bp: f.bp, spo2: f.spo2, rr: f.rr, gcs: f.gcs, glucose: f.glucose,
      alertOriented: f.alertOriented.join(","),
      interventions: f.interventions,
      oxyOn: f.oxyOn, oxyType: f.oxyType, oxyLiters: f.oxyLiters,
      medOn: f.medOn, salineAmt: f.salineAmt, lrAmt: f.lrAmt, meds: f.meds,
      zofran: false, toradol: false,
      ivOn: f.ivOn, gauge: f.gauge, ivLR: f.ivLR, ivSite: f.ivSite,
      ivEstablished: f.ivEstablished, ivAttempts: f.ivAttempts,
      allergies: f.allergies, medHistory: f.medHistory, notes: f.notes,
      callStatus: f.callStatus,
      techedCall: f.techedCall,
      acuity: f.acuity,
      hospital: f.transportMode === "refusal" ? "" : f.hospital,
      transportMode: f.transportMode,
      locked,
      shiftId: f.shiftId,
    };

    if (editingCallId != null) {
      await db.calls.update(editingCallId, record);
    } else {
      await db.calls.add(record as CallRecord);
    }
    const [updated, all] = await Promise.all([
      db.calls.orderBy("timestamp").reverse().limit(100).toArray(),
      db.calls.toArray(),
    ]);
    setSavedCalls(updated);
    setAllCalls(all);
    setEditingCallId(null);
    setIsLocked(false);
    setScreen("home");
  }

  function attemptSave(locked: boolean) {
    if (f.shiftId == null) {
      setPendingSaveLocked(locked);
      setShowNoShiftWarning(true);
    } else {
      saveCall(locked);
    }
  }

  function confirmSaveWithoutShift() {
    setShowNoShiftWarning(false);
    if (pendingSaveLocked != null) saveCall(pendingSaveLocked);
    setPendingSaveLocked(null);
  }

  function cancelNoShiftWarning() {
    setShowNoShiftWarning(false);
    setPendingSaveLocked(null);
  }

  // ── Shift manager (Add / Edit / History) ──────────────────────
  function openShiftManager() {
    const draft = blankShiftDraft();
    if (mostRecentShift) {
      draft.unitType = mostRecentShift.unitType as ShiftDraft["unitType"];
      draft.unitNum = mostRecentShift.unitNum;
    }
    setShiftDraftState(draft);
    setEditingShiftId(null);
    setShiftManagerTab("add");
    setShowShiftManager(true);
  }

  function startEditingShift(id: number) {
    const shift = shifts.find(s => s.id === id);
    if (!shift) return;
    setShiftDraftState({
      crew: shift.crew,
      unitType: shift.unitType as ShiftDraft["unitType"],
      unitNum: shift.unitNum,
      start: toDatetimeLocalValue(shift.startTime),
      endMode: shift.endTime != null ? "time" : "duration",
      end: shift.endTime != null ? toDatetimeLocalValue(shift.endTime) : "",
      durationHours: "",
    });
    setEditingShiftId(id);
    setShiftManagerTab("add");
  }

  function startNewShiftInManager() {
    const draft = blankShiftDraft();
    if (mostRecentShift) {
      draft.unitType = mostRecentShift.unitType as ShiftDraft["unitType"];
      draft.unitNum = mostRecentShift.unitNum;
    }
    setShiftDraftState(draft);
    setEditingShiftId(null);
  }

  async function saveShift() {
    const startTime = fromDatetimeLocalValue(shiftDraft.start);
    let endTime: number | undefined;
    if (shiftDraft.endMode === "time" && shiftDraft.end) {
      endTime = fromDatetimeLocalValue(shiftDraft.end);
    } else if (shiftDraft.endMode === "duration" && shiftDraft.durationHours) {
      const hrs = parseFloat(shiftDraft.durationHours);
      if (!isNaN(hrs) && hrs > 0) endTime = startTime + hrs * 3600000;
    }
    const record: Omit<Shift, "id"> = {
      startTime, endTime,
      crew: shiftDraft.crew,
      unitType: shiftDraft.unitType,
      unitNum: shiftDraft.unitNum,
    };

    if (editingShiftId != null) {
      await db.shifts.update(editingShiftId, record);
    } else {
      await db.shifts.add(record as Shift);
    }
    const allShifts = await db.shifts.toArray();
    setShifts(allShifts);
    setShowShiftManager(false);
    setEditingShiftId(null);
  }

  function closeShiftManager() {
    setShowShiftManager(false);
  }

  async function confirmDeleteShift() {
    if (deleteShiftTarget == null) return;
    await db.shifts.delete(deleteShiftTarget);
    if (editingShiftId === deleteShiftTarget) {
      startNewShiftInManager();
    }
    const allShifts = await db.shifts.toArray();
    setShifts(allShifts);
    setDeleteShiftTarget(null);
  }

  async function confirmDelete() {
    if (deleteTarget == null) return;
    await db.calls.delete(deleteTarget);
    const [updated, all] = await Promise.all([
      db.calls.orderBy("timestamp").reverse().limit(100).toArray(),
      db.calls.toArray(),
    ]);
    setSavedCalls(updated);
    setAllCalls(all);
    setDeleteTarget(null);
  }

  // ── Hospitals (Settings) ───────────────────────────────────
  async function addHospital(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (hospitals.some(h => h.name.toLowerCase() === trimmed.toLowerCase())) return;
    await db.hospitals.add({ name: trimmed });
    setHospitals(await db.hospitals.toArray());
  }

  function requestDeleteHospital(id: number) {
    setDeleteHospitalTarget(id);
  }

  function cancelDeleteHospital() {
    setDeleteHospitalTarget(null);
  }

  async function confirmDeleteHospital() {
    if (deleteHospitalTarget == null) return;
    await db.hospitals.delete(deleteHospitalTarget);
    setHospitals(await db.hospitals.toArray());
    setDeleteHospitalTarget(null);
  }

  const deleteHospitalName = deleteHospitalTarget != null
    ? hospitals.find(h => h.id === deleteHospitalTarget)?.name
    : undefined;
  const deleteHospitalUsageCount = deleteHospitalName
    ? allCalls.filter(c => c.hospital === deleteHospitalName).length
    : 0;
  const deleteHospitalMessage = deleteHospitalUsageCount > 0
    ? `This hospital is used on ${deleteHospitalUsageCount} saved call${deleteHospitalUsageCount === 1 ? "" : "s"}. Deleting it won't change those records, but it will no longer be selectable for future calls.`
    : undefined;

  // ── Medications (Settings) ─────────────────────────────────
  async function addMedication(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (medications.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) return;
    await db.medications.add({ name: trimmed });
    setMedications(await db.medications.toArray());
  }

  function requestDeleteMedication(id: number) {
    setDeleteMedicationTarget(id);
  }

  function cancelDeleteMedication() {
    setDeleteMedicationTarget(null);
  }

  async function confirmDeleteMedication() {
    if (deleteMedicationTarget == null) return;
    await db.medications.delete(deleteMedicationTarget);
    setMedications(await db.medications.toArray());
    setDeleteMedicationTarget(null);
  }

  async function setMedicationDefaultRoute(id: number, defaultRoute: string) {
    await db.medications.update(id, { defaultRoute });
    setMedications(await db.medications.toArray());
  }

  const deleteMedicationName = deleteMedicationTarget != null
    ? medications.find(m => m.id === deleteMedicationTarget)?.name
    : undefined;
  const deleteMedicationUsageCount = deleteMedicationName
    ? allCalls.filter(c => c.meds?.some(m => m.name === deleteMedicationName)).length
    : 0;
  const deleteMedicationMessage = deleteMedicationUsageCount > 0
    ? `This medication is used on ${deleteMedicationUsageCount} saved call${deleteMedicationUsageCount === 1 ? "" : "s"}. Deleting it won't change those records, but it will no longer be selectable for future calls.`
    : undefined;

  // ── Interventions (Settings) ───────────────────────────────
  // Oxygen and Medication are not stored here — they're fixed, always-on
  // rows built into the call form itself. This list is everything else,
  // scoped per mode (trauma/medical) so each has its own set of options.
  async function addIntervention(mode: "trauma" | "medical", name: string, notesEnabled: boolean) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (interventionDefs.some(d => d.mode === mode && d.name.toLowerCase() === trimmed.toLowerCase())) return;
    const maxOrder = Math.max(-1, ...interventionDefs.filter(d => d.mode === mode).map(d => d.order));
    await db.interventions.add({ name: trimmed, mode, notesEnabled, order: maxOrder + 1 });
    setInterventionDefs((await db.interventions.toArray()).sort((a, b) => a.order - b.order));
  }

  function requestDeleteIntervention(id: number) {
    setDeleteInterventionTarget(id);
  }

  function cancelDeleteIntervention() {
    setDeleteInterventionTarget(null);
  }

  async function confirmDeleteIntervention() {
    if (deleteInterventionTarget == null) return;
    await db.interventions.delete(deleteInterventionTarget);
    setInterventionDefs((await db.interventions.toArray()).sort((a, b) => a.order - b.order));
    setDeleteInterventionTarget(null);
  }

  async function setInterventionNotesEnabled(id: number, notesEnabled: boolean) {
    await db.interventions.update(id, { notesEnabled });
    setInterventionDefs((await db.interventions.toArray()).sort((a, b) => a.order - b.order));
  }

  // Swaps `order` with the adjacent sibling in the same mode, so custom
  // interventions can be reordered without a drag-and-drop library.
  async function moveIntervention(id: number, direction: "up" | "down") {
    const def = interventionDefs.find(d => d.id === id);
    if (!def) return;
    const siblings = interventionDefs.filter(d => d.mode === def.mode).sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex(d => d.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    await Promise.all([
      db.interventions.update(def.id!, { order: other.order }),
      db.interventions.update(other.id!, { order: def.order }),
    ]);
    setInterventionDefs((await db.interventions.toArray()).sort((a, b) => a.order - b.order));
  }

  const deleteInterventionName = deleteInterventionTarget != null
    ? interventionDefs.find(d => d.id === deleteInterventionTarget)?.name
    : undefined;
  const deleteInterventionUsageCount = deleteInterventionName
    ? allCalls.filter(c => c.interventions?.some(i => i.name === deleteInterventionName)).length
    : 0;
  const deleteInterventionMessage = deleteInterventionUsageCount > 0
    ? `This intervention is used on ${deleteInterventionUsageCount} saved call${deleteInterventionUsageCount === 1 ? "" : "s"}. Deleting it won't change those records, but it will no longer be selectable for future calls.`
    : undefined;

  function requestClearData() {
    setShowClearDataConfirm(true);
  }

  function cancelClearData() {
    setShowClearDataConfirm(false);
  }

  async function confirmClearData() {
    await Promise.all([db.calls.clear(), db.shifts.clear(), db.settings.clear()]);
    setSavedCalls([]);
    setAllCalls([]);
    setShifts([]);
    setDeleteTarget(null);
    setDeleteShiftTarget(null);
    setEditingCallId(null);
    setIsLocked(false);
    setShowShiftManager(false);
    setEditingShiftId(null);
    setShiftDraftState(blankShiftDraft());
    const blank = blankForm();
    setF(blank);
    setInitialForm(blank);
    setShowClearDataConfirm(false);
    setScreen("home");
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
    const unitLine = pillUnitLabel ? `Unit ${pillUnitLabel} · ` : "";
    doc.text(`${unitLine}Generated ${today} · ${all.length} calls`, 20, y); y += 10;
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
        const meds = medsSummary(call);
        if (meds) tx.push(meds);
      }
      const ivx = interventionsSummary(call);
      if (ivx) tx.push(ivx);
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
        navTab={navTab}
        setNavTab={setNavTab}
        onHome={() => setScreen("home")}
        onNewCall={startNewCall}
        onStats={() => setScreen("stats")}
        onSettings={() => setScreen("settings")}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
      />
    );
  }

  // ══════════════════════════════════════════════════════════
  // STATS SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "stats") {
    return (
      <StatsScreen
        totalCalls={allCalls.length}
        outcomeSegments={outcomeSegments}
        hospitalData={hospitalData}
        ivStats={ivStats}
        shiftHistory={shiftHistory}
        shiftsByUnitType={shiftsByUnitType}
        hoursByUnitType={hoursByUnitType}
        techedByUnitType={techedByUnitType}
        acuityData={acuityData}
        navTab={navTab}
        setNavTab={setNavTab}
        onHome={() => setScreen("home")}
        onExport={goExport}
        onNewCall={startNewCall}
        onSettings={() => setScreen("settings")}
        pillUnitLabel={pillUnitLabel}
        pillElapsedLabel={pillElapsedLabel}
        showShiftManager={showShiftManager}
        shiftManagerTab={shiftManagerTab}
        setShiftManagerTab={setShiftManagerTab}
        shiftDraft={shiftDraft}
        setShiftFld={setShiftFld}
        editingShiftId={editingShiftId}
        onOpenShiftManager={openShiftManager}
        onCloseShiftManager={closeShiftManager}
        onSaveShift={saveShift}
        onNewShiftInManager={startNewShiftInManager}
        onSelectHistoryShift={startEditingShift}
        deleteShiftTarget={deleteShiftTarget}
        onRequestDeleteShift={setDeleteShiftTarget}
        onCancelDeleteShift={() => setDeleteShiftTarget(null)}
        onConfirmDeleteShift={confirmDeleteShift}
      />
    );
  }

  // ══════════════════════════════════════════════════════════
  // SETTINGS SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "settings") {
    return (
      <SettingsScreen
        navTab={navTab}
        setNavTab={setNavTab}
        onHome={() => setScreen("home")}
        onStats={() => setScreen("stats")}
        onExport={goExport}
        onNewCall={startNewCall}
        showClearDataConfirm={showClearDataConfirm}
        onRequestClearData={requestClearData}
        onCancelClearData={cancelClearData}
        onConfirmClearData={confirmClearData}
        hospitals={hospitals}
        onAddHospital={addHospital}
        deleteHospitalTarget={deleteHospitalTarget}
        deleteHospitalMessage={deleteHospitalMessage}
        onRequestDeleteHospital={requestDeleteHospital}
        onCancelDeleteHospital={cancelDeleteHospital}
        onConfirmDeleteHospital={confirmDeleteHospital}
        medications={medications}
        onAddMedication={addMedication}
        deleteMedicationTarget={deleteMedicationTarget}
        deleteMedicationMessage={deleteMedicationMessage}
        onRequestDeleteMedication={requestDeleteMedication}
        onCancelDeleteMedication={cancelDeleteMedication}
        onConfirmDeleteMedication={confirmDeleteMedication}
        onSetMedicationDefaultRoute={setMedicationDefaultRoute}
        interventionDefs={interventionDefs}
        onAddIntervention={addIntervention}
        deleteInterventionTarget={deleteInterventionTarget}
        deleteInterventionMessage={deleteInterventionMessage}
        onRequestDeleteIntervention={requestDeleteIntervention}
        onCancelDeleteIntervention={cancelDeleteIntervention}
        onConfirmDeleteIntervention={confirmDeleteIntervention}
        onSetInterventionNotesEnabled={setInterventionNotesEnabled}
        onMoveIntervention={moveIntervention}
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
        ivSuccessRate={ivStats.rate}
        medsTotal={medsTotal}
        today={today}
        navTab={navTab}
        setNavTab={setNavTab}
        deleteTarget={deleteTarget}
        onSetDeleteTarget={setDeleteTarget}
        onConfirmDelete={confirmDelete}
        onOpenCall={openEditCall}
        onExport={goExport}
        onNewCall={startNewCall}
        onStats={() => setScreen("stats")}
        onSettings={() => setScreen("settings")}
        pillUnitLabel={pillUnitLabel}
        pillElapsedLabel={pillElapsedLabel}
        showShiftManager={showShiftManager}
        shiftManagerTab={shiftManagerTab}
        setShiftManagerTab={setShiftManagerTab}
        shiftDraft={shiftDraft}
        setShiftFld={setShiftFld}
        editingShiftId={editingShiftId}
        shiftHistory={shiftHistory}
        onOpenShiftManager={openShiftManager}
        onCloseShiftManager={closeShiftManager}
        onSaveShift={saveShift}
        onNewShiftInManager={startNewShiftInManager}
        onSelectHistoryShift={startEditingShift}
        deleteShiftTarget={deleteShiftTarget}
        onRequestDeleteShift={setDeleteShiftTarget}
        onCancelDeleteShift={() => setDeleteShiftTarget(null)}
        onConfirmDeleteShift={confirmDeleteShift}
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
      hospitals={hospitals.map(h => h.name)}
      medications={medications}
      interventionDefs={interventionDefs}
      shifts={shiftHistory}
      navTab={navTab}
      setNavTab={setNavTab}
      showCancelWarning={showCancelWarning}
      onKeepEditing={() => setShowCancelWarning(false)}
      onDiscard={doCancel}
      showNoShiftWarning={showNoShiftWarning}
      onCancelNoShiftWarning={cancelNoShiftWarning}
      onLogAnyway={confirmSaveWithoutShift}
      onSave={() => attemptSave(isLocked)}
      onExport={goExport}
      onToggleLock={() => setIsLocked(prev => !prev)}
      onTryCancel={tryCancel}
      pillUnitLabel={pillUnitLabel}
      pillElapsedLabel={pillElapsedLabel}
      showShiftManager={showShiftManager}
      shiftManagerTab={shiftManagerTab}
      setShiftManagerTab={setShiftManagerTab}
      shiftDraft={shiftDraft}
      setShiftFld={setShiftFld}
      editingShiftId={editingShiftId}
      shiftHistory={shiftHistory}
      onOpenShiftManager={openShiftManager}
      onCloseShiftManager={closeShiftManager}
      onSaveShift={saveShift}
      onNewShiftInManager={startNewShiftInManager}
      onSelectHistoryShift={startEditingShift}
      deleteShiftTarget={deleteShiftTarget}
      onRequestDeleteShift={setDeleteShiftTarget}
      onCancelDeleteShift={() => setDeleteShiftTarget(null)}
      onConfirmDeleteShift={confirmDeleteShift}
    />
  );
}
