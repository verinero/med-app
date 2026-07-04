import { useState, useEffect, useMemo } from "react";
import { db, recordsToCSV, downloadCSV, medsSummary, interventionsSummary, csvToRecords, presetsToCSV, parsePresetsCSV, getSettingValue, setSettingValue, type CallRecord, type Shift, type Hospital, type Medication, type InterventionDef, type ChiefComplaint, type ParsedPresets } from "../db";
import { HOME_COLOR, TH, T_CHIPS, M_CHIPS, HOSPITALS, DEFAULT_MEDS, DEFAULT_INTERVENTIONS, DEFAULT_THEME, HEX_COLOR_RE, deriveThemeColors, type Screen } from "./constants";
import { blankForm, callToForm, dateStr, dateStrFor, sevenDaysAgo, gcsTotal, type CallForm } from "./callForm";
import { blankShiftDraft, toDatetimeLocalValue, fromDatetimeLocalValue, type ShiftDraft } from "./shiftForm";
import { callOutcomeSegments, hospitalCounts, ivSuccessStats, techedByUnitType as computeTechedByUnitType, acuitySegments } from "./callStats";
import { shiftSummaries, shiftsByUnitType as computeShiftsByUnitType, hoursByUnitType as computeHoursByUnitType } from "./shiftStats";
import { formatDuration } from "./shiftStats";
import { ExportScreen } from "./screens/ExportScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { NewCallScreen } from "./screens/NewCallScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

function hospitalUsageCount(name: string, calls: CallRecord[]): number {
  return calls.filter(c => c.hospital === name).length;
}

function medicationUsageCount(name: string, calls: CallRecord[]): number {
  return calls.filter(c => c.meds?.some(m => m.name === name)).length;
}

function complaintUsageCount(name: string, calls: CallRecord[]): number {
  return calls.filter(c => c.complaint === name).length;
}

interface RemovedItem { name: string; usageCount?: number }
interface PresetsListDiff { added: string[]; removed: RemovedItem[] }
export interface PresetsDiff {
  hospitals: PresetsListDiff | null;
  medications: PresetsListDiff | null;
  interventions: { trauma: PresetsListDiff | null; medical: PresetsListDiff | null };
  chiefComplaints: { trauma: PresetsListDiff | null; medical: PresetsListDiff | null };
  parsed: ParsedPresets;
}

