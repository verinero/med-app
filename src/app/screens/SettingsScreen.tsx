import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Lock, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { HOME_COLOR, ROUTES, COLOR_PRESETS, hsvToHex, hexToHsv, contrastTextColor } from "../constants";
import type { CallRecord, Hospital, Medication, InterventionDef, ChiefComplaint } from "../../db";
import type { PresetsDiff } from "../App";
import { PhoneShell } from "../components/PhoneShell";
import { CurvedShelf } from "../components/CurvedShelf";
import { SLabel } from "../components/SLabel";
import { FormCard } from "../components/FormCard";
import { CardHead } from "../components/CardHead";
import { BottomNav } from "../components/BottomNav";
import { DeleteModal } from "../components/DeleteModal";
import { eyebrow, textInputStyle, primaryBtn } from "../styles";

function ManageListCard({ label, items, placeholder, onAdd, onRequestDelete, onSetDefaultRoute }: {
  label: string; items: { id?: number; name: string; defaultRoute?: string }[]; placeholder: string;
  onAdd: (name: string) => void; onRequestDelete: (id: number) => void;
  onSetDefaultRoute?: (id: number, route: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  function submit() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }
  return (
    <FormCard accent={HOME_COLOR.p}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
        <CardHead color={HOME_COLOR.p} label={label} />
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>
      {open && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              placeholder={placeholder} style={{ ...textInputStyle, flex: 1 }} />
            <button onClick={submit} style={{
              padding: "0 18px", border: "none", borderRadius: 11,
              background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p), fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Add</button>
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {items.map(item => {
                const currentRoute = item.defaultRoute || ROUTES[0];
                return (
                  <div key={item.id} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "9px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0d1117" }}>{item.name}</span>
                      <button onClick={() => item.id != null && onRequestDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0 }}>
                        <Trash2 size={14} color="#D1D5DB" />
                      </button>
                    </div>
                    {onSetDefaultRoute && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em", flexShrink: 0 }}>DEFAULT ROUTE</span>
                        <div style={{ display: "flex", gap: 4, flex: 1 }}>
                          {ROUTES.map(r => (
                            <button key={r} onClick={() => item.id != null && onSetDefaultRoute(item.id, r)} style={{
                              flex: 1, padding: "5px 0", borderRadius: 6, cursor: "pointer",
                              border: `1.5px solid ${currentRoute === r ? HOME_COLOR.p : "#E2E5EC"}`,
                              background: currentRoute === r ? HOME_COLOR.l : "#fff",
                              color: currentRoute === r ? HOME_COLOR.p : "#9ca3af",
                              fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
                            }}>{r}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </FormCard>
  );
}

// Tap-or-drag hue/saturation wheel (value fixed at 1) — the single "custom
// color" input, as opposed to the fixed COLOR_PRESETS swatches. The marker
// position is derived from `value` (via hexToHsv) rather than tracked as its
// own state, so it always reflects the live theme color, including on the
// initial open before any drag has happened.
function ColorWheel({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const SIZE = 160;
  const maxR = SIZE / 2;

  function updateFromEvent(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + maxR);
    const dy = e.clientY - (rect.top + maxR);
    const r = Math.min(Math.sqrt(dx * dx + dy * dy), maxR);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    onPick(hsvToHex(angle, r / maxR, 1));
  }

  const { h, s } = hexToHsv(value);
  const angleRad = (h * Math.PI) / 180;
  const markerR = s * maxR;
  const markerX = maxR + markerR * Math.cos(angleRad);
  const markerY = maxR + markerR * Math.sin(angleRad);

  return (
    <div
      ref={ref}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); updateFromEvent(e); }}
      onPointerMove={e => { if (e.buttons === 1) updateFromEvent(e); }}
      style={{
        width: SIZE, height: SIZE, borderRadius: "50%", margin: "4px auto 0", position: "relative",
        background: "conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)",
        cursor: "pointer", touchAction: "none",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 70%)",
      }} />
      <div style={{
        position: "absolute", left: markerX, top: markerY, transform: "translate(-50%, -50%)",
        width: 18, height: 18, borderRadius: "50%", pointerEvents: "none",
        background: value, border: "2.5px solid #fff", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.45)",
      }} />
    </div>
  );
}

function ColorPickerRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [wheelOpen, setWheelOpen] = useState(false);
  const isPreset = COLOR_PRESETS.some(hex => hex.toLowerCase() === value.toLowerCase());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em" }}>{label}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {COLOR_PRESETS.map(hex => (
          <button key={hex} onClick={() => { setWheelOpen(false); onChange(hex); }} style={{
            width: 28, height: 28, borderRadius: "50%", cursor: "pointer", padding: 0,
            background: hex,
            border: !wheelOpen && value.toLowerCase() === hex.toLowerCase() ? "2.5px solid #0d1117" : "2px solid #fff",
            boxShadow: "0 0 0 1px #E2E5EC",
          }} />
        ))}
        {/* Single custom-color slot: "+" until a custom color is picked, then
            shows that color; tapping it again re-opens the wheel to change it. */}
        <button onClick={() => setWheelOpen(o => !o)} style={{
          width: 28, height: 28, borderRadius: "50%", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: !isPreset ? value : "#fff",
          border: !isPreset ? "2.5px solid #0d1117" : "1.5px dashed #D1D5DB",
        }}>
          <Plus size={14} color={!isPreset ? contrastTextColor(value) : "#9ca3af"} />
        </button>
      </div>
      {wheelOpen && <ColorWheel value={value} onPick={onChange} />}
    </div>
  );
}

