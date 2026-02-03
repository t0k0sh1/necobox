/**
 * 選択範囲ユーティリティ
 */

import type { SelectionRange } from "./types";

/**
 * 選択範囲を正規化（startが左上、endが右下になるように調整）
 */
export function normalizeSelection(selection: SelectionRange): SelectionRange {
  return {
    start: {
      row: Math.min(selection.start.row, selection.end.row),
      col: Math.min(selection.start.col, selection.end.col),
    },
    end: {
      row: Math.max(selection.start.row, selection.end.row),
      col: Math.max(selection.start.col, selection.end.col),
    },
  };
}

/**
 * セルが選択範囲内にあるか判定
 */
export function isCellInSelection(
  row: number,
  col: number,
  selection: SelectionRange | null
): boolean {
  if (!selection) return false;
  const norm = normalizeSelection(selection);
  return (
    row >= norm.start.row &&
    row <= norm.end.row &&
    col >= norm.start.col &&
    col <= norm.end.col
  );
}
