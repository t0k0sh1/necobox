/**
 * ユーザーストーリーマッピングボードの状態管理フック
 *
 * - ボードのCRUD操作
 * - useUndoRedo との統合
 * - localStorage 永続化
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type StoryMappingBoard,
  createEmptyStoryMappingBoard,
} from "@/lib/utils/event-storming";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";

const STORAGE_KEY = "necobox-story-mapping-board";

export interface UseStoryMappingBoardReturn {
  board: StoryMappingBoard;
  setBoard: (board: StoryMappingBoard) => void;
  /** ボード変更（Undo/Redo スナップショット自動保存） */
  updateBoard: (board: StoryMappingBoard) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** ボードリセット */
  resetBoard: () => void;
}

export function useStoryMappingBoard(): UseStoryMappingBoardReturn {
  const [board, setBoardState] = useState<StoryMappingBoard>(createEmptyStoryMappingBoard);
  const undoRedo = useUndoRedo<StoryMappingBoard>();
  const initializedRef = useRef(false);
  const lastSnapshotRef = useRef<string>("");

  // マウント後に localStorage から復元
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoryMappingBoard;
        if (parsed && Array.isArray(parsed.activities)) {
          // releases フィールドが未定義の場合はフォールバック
          if (!Array.isArray(parsed.releases)) {
            parsed.releases = [];
          }
          // eslint-disable-next-line react-hooks/set-state-in-effect -- mount後のlocalStorage復元は正当なパターン
          setBoardState(parsed);
          lastSnapshotRef.current = JSON.stringify(parsed);
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

  const setBoard = useCallback((newBoard: StoryMappingBoard) => {
    setBoardState(newBoard);
  }, []);

  const updateBoard = useCallback(
    (newBoard: StoryMappingBoard) => {
      const newSnapshot = JSON.stringify(newBoard);
      if (newSnapshot !== lastSnapshotRef.current) {
        if (lastSnapshotRef.current !== "") {
          undoRedo.push(board);
        }
        lastSnapshotRef.current = newSnapshot;
      }
      setBoardState(newBoard);
    },
    [board, undoRedo]
  );

  const undo = useCallback(() => {
    const prev = undoRedo.undo(board);
    if (prev) {
      setBoardState(prev);
      lastSnapshotRef.current = JSON.stringify(prev);
    }
  }, [board, undoRedo]);

  const redo = useCallback(() => {
    const next = undoRedo.redo(board);
    if (next) {
      setBoardState(next);
      lastSnapshotRef.current = JSON.stringify(next);
    }
  }, [board, undoRedo]);

  const resetBoard = useCallback(() => {
    const newBoard = createEmptyStoryMappingBoard();
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
    resetBoard,
  };
}