function diffByName<T extends { name: string }>(current: { name: string }[], incoming: T[] | null): PresetsListDiff | null {
  if (incoming == null) return null;
  const currentNames = new Set(current.map(c => c.name.toLowerCase()));
  const incomingNames = new Set(incoming.map(i => i.name.toLowerCase()));
  const added = incoming.filter(i => !currentNames.has(i.name.toLowerCase())).map(i => i.name);
  const removed = current.filter(c => !incomingNames.has(c.name.toLowerCase())).map(c => ({ name: c.name }));
  return { added, removed };
}

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
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[]>([]);
  const [deleteComplaintTarget, setDeleteComplaintTarget] = useState<number | null>(null);

  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ calls: (Omit<CallRecord, "id"> & { shiftStartKey?: string })[]; shifts: Omit<Shift, "id">[] } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importLog, setImportLog] = useState<{ timestamp: number; calls: number; shifts: number; shiftsSkipped: number }[]>([]);

  const [importPresetsFileName, setImportPresetsFileName] = useState<string | null>(null);
  const [importPresetsPreview, setImportPresetsPreview] = useState<PresetsDiff | null>(null);
  const [importPresetsErrors, setImportPresetsErrors] = useState<string[]>([]);
  const [importPresetsLog, setImportPresetsLog] = useState<{ timestamp: number; summary: string }[]>([]);

  const [themeHex, setThemeHexState] = useState(DEFAULT_THEME);

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
      // Self-heal duplicate seed rows (e.g. React StrictMode double-invoking
      // this effect in dev can race two "table is empty" checks before
      // either bulkAdd lands, seeding the defaults twice).
      const seenKeys = new Set<string>();
      const dupIds: number[] = [];
      for (const row of [...interventionRows].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))) {
        const key = `${row.mode}::${row.name.toLowerCase()}`;
        if (seenKeys.has(key)) { if (row.id != null) dupIds.push(row.id); }
        else seenKeys.add(key);
      }
      if (dupIds.length > 0) {
        await db.interventions.bulkDelete(dupIds);
        interventionRows = interventionRows.filter(r => r.id == null || !dupIds.includes(r.id));
      }
      setInterventionDefs(interventionRows.sort((a, b) => a.order - b.order));

      let complaintRows = await db.chiefComplaints.toArray();
      if (complaintRows.length === 0) {
        await db.chiefComplaints.bulkAdd([
          ...T_CHIPS.map(name => ({ name, mode: "trauma" as const })),
          ...M_CHIPS.map(name => ({ name, mode: "medical" as const })),
        ]);
        complaintRows = await db.chiefComplaints.toArray();
      }
      // Self-heal duplicate seed rows — same StrictMode double-seed race as
      // interventions above.
      const seenComplaintKeys = new Set<string>();
      const dupComplaintIds: number[] = [];
      for (const row of [...complaintRows].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))) {
        const key = `${row.mode}::${row.name.toLowerCase()}`;
        if (seenComplaintKeys.has(key)) { if (row.id != null) dupComplaintIds.push(row.id); }
        else seenComplaintKeys.add(key);
      }
      if (dupComplaintIds.length > 0) {
        await db.chiefComplaints.bulkDelete(dupComplaintIds);
        complaintRows = complaintRows.filter(r => r.id == null || !dupComplaintIds.includes(r.id));
      }
      setChiefComplaints(complaintRows);

      const [homeHex, traumaHex, medicalHex] = await Promise.all([
        getSettingValue("theme_home"), getSettingValue("theme_trauma"), getSettingValue("theme_medical"),
      ]);
      const loadedTheme = {
        home: homeHex && HEX_COLOR_RE.test(homeHex) ? homeHex : DEFAULT_THEME.home,
        trauma: traumaHex && HEX_COLOR_RE.test(traumaHex) ? traumaHex : DEFAULT_THEME.trauma,
        medical: medicalHex && HEX_COLOR_RE.test(medicalHex) ? medicalHex : DEFAULT_THEME.medical,
      };
      Object.assign(HOME_COLOR, deriveThemeColors(loadedTheme.home));
      Object.assign(TH.trauma, deriveThemeColors(loadedTheme.trauma));
      Object.assign(TH.medical, deriveThemeColors(loadedTheme.medical));
      setThemeHexState(loadedTheme);
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

  const chips = chiefComplaints.filter(cc => cc.mode === f.mode).map(cc => cc.name);

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
      hr: f.hr, bp: f.bp, spo2: f.spo2, rr: f.rr,
      gcs: gcsTotal(f.gcsEye, f.gcsVerbal, f.gcsMotor) || (editingCall?.gcs ?? ""),
      gcsEye: f.gcsEye || undefined, gcsVerbal: f.gcsVerbal || undefined, gcsMotor: f.gcsMotor || undefined,
      glucose: f.glucose,
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

  // ── CSV Import (Settings) ──────────────────────────────────
  // Import always creates new calls — the CSV's ID column is discarded
  // (parsed out already in csvToRecords), so re-importing the same
  // file can never overwrite or corrupt an existing call. Shifts are the
  // exception: a shift already on the device (same startTime+unit+type) is
  // silently skipped rather than duplicated, since re-importing the same
  // export shouldn't grow shift history every time.
  function handleImportFileSelected(fileName: string, text: string) {
    const { calls, shifts, errors } = csvToRecords(text);
    setImportFileName(fileName);
    setImportPreview({ calls, shifts });
    setImportErrors(errors);
  }

  function shiftKey(startTime: number, unitNum: string, unitType: string) {
    return `${startTime}|${unitNum}|${unitType}`;
  }

  async function confirmImport() {
    if (!importPreview || (importPreview.calls.length === 0 && importPreview.shifts.length === 0)) return;

    const shiftIdByKey = new Map<string, number>();
    for (const s of shifts) {
      if (s.id != null) shiftIdByKey.set(shiftKey(s.startTime, s.unitNum, s.unitType), s.id);
    }
    const newShifts = importPreview.shifts.filter(s => !shiftIdByKey.has(shiftKey(s.startTime, s.unitNum, s.unitType)));
    const shiftsSkipped = importPreview.shifts.length - newShifts.length;
    if (newShifts.length > 0) {
      const newIds = await db.shifts.bulkAdd(newShifts, undefined, { allKeys: true }) as number[];
      newShifts.forEach((s, i) => shiftIdByKey.set(shiftKey(s.startTime, s.unitNum, s.unitType), newIds[i]));
    }

    const callsToInsert: CallRecord[] = importPreview.calls.map(({ shiftStartKey, ...call }) => {
      const shiftId = shiftStartKey != null
        ? shiftIdByKey.get(shiftKey(Date.parse(shiftStartKey), call.unitNum, call.unitType))
        : undefined;
      return { ...call, shiftId } as CallRecord;
    });
    if (callsToInsert.length > 0) await db.calls.bulkAdd(callsToInsert);

    const [updated, all, allShifts] = await Promise.all([
      db.calls.orderBy("timestamp").reverse().limit(100).toArray(),
      db.calls.toArray(),
      db.shifts.toArray(),
    ]);
    setSavedCalls(updated);
    setAllCalls(all);
    setShifts(allShifts);
    setImportLog(prev => [{ timestamp: Date.now(), calls: callsToInsert.length, shifts: newShifts.length, shiftsSkipped }, ...prev]);
    setImportPreview(null);
    setImportFileName(null);
  }

  function cancelImport() {
    setImportFileName(null);
    setImportPreview(null);
    setImportErrors([]);
  }

  // ── Preset Import (Hospitals / Medications / Interventions, Settings) ──
  // Full replace: a list/mode is only touched if the file actually contains
  // rows for it (see parsePresetsCSV's null-means-absent contract), so a
  // partial export (e.g. hospitals-only) can never silently wipe the rest.
  function handleImportPresetsFileSelected(fileName: string, text: string) {
    const parsed = parsePresetsCSV(text);
    const hospitalsDiff = diffByName(hospitals, parsed.hospitals);
    if (hospitalsDiff) hospitalsDiff.removed.forEach(r => { r.usageCount = hospitalUsageCount(r.name, allCalls); });
    const medicationsDiff = diffByName(medications, parsed.medications);
    if (medicationsDiff) medicationsDiff.removed.forEach(r => { r.usageCount = medicationUsageCount(r.name, allCalls); });
    const traumaDiff = diffByName(interventionDefs.filter(d => d.mode === "trauma"), parsed.interventions.trauma);
    const medicalDiff = diffByName(interventionDefs.filter(d => d.mode === "medical"), parsed.interventions.medical);
    const complaintTraumaDiff = diffByName(chiefComplaints.filter(d => d.mode === "trauma"), parsed.chiefComplaints.trauma);
    if (complaintTraumaDiff) complaintTraumaDiff.removed.forEach(r => { r.usageCount = complaintUsageCount(r.name, allCalls); });
    const complaintMedicalDiff = diffByName(chiefComplaints.filter(d => d.mode === "medical"), parsed.chiefComplaints.medical);
    if (complaintMedicalDiff) complaintMedicalDiff.removed.forEach(r => { r.usageCount = complaintUsageCount(r.name, allCalls); });

    setImportPresetsFileName(fileName);
    setImportPresetsPreview({
      hospitals: hospitalsDiff, medications: medicationsDiff,
      interventions: { trauma: traumaDiff, medical: medicalDiff },
      chiefComplaints: { trauma: complaintTraumaDiff, medical: complaintMedicalDiff },
      parsed,
    });
    setImportPresetsErrors(parsed.errors);
  }

  async function confirmImportPresets() {
    if (!importPresetsPreview) return;
    const { parsed } = importPresetsPreview;
    const summaryParts: string[] = [];
    const anyPresent = parsed.hospitals != null || parsed.medications != null
      || parsed.interventions.trauma != null || parsed.interventions.medical != null
      || parsed.chiefComplaints.trauma != null || parsed.chiefComplaints.medical != null;

    if (parsed.hospitals) {
      const currentIds = hospitals.map(h => h.id!).filter(id => id != null);
      await db.hospitals.bulkDelete(currentIds);
      await db.hospitals.bulkAdd(parsed.hospitals);
      const d = importPresetsPreview.hospitals!;
      if (d.added.length > 0 || d.removed.length > 0) summaryParts.push(`Hospitals: +${d.added.length}, -${d.removed.length}`);
    }
    if (parsed.medications) {
      const currentIds = medications.map(m => m.id!).filter(id => id != null);
      await db.medications.bulkDelete(currentIds);
      await db.medications.bulkAdd(parsed.medications);
      const d = importPresetsPreview.medications!;
      if (d.added.length > 0 || d.removed.length > 0) summaryParts.push(`Medications: +${d.added.length}, -${d.removed.length}`);
    }
    for (const mode of ["trauma", "medical"] as const) {
      const rows = parsed.interventions[mode];
      if (!rows) continue;
      const currentIds = interventionDefs.filter(d => d.mode === mode).map(d => d.id!).filter(id => id != null);
      await db.interventions.bulkDelete(currentIds);
      await db.interventions.bulkAdd(rows.map((r, order) => ({ ...r, mode, order })));
      const d = importPresetsPreview.interventions[mode]!;
      if (d.added.length > 0 || d.removed.length > 0) summaryParts.push(`${mode === "trauma" ? "Trauma" : "Medical"} interventions: +${d.added.length}, -${d.removed.length}`);
    }
    for (const mode of ["trauma", "medical"] as const) {
      const rows = parsed.chiefComplaints[mode];
      if (!rows) continue;
      const currentIds = chiefComplaints.filter(d => d.mode === mode).map(d => d.id!).filter(id => id != null);
      await db.chiefComplaints.bulkDelete(currentIds);
      await db.chiefComplaints.bulkAdd(rows.map(r => ({ ...r, mode })));
      const d = importPresetsPreview.chiefComplaints[mode]!;
      if (d.added.length > 0 || d.removed.length > 0) summaryParts.push(`${mode === "trauma" ? "Trauma" : "Medical"} complaints: +${d.added.length}, -${d.removed.length}`);
    }

    const [hospitalRows, medicationRows, interventionRows, complaintRows] = await Promise.all([
      db.hospitals.toArray(), db.medications.toArray(), db.interventions.toArray(), db.chiefComplaints.toArray(),
    ]);
    setHospitals(hospitalRows);
    setMedications(medicationRows);
    setInterventionDefs(interventionRows.sort((a, b) => a.order - b.order));
    setChiefComplaints(complaintRows);

    const summary = summaryParts.length > 0
      ? summaryParts.join(". ") + "."
      : anyPresent ? "No changes — file matched what was already configured." : "Nothing to import — file had no recognizable rows.";
    setImportPresetsLog(prev => [{ timestamp: Date.now(), summary }, ...prev]);
    setImportPresetsPreview(null);
    setImportPresetsFileName(null);
  }

  function cancelImportPresets() {
    setImportPresetsFileName(null);
    setImportPresetsPreview(null);
    setImportPresetsErrors([]);
  }

  function exportPresets() {
    downloadCSV(presetsToCSV(hospitals, medications, interventionDefs, chiefComplaints), `ems-presets-${today.replace(/ /g, "-")}.csv`);
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
  const deleteHospitalUsageCount = deleteHospitalName ? hospitalUsageCount(deleteHospitalName, allCalls) : 0;
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
  const deleteMedicationUsageCount = deleteMedicationName ? medicationUsageCount(deleteMedicationName, allCalls) : 0;
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

  // ── Chief Complaints (Settings) ────────────────────────────
  // Quick-tap chips shown in New Call, scoped per mode (trauma/medical) —
  // replaces the old hardcoded T_CHIPS/M_CHIPS constants. No reorder support
  // (unlike Interventions): chip order is just insertion order.
  async function addComplaint(mode: "trauma" | "medical", name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (chiefComplaints.some(c => c.mode === mode && c.name.toLowerCase() === trimmed.toLowerCase())) return;
    await db.chiefComplaints.add({ name: trimmed, mode });
    setChiefComplaints(await db.chiefComplaints.toArray());
  }

  function requestDeleteComplaint(id: number) {
    setDeleteComplaintTarget(id);
  }

  function cancelDeleteComplaint() {
    setDeleteComplaintTarget(null);
  }

  async function confirmDeleteComplaint() {
    if (deleteComplaintTarget == null) return;
    await db.chiefComplaints.delete(deleteComplaintTarget);
    setChiefComplaints(await db.chiefComplaints.toArray());
    setDeleteComplaintTarget(null);
  }

  const deleteComplaintName = deleteComplaintTarget != null
    ? chiefComplaints.find(c => c.id === deleteComplaintTarget)?.name
    : undefined;
  const deleteComplaintUsageCount = deleteComplaintName ? complaintUsageCount(deleteComplaintName, allCalls) : 0;
  const deleteComplaintMessage = deleteComplaintUsageCount > 0
    ? `This complaint is used on ${deleteComplaintUsageCount} saved call${deleteComplaintUsageCount === 1 ? "" : "s"}. Deleting it won't change those records, but it will no longer be selectable for future calls.`
    : undefined;

  // ── Theme colors (Settings) ────────────────────────────────
  // HOME_COLOR/TH are mutated in place rather than threaded through a
  // context — every screen imports them as module-level singletons, so
  // any state update after the mutation (setThemeHexState below) re-renders
  // the whole tree and picks up the new values via the same object
  // reference. Persisted individually under theme_home/theme_trauma/
  // theme_medical keys in the existing settings key/value table.
  async function setThemeColor(theme: "home" | "trauma" | "medical", hex: string) {
    const derived = deriveThemeColors(hex);
    if (theme === "home") Object.assign(HOME_COLOR, derived);
    else Object.assign(TH[theme], derived);
    setThemeHexState(prev => ({ ...prev, [theme]: hex }));
    await setSettingValue(`theme_${theme}`, hex);
  }

  async function resetThemeColors() {
    Object.assign(HOME_COLOR, deriveThemeColors(DEFAULT_THEME.home));
    Object.assign(TH.trauma, deriveThemeColors(DEFAULT_THEME.trauma));
    Object.assign(TH.medical, deriveThemeColors(DEFAULT_THEME.medical));
    setThemeHexState(DEFAULT_THEME);
    await Promise.all([
      setSettingValue("theme_home", DEFAULT_THEME.home),
      setSettingValue("theme_trauma", DEFAULT_THEME.trauma),
      setSettingValue("theme_medical", DEFAULT_THEME.medical),
    ]);
  }

  function requestClearData() {
    setShowClearDataConfirm(true);
  }

  function cancelClearData() {
    setShowClearDataConfirm(false);
  }

  async function confirmClearData() {
    await Promise.all([
      db.calls.clear(), db.shifts.clear(), db.settings.clear(),
      db.hospitals.clear(), db.medications.clear(), db.interventions.clear(), db.chiefComplaints.clear(),
    ]);
    await Promise.all([
      db.hospitals.bulkAdd(HOSPITALS.map(name => ({ name }))),
      db.medications.bulkAdd(DEFAULT_MEDS.map(name => ({ name }))),
      db.interventions.bulkAdd(DEFAULT_INTERVENTIONS.map((d, order) => ({ ...d, order }))),
      db.chiefComplaints.bulkAdd([
        ...T_CHIPS.map(name => ({ name, mode: "trauma" as const })),
        ...M_CHIPS.map(name => ({ name, mode: "medical" as const })),
      ]),
    ]);
    setSavedCalls([]);
    setAllCalls([]);
    setShifts([]);
    setHospitals(await db.hospitals.toArray());
    setMedications(await db.medications.toArray());
    setInterventionDefs(await db.interventions.toArray());
    setChiefComplaints(await db.chiefComplaints.toArray());
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
    setNavTab("activity");
    setScreen("home");
  }

  async function exportCSV() {
    const [all, allShifts] = await Promise.all([
      db.calls.orderBy("timestamp").toArray(),
      db.shifts.toArray(),
    ]);
    downloadCSV(recordsToCSV(all, allShifts), `ems-calls-${today.replace(/ /g, "-")}.csv`);
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
        today={today}
        navTab={navTab}
        setNavTab={setNavTab}
        onHome={() => setScreen("home")}
        onNewCall={startNewCall}
        onStats={() => setScreen("stats")}
        onSettings={() => setScreen("settings")}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        onExportPresets={exportPresets}
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
        today={today}
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
        today={today}
        onHome={() => setScreen("home")}
        onStats={() => setScreen("stats")}
        onExport={goExport}
        themeHex={themeHex}
        onSetThemeColor={setThemeColor}
        onResetThemeColors={resetThemeColors}
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
        chiefComplaints={chiefComplaints}
        onAddComplaint={addComplaint}
        deleteComplaintTarget={deleteComplaintTarget}
        deleteComplaintMessage={deleteComplaintMessage}
        onRequestDeleteComplaint={requestDeleteComplaint}
        onCancelDeleteComplaint={cancelDeleteComplaint}
        onConfirmDeleteComplaint={confirmDeleteComplaint}
        importFileName={importFileName}
        importPreview={importPreview}
        importErrors={importErrors}
        importLog={importLog}
        onImportFileSelected={handleImportFileSelected}
        onConfirmImport={confirmImport}
        onCancelImport={cancelImport}
        importPresetsFileName={importPresetsFileName}
        importPresetsPreview={importPresetsPreview}
        importPresetsErrors={importPresetsErrors}
        importPresetsLog={importPresetsLog}
        onImportPresetsFileSelected={handleImportPresetsFileSelected}
        onConfirmImportPresets={confirmImportPresets}
        onCancelImportPresets={cancelImportPresets}
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
