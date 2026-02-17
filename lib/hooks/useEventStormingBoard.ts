/**
 * イベントストーミングボードの状態管理フック
 *
 * - ボードのCRUD操作
 * - useUndoRedo との統合
 * - localStorage 永続化
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type EventStormingBoard,
  createEmptyBoard,
  createEmptyBmcBoard,
  exportBoard,
  validateExportData,
  type ExportData,
} from "@/lib/utils/event-storming";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";

const STORAGE_KEY = "necobox-event-storming-board";
const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

/** Undo/Redo 用のスナップショット（viewport を除くボード状態） */
type BoardSnapshot = Omit<EventStormingBoard, "viewport">;

function toBoardSnapshot(board: EventStormingBoard): BoardSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { viewport, ...rest } = board;
  return rest;
}

export interface UseEventStormingBoardReturn {
  board: EventStormingBoard;
  setBoard: (board: EventStormingBoard) => void;
  /** ボード変更（Undo/Redo スナップショット自動保存） */
  updateBoard: (board: EventStormingBoard) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** JSONエクスポート */
  exportToJson: () => void;
  /** JSONインポート */
  importFromJson: (file: File) => Promise<EventStormingBoard | null>;
  /** ボードリセット */
  resetBoard: () => void;
}

export function useEventStormingBoard(): UseEventStormingBoardReturn {
  // SSR/クライアントで同じ初期値を使い、ハイドレーション不一致を防ぐ
  const [board, setBoardState] = useState<EventStormingBoard>(createEmptyBoard);
  const undoRedo = useUndoRedo<BoardSnapshot>();
  const initializedRef = useRef(false);
  const lastSnapshotRef = useRef<string>("");

  // マウント後に localStorage から復元（SSR → クライアント同期のため初回mountでのsetStateは必要）
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EventStormingBoard;
        if (parsed && parsed.id) {
          // bmcフィールドが未定義の場合（v1データ）は空のBMCボードでフォールバック
          if (!parsed.bmc) {
            parsed.bmc = createEmptyBmcBoard();
          }
          // eslint-disable-next-line react-hooks/set-state-in-effect -- mount後のlocalStorage復元は正当なパターン
          setBoardState(parsed);
        }
      }
    } catch {
      // 読み込み失敗時は初期状態を維持
    }
  }, []);

  // localStorage へ保存（デバウンス）
  useEffect(() => {
    if (!initializedRef.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
      } catch {
        // 保存失敗時は無視
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [board]);

  const setBoard = useCallback((newBoard: EventStormingBoard) => {
    setBoardState(newBoard);
  }, []);

  const updateBoard = useCallback(
    (newBoard: EventStormingBoard) => {
      // viewport 変更のみの場合はスナップショットを取らない
      const newSnapshot = JSON.stringify(toBoardSnapshot(newBoard));
      if (newSnapshot !== lastSnapshotRef.current) {
        if (lastSnapshotRef.current !== "") {
          undoRedo.push(toBoardSnapshot(board));
        }
        lastSnapshotRef.current = newSnapshot;
      }
      setBoardState(newBoard);
    },
    [board, undoRedo]
  );

  const undo = useCallback(() => {
    const prev = undoRedo.undo(toBoardSnapshot(board));
    if (prev) {
      const restored = { ...prev, viewport: board.viewport } as EventStormingBoard;
      setBoardState(restored);
      lastSnapshotRef.current = JSON.stringify(toBoardSnapshot(restored));
    }
  }, [board, undoRedo]);

  const redo = useCallback(() => {
    const next = undoRedo.redo(toBoardSnapshot(board));
    if (next) {
      const restored = { ...next, viewport: board.viewport } as EventStormingBoard;
      setBoardState(restored);
      lastSnapshotRef.current = JSON.stringify(toBoardSnapshot(restored));
    }
  }, [board, undoRedo]);

  const exportToJson = useCallback(() => {
    const json = exportBoard(board);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `event-storming-${board.name || "board"}-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [board]);

  const importFromJson = useCallback(
    async (file: File): Promise<EventStormingBoard | null> => {
      try {
        if (file.size > MAX_IMPORT_SIZE) return null;
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        if (!validateExportData(parsed)) return null;
        const data = parsed as ExportData;
        // v1データのインポート時はBMCを空で初期化
        if (!data.board.bmc) {
          data.board.bmc = createEmptyBmcBoard();
        }
        return data.board;
      } catch {
        return null;
      }
    },
    []
  );

  const resetBoard = useCallback(() => {
    const newBoard = createEmptyBoard();
    undoRedo.clear();
    lastSnapshotRef.current = "";
    setBoardState(newBoard);
  }, [undoRedo]);

  return {
    board,
    setBoard,
    updateBoard,
    canUndo: undoRedo.canUndo(),
    canRedo: undoRedo.canRedo(),
    undo,
    redo,
    exportToJson,
    importFromJson,
    resetBoard,
  };
}
