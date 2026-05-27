import { useCallback, useRef } from 'react';
import { ISSUE_TABLE_MAX_COLUMN_WIDTH, ISSUE_TABLE_MIN_COLUMN_WIDTH } from './constants';

export function useColumnResize(onColumnWidthChange: (colId: string, width: number) => void) {
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const clampWidth = (w: number) =>
    Math.min(ISSUE_TABLE_MAX_COLUMN_WIDTH, Math.max(ISSUE_TABLE_MIN_COLUMN_WIDTH, Math.round(w)));

  const onResizePointerDown = useCallback(
    (colId: string, currentWidth: number) => (e: React.PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { colId, startX: e.clientX, startWidth: currentWidth };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const state = resizingRef.current;
      if (!state) return;
      const next = clampWidth(state.startWidth + (e.clientX - state.startX));
      onColumnWidthChange(state.colId, next);
    },
    [onColumnWidthChange]
  );

  const onResizePointerUp = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    if (!resizingRef.current) return;
    resizingRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  return { onResizePointerDown, onResizePointerMove, onResizePointerUp };
}
