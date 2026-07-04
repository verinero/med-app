import { useEffect, useRef, useState } from "react";
import { overlayStyle, sheetStyle, dragHandle } from "../styles";

const DISMISS_THRESHOLD = 100;

// Shared bottom-sheet shell: drag-down-to-dismiss (with a snap-back if the
// drag doesn't clear the threshold), backdrop tap-to-dismiss, and a fade on
// the backdrop while dragging. Used by every bottom sheet in the app so the
// gesture only needs to be implemented once.
export function DragSheet({ show, onClose, maxHeight, children }: {
  show: boolean; onClose: () => void; maxHeight?: string; children: React.ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);

  useEffect(() => {
    if (show) { setDragY(0); setDragging(false); }
  }, [show]);

  if (!show) return null;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  }
  function handlePointerUp() {
    setDragging(false);
    if (dragY > DISMISS_THRESHOLD) onClose();
    setDragY(0);
  }

  return (
    <div onClick={onClose} style={{ ...overlayStyle, opacity: dragging ? Math.max(0.4, 1 - dragY / 400) : 1 }}>
      <div onClick={e => e.stopPropagation()} style={{
        ...sheetStyle,
        ...(maxHeight ? { maxHeight, display: "flex", flexDirection: "column" } : {}),
        transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 0.25s ease",
      }}>
        <div
          style={{ display: "flex", justifyContent: "center", padding: "10px 0", cursor: dragging ? "grabbing" : "grab", touchAction: "none", flexShrink: 0 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div style={{ ...dragHandle, margin: 0 }} />
        </div>
        {children}
      </div>
    </div>
  );
}