function CustomizeColorsCard({ themeHex, onSetColor, onReset }: {
  themeHex: { home: string; trauma: string; medical: string };
  onSetColor: (theme: "home" | "trauma" | "medical", hex: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <FormCard accent={HOME_COLOR.p}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
        <CardHead color={HOME_COLOR.p} label="Customize Colors" />
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>
      {open && (
        <>
          <ColorPickerRow label="HOME / APP" value={themeHex.home} onChange={hex => onSetColor("home", hex)} />
          <ColorPickerRow label="TRAUMA" value={themeHex.trauma} onChange={hex => onSetColor("trauma", hex)} />
          <ColorPickerRow label="MEDICAL" value={themeHex.medical} onChange={hex => onSetColor("medical", hex)} />
          <button onClick={onReset} style={{
            padding: "10px 0", borderRadius: 11, border: "1.5px solid #E2E5EC", background: "#F8F9FC",
            fontSize: 13, fontWeight: 700, color: "#6b7280", cursor: "pointer",
          }}>Reset to Defaults</button>
        </>
      )}
    </FormCard>
  );
}

const LOCKED_ROWS = ["Oxygen", "Medication"];

function LockedInterventionRow({ name }: { name: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      padding: "9px 12px", background: "#F2F3F7", borderRadius: 10, border: "1px solid #E2E5EC",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{name}</span>
      <div title="Always included, cannot be removed" style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af" }}>
        <Lock size={12} />
        <span style={{ fontSize: 10, fontWeight: 700 }}>Locked</span>
      </div>
    </div>
  );
}

function ManageInterventionsCard({ defs, onAdd, onRequestDelete, onSetNotesEnabled, onMove }: {
  defs: InterventionDef[];
  onAdd: (mode: "trauma" | "medical", name: string, notesEnabled: boolean) => void;
  onRequestDelete: (id: number) => void;
  onSetNotesEnabled: (id: number, notesEnabled: boolean) => void;
  onMove: (id: number, direction: "up" | "down") => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"trauma" | "medical">("trauma");
  const [draft, setDraft] = useState("");
  const [draftNotes, setDraftNotes] = useState(false);

  const items = defs.filter(d => d.mode === mode).sort((a, b) => a.order - b.order);

  function submit() {
    if (!draft.trim()) return;
    onAdd(mode, draft, draftNotes);
    setDraft("");
    setDraftNotes(false);
  }

  return (
    <FormCard accent={HOME_COLOR.p}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
        <CardHead color={HOME_COLOR.p} label="Manage Interventions" />
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>
      {open && (
        <>
          <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
            {(["trauma", "medical"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, textTransform: "capitalize", transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? HOME_COLOR.p : "#6b7280",
                boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}>{m}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {LOCKED_ROWS.map(name => <LockedInterventionRow key={name} name={name} />)}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              placeholder={mode === "trauma" ? "e.g. Tourniquet" : "e.g. Nebulizer Treatment"}
              style={{ ...textInputStyle, flex: 1 }} />
            <button onClick={submit} style={{
              padding: "0 18px", border: "none", borderRadius: 11,
              background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p), fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Add</button>
          </div>
          <button onClick={() => setDraftNotes(n => !n)} style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: "flex-start",
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${draftNotes ? HOME_COLOR.p : "#D1D5DB"}`, background: draftNotes ? HOME_COLOR.p : "#fff" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>Enable Notes</span>
          </button>

          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {items.map((item, i) => (
                <div key={item.id} style={{
                  display: "flex", flexDirection: "column", gap: 8,
                  padding: "9px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0d1117" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => onMove(item.id!, "up")} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", padding: "4px", display: "flex", opacity: i === 0 ? 0.3 : 1 }}>
                        <ArrowUp size={14} color="#6b7280" />
                      </button>
                      <button onClick={() => onMove(item.id!, "down")} disabled={i === items.length - 1} style={{ background: "none", border: "none", cursor: i === items.length - 1 ? "default" : "pointer", padding: "4px", display: "flex", opacity: i === items.length - 1 ? 0.3 : 1 }}>
                        <ArrowDown size={14} color="#6b7280" />
                      </button>
                      <button onClick={() => item.id != null && onRequestDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
                        <Trash2 size={14} color="#D1D5DB" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => item.id != null && onSetNotesEnabled(item.id, !item.notesEnabled)} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: "flex-start",
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${item.notesEnabled ? HOME_COLOR.p : "#D1D5DB"}`, background: item.notesEnabled ? HOME_COLOR.p : "#fff" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Enable Notes</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </FormCard>
  );
}

function ManageComplaintsCard({ items, onAdd, onRequestDelete }: {
  items: ChiefComplaint[];
  onAdd: (mode: "trauma" | "medical", name: string) => void;
  onRequestDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"trauma" | "medical">("trauma");
  const [draft, setDraft] = useState("");

  const filtered = items.filter(d => d.mode === mode);

  function submit() {
    if (!draft.trim()) return;
    onAdd(mode, draft);
    setDraft("");
  }

  return (
    <FormCard accent={HOME_COLOR.p}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
        <CardHead color={HOME_COLOR.p} label="Manage Chief Complaints" />
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>
      {open && (
        <>
          <div style={{ background: "#F2F3F7", borderRadius: 11, padding: 3, display: "flex" }}>
            {(["trauma", "medical"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, textTransform: "capitalize", transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? HOME_COLOR.p : "#6b7280",
                boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}>{m}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              placeholder={mode === "trauma" ? "e.g. Crush Injury" : "e.g. Palpitations"}
              style={{ ...textInputStyle, flex: 1 }} />
            <button onClick={submit} style={{
              padding: "0 18px", border: "none", borderRadius: 11,
              background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p), fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Add</button>
          </div>

          {filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {filtered.map(item => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "9px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0d1117" }}>{item.name}</span>
                  <button onClick={() => item.id != null && onRequestDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0 }}>
                    <Trash2 size={14} color="#D1D5DB" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </FormCard>
  );
}

function formatImportTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface ImportLogEntry { timestamp: number; calls: number; shifts: number; shiftsSkipped: number }

function ImportCallsCard({ fileName, preview, errors, log, onFileSelected, onConfirm, onCancel }: {
  fileName: string | null;
  preview: { calls: (Omit<CallRecord, "id"> & { shiftStartKey?: string })[]; shifts: unknown[] } | null;
  errors: string[];
  log: ImportLogEntry[];
  onFileSelected: (name: string, text: string) => void; onConfirm: () => void; onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(file.name, reader.result as string);
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file later
  }
  const total = preview ? preview.calls.length + preview.shifts.length : 0;
  return (
    <FormCard accent={HOME_COLOR.p}>
      <CardHead color={HOME_COLOR.p} label="Import Calls" />
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        Restore calls and shifts from a CSV export. Duplicate shifts are skipped; calls are always added as new.
      </p>
      <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} style={{ display: "none" }} />
      <button onClick={() => inputRef.current?.click()} style={{ ...primaryBtn, background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p) }}>
        Choose CSV File
      </button>

      {errors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12, color: "#D32F2F" }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {preview && total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#0d1117" }}>
            Found <strong>{preview.calls.length}</strong> call{preview.calls.length === 1 ? "" : "s"} and <strong>{preview.shifts.length}</strong> shift{preview.shifts.length === 1 ? "" : "s"} in <em>{fileName}</em>.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 14, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "#16A34A", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Import {total}</button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>
              <span style={{ fontWeight: 700, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{formatImportTime(entry.timestamp)} — </span>
              Imported {entry.calls} call{entry.calls === 1 ? "" : "s"} and {entry.shifts} shift{entry.shifts === 1 ? "" : "s"}.
              {entry.shiftsSkipped > 0 ? ` (${entry.shiftsSkipped} duplicate shift${entry.shiftsSkipped === 1 ? "" : "s"} skipped.)` : ""}
            </div>
          ))}
        </div>
      )}
    </FormCard>
  );
}

function PresetsDiffRow({ label, diff }: { label: string; diff: { added: string[]; removed: { name: string; usageCount?: number }[] } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "9px 12px", background: "#F8F9FC", borderRadius: 10, border: "1px solid #ECEEF2" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0d1117" }}>
        {label}: <span style={{ color: "#16A34A" }}>+{diff.added.length}</span>{" "}
        <span style={{ color: diff.removed.length > 0 ? "#D32F2F" : "#9ca3af" }}>-{diff.removed.length}</span>
      </div>
      {diff.added.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {diff.added.map(name => (
            <div key={name} style={{ fontSize: 11, color: "#16A34A" }}>
              + {name}
            </div>
          ))}
        </div>
      )}
      {diff.removed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {diff.removed.map(r => (
            <div key={r.name} style={{ fontSize: 11, color: "#9ca3af" }}>
              – {r.name}{r.usageCount ? ` (used by ${r.usageCount} saved call${r.usageCount === 1 ? "" : "s"})` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ImportPresetsLogEntry { timestamp: number; summary: string }

function ImportPresetsCard({ fileName, preview, errors, log, onFileSelected, onConfirm, onCancel }: {
  fileName: string | null; preview: PresetsDiff | null; errors: string[]; log: ImportPresetsLogEntry[];
  onFileSelected: (name: string, text: string) => void; onConfirm: () => void; onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(file.name, reader.result as string);
    reader.readAsText(file);
    e.target.value = "";
  }

  const rows: { label: string; diff: { added: string[]; removed: { name: string; usageCount?: number }[] } }[] = [];
  if (preview) {
    if (preview.hospitals) rows.push({ label: "Hospitals", diff: preview.hospitals });
    if (preview.medications) rows.push({ label: "Medications", diff: preview.medications });
    if (preview.interventions.trauma) rows.push({ label: "Trauma interventions", diff: preview.interventions.trauma });
    if (preview.interventions.medical) rows.push({ label: "Medical interventions", diff: preview.interventions.medical });
    if (preview.chiefComplaints.trauma) rows.push({ label: "Trauma complaints", diff: preview.chiefComplaints.trauma });
    if (preview.chiefComplaints.medical) rows.push({ label: "Medical complaints", diff: preview.chiefComplaints.medical });
  }

  return (
    <FormCard accent={HOME_COLOR.p}>
      <CardHead color={HOME_COLOR.p} label="Import Presets" />
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        Load a Presets CSV to replace Hospitals, Medications, Interventions, and Chief Complaints. Only lists/modes present in the file are replaced.
      </p>
      <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} style={{ display: "none" }} />
      <button onClick={() => inputRef.current?.click()} style={{ ...primaryBtn, background: HOME_COLOR.p, color: contrastTextColor(HOME_COLOR.p) }}>
        Choose CSV File
      </button>

      {errors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12, color: "#D32F2F" }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {preview && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#0d1117" }}>Found changes in <em>{fileName}</em>:</div>
          {rows.map(r => <PresetsDiffRow key={r.label} label={r.label} diff={r.diff} />)}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #E2E5EC", background: "#F8F9FC", fontSize: 14, fontWeight: 700, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #D32F2F", background: "#FEF2F2", fontSize: 14, fontWeight: 700, color: "#D32F2F", cursor: "pointer" }}>Replace</button>
          </div>
        </div>
      )}

      {preview && rows.length === 0 && errors.length === 0 && (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>No Hospital/Medication/Intervention/Complaint rows found in <em>{fileName}</em>.</div>
      )}

      {log.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>
              <span style={{ fontWeight: 700, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{formatImportTime(entry.timestamp)} — </span>
              {entry.summary}
            </div>
          ))}
        </div>
      )}
    </FormCard>
  );
}

export function SettingsScreen({
  navTab, setNavTab, today, onHome, onStats, onExport, onNewCall,
  showClearDataConfirm, onRequestClearData, onCancelClearData, onConfirmClearData,
  hospitals, onAddHospital, deleteHospitalTarget, deleteHospitalMessage,
  onRequestDeleteHospital, onCancelDeleteHospital, onConfirmDeleteHospital,
  medications, onAddMedication, deleteMedicationTarget, deleteMedicationMessage,
  onRequestDeleteMedication, onCancelDeleteMedication, onConfirmDeleteMedication, onSetMedicationDefaultRoute,
  interventionDefs, onAddIntervention, deleteInterventionTarget, deleteInterventionMessage,
  onRequestDeleteIntervention, onCancelDeleteIntervention, onConfirmDeleteIntervention,
  onSetInterventionNotesEnabled, onMoveIntervention,
  chiefComplaints, onAddComplaint, deleteComplaintTarget, deleteComplaintMessage,
  onRequestDeleteComplaint, onCancelDeleteComplaint, onConfirmDeleteComplaint,
  themeHex, onSetThemeColor, onResetThemeColors,
  importFileName, importPreview, importErrors, importLog,
  onImportFileSelected, onConfirmImport, onCancelImport,
  importPresetsFileName, importPresetsPreview, importPresetsErrors, importPresetsLog,
  onImportPresetsFileSelected, onConfirmImportPresets, onCancelImportPresets,
}: {
  navTab: string; setNavTab: (t: string) => void; today: string;
  onHome: () => void; onStats: () => void; onExport: () => void; onNewCall: () => void;
  showClearDataConfirm: boolean; onRequestClearData: () => void; onCancelClearData: () => void; onConfirmClearData: () => void;
  hospitals: Hospital[]; onAddHospital: (name: string) => void;
  deleteHospitalTarget: number | null; deleteHospitalMessage?: string;
  onRequestDeleteHospital: (id: number) => void; onCancelDeleteHospital: () => void; onConfirmDeleteHospital: () => void;
  medications: Medication[]; onAddMedication: (name: string) => void;
  deleteMedicationTarget: number | null; deleteMedicationMessage?: string;
  onRequestDeleteMedication: (id: number) => void; onCancelDeleteMedication: () => void; onConfirmDeleteMedication: () => void;
  onSetMedicationDefaultRoute: (id: number, route: string) => void;
  interventionDefs: InterventionDef[]; onAddIntervention: (mode: "trauma" | "medical", name: string, notesEnabled: boolean) => void;
  deleteInterventionTarget: number | null; deleteInterventionMessage?: string;
  onRequestDeleteIntervention: (id: number) => void; onCancelDeleteIntervention: () => void; onConfirmDeleteIntervention: () => void;
  onSetInterventionNotesEnabled: (id: number, notesEnabled: boolean) => void; onMoveIntervention: (id: number, direction: "up" | "down") => void;
  chiefComplaints: ChiefComplaint[]; onAddComplaint: (mode: "trauma" | "medical", name: string) => void;
  deleteComplaintTarget: number | null; deleteComplaintMessage?: string;
  onRequestDeleteComplaint: (id: number) => void; onCancelDeleteComplaint: () => void; onConfirmDeleteComplaint: () => void;
  themeHex: { home: string; trauma: string; medical: string };
  onSetThemeColor: (theme: "home" | "trauma" | "medical", hex: string) => void; onResetThemeColors: () => void;
  importFileName: string | null;
  importPreview: { calls: (Omit<CallRecord, "id"> & { shiftStartKey?: string })[]; shifts: unknown[] } | null;
  importErrors: string[];
  importLog: ImportLogEntry[];
  onImportFileSelected: (name: string, text: string) => void; onConfirmImport: () => void; onCancelImport: () => void;
  importPresetsFileName: string | null; importPresetsPreview: PresetsDiff | null; importPresetsErrors: string[]; importPresetsLog: ImportPresetsLogEntry[];
  onImportPresetsFileSelected: (name: string, text: string) => void; onConfirmImportPresets: () => void; onCancelImportPresets: () => void;
}) {
  return (
    <PhoneShell>
      <DeleteModal
        show={showClearDataConfirm}
        title="Clear all data?"
        message="Deletes all calls and shifts, and deletes all presets to their default settings. This cannot be undone."
        confirmLabel="Clear All Data"
        onCancel={onCancelClearData}
        onConfirm={onConfirmClearData}
      />
      <DeleteModal
        show={deleteHospitalTarget != null}
        title="Delete this hospital?"
        message={deleteHospitalMessage}
        onCancel={onCancelDeleteHospital}
        onConfirm={onConfirmDeleteHospital}
      />
      <DeleteModal
        show={deleteMedicationTarget != null}
        title="Delete this medication?"
        message={deleteMedicationMessage}
        onCancel={onCancelDeleteMedication}
        onConfirm={onConfirmDeleteMedication}
      />
      <DeleteModal
        show={deleteInterventionTarget != null}
        title="Delete this intervention?"
        message={deleteInterventionMessage}
        onCancel={onCancelDeleteIntervention}
        onConfirm={onConfirmDeleteIntervention}
      />
      <DeleteModal
        show={deleteComplaintTarget != null}
        title="Delete this complaint?"
        message={deleteComplaintMessage}
        onCancel={onCancelDeleteComplaint}
        onConfirm={onConfirmDeleteComplaint}
      />
      <div style={{ background: HOME_COLOR.p, padding: "16px 20px 18px" }}>
        <div style={{ ...eyebrow, color: contrastTextColor(HOME_COLOR.p), opacity: 0.65 }}>Weewoo Tracker</div>
        <h1 style={{ margin: 0, color: contrastTextColor(HOME_COLOR.p), fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Settings</h1>
        <div style={{ color: contrastTextColor(HOME_COLOR.p), opacity: 0.7, fontSize: 12, fontWeight: 500, marginTop: 5 }}>{today}</div>
      </div>
      <CurvedShelf bg={HOME_COLOR.p} />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 104px", scrollbarWidth: "none" }}>
        <SLabel>Hospitals</SLabel>
        <ManageListCard label="Manage Hospitals" items={hospitals} placeholder="e.g. Grady"
          onAdd={onAddHospital} onRequestDelete={onRequestDeleteHospital} />

        <SLabel>Medications</SLabel>
        <ManageListCard label="Manage Medications" items={medications} placeholder="e.g. Fentanyl"
          onAdd={onAddMedication} onRequestDelete={onRequestDeleteMedication} onSetDefaultRoute={onSetMedicationDefaultRoute} />

        <SLabel>Interventions</SLabel>
        <ManageInterventionsCard defs={interventionDefs} onAdd={onAddIntervention}
          onRequestDelete={onRequestDeleteIntervention} onSetNotesEnabled={onSetInterventionNotesEnabled}
          onMove={onMoveIntervention} />

        <SLabel>Chief Complaints</SLabel>
        <ManageComplaintsCard items={chiefComplaints} onAdd={onAddComplaint} onRequestDelete={onRequestDeleteComplaint} />

        <SLabel>Data</SLabel>
        <ImportCallsCard
          fileName={importFileName} preview={importPreview} errors={importErrors} log={importLog}
          onFileSelected={onImportFileSelected} onConfirm={onConfirmImport} onCancel={onCancelImport}
        />
        <ImportPresetsCard
          fileName={importPresetsFileName} preview={importPresetsPreview} errors={importPresetsErrors} log={importPresetsLog}
          onFileSelected={onImportPresetsFileSelected} onConfirm={onConfirmImportPresets} onCancel={onCancelImportPresets}
        />
        <SLabel>Appearance</SLabel>
        <CustomizeColorsCard themeHex={themeHex} onSetColor={onSetThemeColor} onReset={onResetThemeColors} />

        <FormCard accent="#D32F2F">
          <CardHead color="#D32F2F" label="Danger Zone" />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Permanently erase every call and shift stored locally on this device. Use this only if you want to start completely fresh.
          </p>
          <button onClick={onRequestClearData} style={{
            width: "100%", padding: "15px 0", border: "1.5px solid #D32F2F", borderRadius: 14,
            color: "#D32F2F", background: "#FEF2F2", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>Clear All Data</button>
        </FormCard>
      </div>

      <BottomNav color={HOME_COLOR.p} light={HOME_COLOR.l} fabShadow={HOME_COLOR.fab} navTab={navTab} setNavTab={setNavTab} isSave={false} onFAB={onNewCall} onExport={onExport} onActivity={onHome} onStats={onStats} />
    </PhoneShell>
  );
}
