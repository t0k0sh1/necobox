import { useCallback, useMemo, useRef } from "react";

/** Undo/Redo 履歴上限 */
const MAX_HISTORY = 50;

export interface UndoRedoState<T> {
  past: T[];
  future: T[];
}

export interface UndoRedoActions<T> {
  /** 現在の状態をスナップショットとして履歴に追加 */
  push: (state: T) => void;
  /** 1つ前の状態に戻す。戻す状態があれば返す。なければ null */
  undo: (current: T) => T | null;
  /** やり直す。やり直す状態があれば返す。なければ null */
  redo: (current: T) => T | null;
  /** 履歴をクリア */
  clear: () => void;
  /** Undo 可能か */
  canUndo: () => boolean;
  /** Redo 可能か */
  canRedo: () => boolean;
}

/**
 * Undo/Redo 履歴管理フック
 *
 * push() で現在の状態をスナップショットとして保存、
 * undo()/redo() で前後の状態を取得する。
 * 状態の適用はコンポーネント側で行う。
 */
export function useUndoRedo<T>(): UndoRedoActions<T> {
  const historyRef = useRef<UndoRedoState<T>>({ past: [], future: [] });

  const push = useCallback((state: T) => {
    const h = historyRef.current;
    const newPast = [...h.past, state];
    if (newPast.length > MAX_HISTORY) {
      newPast.shift();
    }
    historyRef.current = { past: newPast, future: [] };
  }, []);

  const undo = useCallback((current: T): T | null => {
    const h = historyRef.current;
    if (h.past.length === 0) return null;
    const prev = h.past[h.past.length - 1];
    historyRef.current = {
      past: h.past.slice(0, -1),
      future: [current, ...h.future],
    };
    return prev;
  }, []);

  const redo = useCallback((current: T): T | null => {
    const h = historyRef.current;
    if (h.future.length === 0) return null;
    const next = h.future[0];
    historyRef.current = {
      past: [...h.past, current],
      future: h.future.slice(1),
    };
    return next;
  }, []);

  const clear = useCallback(() => {
    historyRef.current = { past: [], future: [] };
  }, []);

  const canUndo = useCallback(() => historyRef.current.past.length > 0, []);
  const canRedo = useCallback(() => historyRef.current.future.length > 0, []);

  return useMemo(
    () => ({ push, undo, redo, clear, canUndo, canRedo }),
    [push, undo, redo, clear, canUndo, canRedo]
  );
}
