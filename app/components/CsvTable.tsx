"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  normalizeSelection,
  type CellPosition,
  type ColumnFilter,
  type ColumnType,
  type CsvData,
  type DisplayRowIndices,
  type FilterState,
  type RowSelectionRange,
  type SelectionRange,
  type SortState,
} from "@/lib/utils/csv-parser";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { CsvFilterDropdown } from "./CsvFilterDropdown";

interface CsvTableProps {
  data: CsvData;
  editingCell: CellPosition | null;
  selection: SelectionRange | null;
  rowSelection: RowSelectionRange | null;
  onCellChange: (row: number, col: number, value: string) => void;
  onStartEdit: (row: number, col: number) => void;
  onEndEdit: () => void;
  onSelectCell: (row: number, col: number) => void;
  onExtendSelection: (row: number, col: number) => void;
  onSelectRow: (row: number) => void;
  onExtendRowSelection: (row: number) => void;
  onKeyNavigation: (e: React.KeyboardEvent, row: number, col: number) => void;
  onColumnTypeChange?: (col: number, columnType: ColumnType) => void;
  // フィルター・ソート関連
  displayRowIndices?: DisplayRowIndices;
  filterState?: FilterState;
  sortState?: SortState;
  onSort?: (columnIndex: number) => void;
  onFilterChange?: (columnIndex: number, filter: ColumnFilter | null) => void;
  translations: {
    header: string;
    row: string;
    column: string;
    editCell: string;
    noData: string;
    columnTypeAuto?: string;
    columnTypeString?: string;
    columnTypeNumber?: string;
    columnTypeHeader?: string;
    // フィルター関連
    filterPlaceholder?: string;
    filterClear?: string;
    operatorEquals?: string;
    operatorNotEquals?: string;
    operatorGreater?: string;
    operatorLess?: string;
    operatorGreaterOrEquals?: string;
    operatorLessOrEquals?: string;
    // ソート関連
    sortAscending?: string;
    sortDescending?: string;
  };
}

const CELL_MIN_WIDTH = 120;

export function CsvTable({
  data,
  editingCell,
  selection,
  rowSelection,
  onCellChange,
  onStartEdit,
  onEndEdit,
  onSelectCell,
  onExtendSelection,
  onSelectRow,
  onExtendRowSelection,
  onKeyNavigation,
  onColumnTypeChange,
  displayRowIndices,
  filterState,
  sortState,
  onSort,
  onFilterChange,
  translations,
}: CsvTableProps) {
  // textareaRefはヘッダーセルとデータセルの両方で共有される。
  // 同時に編集できるセルは1つだけなので、Reactは常に編集中のセルの
  // textareaへの参照を保持する。
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // ドラッグ選択の状態
  const isDraggingRef = useRef(false);
  const justFinishedDraggingRef = useRef(false);
  // 冗長な onExtendSelection 呼び出しを防ぐため、最後のセル位置を記録
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  // 行番号ドラッグ選択の状態
  const isRowDraggingRef = useRef(false);
  const justFinishedRowDraggingRef = useRef(false);
  const lastRowRef = useRef<number | null>(null);

  // フォーカス用：選択範囲の終端（カーソル位置）
  const selectedCell = selection ? selection.end : null;

  // 正規化された選択範囲をキャッシュ（isCellInSelection のパフォーマンス改善）
  const normalizedSelection = useMemo(
    () => (selection ? normalizeSelection(selection) : null),
    [selection]
  );

  // 正規化された行選択範囲をキャッシュ
  const normalizedRowSelection = useMemo(() => {
    if (!rowSelection) return null;
    const minRow = Math.min(rowSelection.startRow, rowSelection.endRow);
    const maxRow = Math.max(rowSelection.startRow, rowSelection.endRow);
    return { minRow, maxRow };
  }, [rowSelection]);

  // 編集中のセルにフォーカス
  useEffect(() => {
    if (editingCell && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingCell]);

  // 選択セルが変更されたときにフォーカスを当てる
  useEffect(() => {
    if (selectedCell && !editingCell && tableRef.current) {
      const cell = tableRef.current.querySelector(
        `[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`
      ) as HTMLElement | null;
      if (cell) {
        cell.focus();
      }
    }
  }, [selectedCell, editingCell]);

  // セルがクリックされたときの処理（Shift+クリック対応）
  const handleCellClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      // ドラッグ操作の直後は click イベントを無視
      if (justFinishedDraggingRef.current) {
        justFinishedDraggingRef.current = false;
        return;
      }

      if (e.shiftKey && selection) {
        // Shift+クリック: 選択範囲を拡張
        onExtendSelection(row, col);
      } else {
        // 通常クリック: 単一セル選択
        onSelectCell(row, col);
      }
    },
    [onSelectCell, onExtendSelection, selection]
  );

  // セルがダブルクリックされたときの処理
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      onStartEdit(row, col);
    },
    [onStartEdit]
  );

  // ドラッグ選択開始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      // 左クリックのみ
      if (e.button !== 0) return;
      // Shift+クリックはhandleCellClickで処理
      if (e.shiftKey) return;

      e.preventDefault(); // テキスト選択を防止
      isDraggingRef.current = true;
      justFinishedDraggingRef.current = false;
      lastCellRef.current = { row, col }; // ドラッグ開始位置を記録
      onSelectCell(row, col);
    },
    [onSelectCell]
  );

  // ドラッグ中（mouseenter）
  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (isDraggingRef.current) {
        onExtendSelection(row, col);
      }
    },
    [onExtendSelection]
  );

  // ドラッグ中（mousemove）- テーブル全体で監視
  const handleTableMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current || !tableRef.current) return;

      // マウス位置からセルを特定
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;

      const cell = target.closest("[data-row][data-col]") as HTMLElement | null;
      if (!cell) return;

      const row = parseInt(cell.dataset.row || "", 10);
      const col = parseInt(cell.dataset.col || "", 10);

      if (!isNaN(row) && !isNaN(col)) {
        // 前回と同じセルなら何もしない（冗長な呼び出しを防止）
        if (
          lastCellRef.current &&
          lastCellRef.current.row === row &&
          lastCellRef.current.col === col
        ) {
          return;
        }
        lastCellRef.current = { row, col };
        onExtendSelection(row, col);
      }
    },
    [onExtendSelection]
  );

  // ドラッグ終了
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        // ドラッグ操作が行われた場合、フラグを立てる
        justFinishedDraggingRef.current = true;
      }
      isDraggingRef.current = false;
      lastCellRef.current = null; // ドラッグ終了時にリセット

      // 行番号ドラッグ終了
      if (isRowDraggingRef.current) {
        justFinishedRowDraggingRef.current = true;
      }
      isRowDraggingRef.current = false;
      lastRowRef.current = null;
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 行番号クリック
  const handleRowNumberClick = useCallback(
    (e: React.MouseEvent, row: number) => {
      // ドラッグ操作の直後は click イベントを無視
      if (justFinishedRowDraggingRef.current) {
        justFinishedRowDraggingRef.current = false;
        return;
      }

      if (e.shiftKey && rowSelection) {
        // Shift+クリック: 選択範囲を拡張
        onExtendRowSelection(row);
      } else {
        // 通常クリック: 単一行選択
        onSelectRow(row);
      }
    },
    [onSelectRow, onExtendRowSelection, rowSelection]
  );

  // 行番号ドラッグ開始
  const handleRowNumberMouseDown = useCallback(
    (e: React.MouseEvent, row: number) => {
      // 左クリックのみ
      if (e.button !== 0) return;
      // Shift+クリックはhandleRowNumberClickで処理
      if (e.shiftKey) return;

      e.preventDefault(); // テキスト選択を防止
      isRowDraggingRef.current = true;
      justFinishedRowDraggingRef.current = false;
      lastRowRef.current = row;
      onSelectRow(row);
    },
    [onSelectRow]
  );

  // 行番号mouseenter（ドラッグ中）
  const handleRowNumberMouseEnter = useCallback(
    (row: number) => {
      if (isRowDraggingRef.current) {
        if (lastRowRef.current !== row) {
          lastRowRef.current = row;
          onExtendRowSelection(row);
        }
      }
    },
    [onExtendRowSelection]
  );

  // 行が選択されているかどうか
  const isRowSelected = useCallback(
    (row: number): boolean => {
      if (!normalizedRowSelection) return false;
      return row >= normalizedRowSelection.minRow && row <= normalizedRowSelection.maxRow;
    },
    [normalizedRowSelection]
  );

  // セルのキーダウン処理
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (editingCell) {
        // 編集中の場合
        if (e.key === "Escape") {
          e.preventDefault();
          onEndEdit();
        } else if (e.key === "Enter") {
          if (e.altKey) {
            // Alt+Enter (Windows) / Option+Enter (Mac): セル内改行
            e.preventDefault();
            const textarea = e.target as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newValue = value.substring(0, start) + '\n' + value.substring(end);
            onCellChange(row, col, newValue);
            // カーソル位置を改行の後に設定
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = start + 1;
            });
          } else if (!e.shiftKey) {
            e.preventDefault();
            onEndEdit();
            // 次の行に移動
            if (row < data.rows.length - 1) {
              onSelectCell(row + 1, col);
            }
          }
        } else if (e.key === "Tab") {
          e.preventDefault();
          onEndEdit();
          if (e.shiftKey) {
            // 前のセルへ
            if (col > 0) {
              onSelectCell(row, col - 1);
            } else if (row > -1) {
              onSelectCell(row - 1, data.headers.length - 1);
            }
          } else {
            // 次のセルへ
            if (col < data.headers.length - 1) {
              onSelectCell(row, col + 1);
            } else if (row < data.rows.length - 1) {
              onSelectCell(row + 1, 0);
            }
          }
        }
      } else {
        // 選択中の場合
        onKeyNavigation(e, row, col);
      }
    },
    [editingCell, data.rows.length, data.headers.length, onEndEdit, onSelectCell, onKeyNavigation, onCellChange]
  );

  // 入力値の変更処理
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>, row: number, col: number) => {
      onCellChange(row, col, e.target.value);
    },
    [onCellChange]
  );

  // セルの値を取得
  const getCellValue = useCallback(
    (row: number, col: number): string => {
      if (row === -1) {
        return data.headers[col] || "";
      }
      return data.rows[row]?.[col] || "";
    },
    [data.headers, data.rows]
  );

  // 改行数に基づいてtextareaの行数を計算
  const getTextareaRows = useCallback(
    (value: string): number => {
      const lineCount = (value.match(/\n/g) || []).length + 1;
      return Math.max(1, lineCount);
    },
    []
  );

  // セルが選択範囲内かどうか（正規化済みの選択範囲を使用）
  const isCellSelected = useCallback(
    (row: number, col: number): boolean => {
      if (!normalizedSelection) return false;
      return (
        row >= normalizedSelection.start.row &&
        row <= normalizedSelection.end.row &&
        col >= normalizedSelection.start.col &&
        col <= normalizedSelection.end.col
      );
    },
    [normalizedSelection]
  );

  // アクティブセル（選択範囲の開始点/アンカー）かどうか
  const isActiveCell = useCallback(
    (row: number, col: number): boolean => {
      if (!selection) return false;
      return selection.start.row === row && selection.start.col === col;
    },
    [selection]
  );

  // 選択範囲内のセルだが、アクティブセルではないかどうか
  const isInSelectionButNotActive = useCallback(
    (row: number, col: number): boolean => {
      return isCellSelected(row, col) && !isActiveCell(row, col);
    },
    [isCellSelected, isActiveCell]
  );

  // セルが編集中かどうか
  const isCellEditing = useCallback(
    (row: number, col: number): boolean => {
      return editingCell?.row === row && editingCell?.col === col;
    },
    [editingCell]
  );

  // 列タイプのラベル
  const getColumnTypeLabel = (type: ColumnType): string => {
    switch (type) {
      case "auto":
        return translations.columnTypeAuto || "Auto";
      case "string":
        return translations.columnTypeString || "String";
      case "number":
        return translations.columnTypeNumber || "Number";
    }
  };

  // 表示する行のインデックス（フィルター・ソート適用後）
  const rowsToDisplay = useMemo(() => {
    if (displayRowIndices) {
      return displayRowIndices;
    }
    // displayRowIndices が未指定の場合は全行を表示
    return data.rows.map((_, index) => index);
  }, [displayRowIndices, data.rows]);

  // ヘッダークリックでソート（編集中でない場合）
  const handleHeaderClick = useCallback(
    (e: React.MouseEvent, col: number) => {
      // フィルターボタンのクリックは別途処理されるので、ここではソート
      if (onSort && !editingCell) {
        // Shift+クリックは選択拡張なのでソートしない
        if (!e.shiftKey) {
          onSort(col);
        }
      }
    },
    [onSort, editingCell]
  );

  // フィルター変更ハンドラ
  const handleFilterChange = useCallback(
    (columnIndex: number, filter: ColumnFilter | null) => {
      if (onFilterChange) {
        onFilterChange(columnIndex, filter);
      }
    },
    [onFilterChange]
  );

  // データがない場合
  if (data.headers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {translations.noData}
      </div>
    );
  }

  return (
    <div
      ref={tableRef}
      className="overflow-x-auto overflow-y-auto border rounded-lg max-h-[600px]"
      role="grid"
      aria-label="CSV data table"
      aria-multiselectable="true"
      onMouseMove={handleTableMouseMove}
    >
      <table className="border-collapse" style={{ minWidth: "100%" }}>
        <colgroup>
          {/* 行番号列 */}
          <col style={{ width: 48, minWidth: 48 }} />
          {/* データ列 */}
          {data.headers.map((_, col) => (
            <col key={col} style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }} />
          ))}
        </colgroup>

        {/* ヘッダー行 */}
        <thead className="sticky top-0 z-20">
          {/* カラム名 */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            {/* 行番号のヘッダー */}
            <th className="sticky left-0 z-30 bg-gray-200 dark:bg-gray-700 border-b border-r px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              #
            </th>
            {data.headers.map((header, col) => {
              const isActive = isActiveCell(-1, col);
              const isSelected = isCellSelected(-1, col);
              const isSelectedNotActive = isInSelectionButNotActive(-1, col);
              const isSortedColumn = sortState?.columnIndex === col;
              const sortDirection = isSortedColumn ? sortState?.direction : null;
              const columnFilter = filterState?.get(col);
              return (
                <th
                  key={col}
                  data-row={-1}
                  data-col={col}
                  style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }}
                  className={`border-b border-r px-2 py-1 text-left font-semibold text-sm cursor-pointer transition-colors select-none ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500"
                      : isSelectedNotActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  onClick={(e) => handleCellClick(e, -1, col)}
                  onDoubleClick={() => handleCellDoubleClick(-1, col)}
                  onMouseDown={(e) => handleMouseDown(e, -1, col)}
                  onMouseEnter={() => handleMouseEnter(-1, col)}
                  onKeyDown={(e) => handleCellKeyDown(e, -1, col)}
                  tabIndex={isActive ? 0 : -1}
                  role="columnheader"
                  aria-label={`${translations.column} ${col + 1}: ${header}`}
                  aria-selected={isSelected}
                  aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none"}
                >
                  <div className={`relative ${isCellEditing(-1, col) ? 'min-h-6' : header.includes('\n') ? 'min-h-6' : 'h-6'}`}>
                    {isCellEditing(-1, col) ? (
                      <textarea
                        ref={textareaRef}
                        value={getCellValue(-1, col)}
                        onChange={(e) => handleInputChange(e, -1, col)}
                        onKeyDown={(e) => handleCellKeyDown(e, -1, col)}
                        onBlur={onEndEdit}
                        rows={getTextareaRows(getCellValue(-1, col))}
                        className="w-full px-1 py-0 text-sm font-semibold bg-white dark:bg-gray-900 border border-blue-500 rounded outline-none resize-none leading-6"
                        aria-label={translations.editCell}
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`flex-1 leading-6 ${
                            header.includes('\n')
                              ? 'whitespace-pre-wrap line-clamp-2'
                              : 'truncate'
                          }`}
                        >
                          {header || "\u00A0"}
                        </span>
                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {/* ソートボタン */}
                          {onSort && (
                            <button
                              type="button"
                              className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                                sortDirection
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSort(col);
                              }}
                              aria-label={
                                sortDirection === "asc"
                                  ? translations.sortAscending || "Ascending"
                                  : sortDirection === "desc"
                                    ? translations.sortDescending || "Descending"
                                    : "Sort"
                              }
                            >
                              {sortDirection === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5" />
                              ) : sortDirection === "desc" ? (
                                <ArrowDown className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {/* フィルターボタン */}
                          {onFilterChange && (
                            <CsvFilterDropdown
                              columnIndex={col}
                              columnType={data.columnTypes[col] || "auto"}
                              currentFilter={columnFilter}
                              onFilterChange={handleFilterChange}
                              translations={{
                                filterPlaceholder: translations.filterPlaceholder || "Filter...",
                                filterClear: translations.filterClear || "Clear",
                                operatorEquals: translations.operatorEquals || "Equals (=)",
                                operatorNotEquals: translations.operatorNotEquals || "Not equals (≠)",
                                operatorGreater: translations.operatorGreater || "Greater (>)",
                                operatorLess: translations.operatorLess || "Less (<)",
                                operatorGreaterOrEquals: translations.operatorGreaterOrEquals || "Greater or equals (≥)",
                                operatorLessOrEquals: translations.operatorLessOrEquals || "Less or equals (≤)",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>

          {/* 列のデータ型 */}
          {onColumnTypeChange && (
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="sticky left-0 z-30 bg-gray-100 dark:bg-gray-800 border-b border-r px-2 py-1 text-xs text-gray-400">
                {translations.columnTypeHeader || "Type"}
              </th>
              {data.headers.map((_, col) => (
                <th
                  key={col}
                  style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }}
                  className="border-b border-r px-1 py-1"
                >
                  <Select
                    value={data.columnTypes[col] || "auto"}
                    onValueChange={(v) => onColumnTypeChange(col, v as ColumnType)}
                  >
                    <SelectTrigger className="h-6 text-xs w-full">
                      <SelectValue>
                        {getColumnTypeLabel(data.columnTypes[col] || "auto")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {translations.columnTypeAuto || "Auto"}
                      </SelectItem>
                      <SelectItem value="string">
                        {translations.columnTypeString || "String"}
                      </SelectItem>
                      <SelectItem value="number">
                        {translations.columnTypeNumber || "Number"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </th>
              ))}
            </tr>
          )}
        </thead>

        {/* データ行 */}
        <tbody>
          {rowsToDisplay.map((dataRowIndex, displayIndex) => {
            const row = data.rows[dataRowIndex];
            if (!row) return null;
            return (
            <tr
              key={dataRowIndex}
              className={`${
                displayIndex % 2 === 0
                  ? "bg-white dark:bg-gray-950"
                  : "bg-gray-50 dark:bg-gray-900"
              }`}
            >
              {/* 行番号（元のデータの行番号を表示） */}
              <td
                data-row-number={dataRowIndex}
                className={`sticky left-0 z-10 border-b border-r px-2 py-1 text-xs text-center font-mono cursor-pointer select-none transition-colors ${
                  isRowSelected(dataRowIndex)
                    ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={isRowSelected(dataRowIndex)}
                aria-label={`${translations.row} ${dataRowIndex + 1}`}
                onClick={(e) => handleRowNumberClick(e, dataRowIndex)}
                onMouseDown={(e) => handleRowNumberMouseDown(e, dataRowIndex)}
                onMouseEnter={() => handleRowNumberMouseEnter(dataRowIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRow(dataRowIndex);
                  }
                }}
              >
                {dataRowIndex + 1}
              </td>
              {row.map((cell, col) => {
                const isNumberColumn = data.columnTypes[col] === "number";
                const isActive = isActiveCell(dataRowIndex, col);
                const isSelected = isCellSelected(dataRowIndex, col);
                const isSelectedNotActive = isInSelectionButNotActive(dataRowIndex, col);
                const rowIsSelected = isRowSelected(dataRowIndex);
                return (
                  <td
                    key={col}
                    data-row={dataRowIndex}
                    data-col={col}
                    style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }}
                    className={`border-b border-r px-2 py-1 text-sm cursor-pointer transition-colors select-none ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500"
                        : isSelectedNotActive
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : rowIsSelected
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={(e) => handleCellClick(e, dataRowIndex, col)}
                    onDoubleClick={() => handleCellDoubleClick(dataRowIndex, col)}
                    onMouseDown={(e) => handleMouseDown(e, dataRowIndex, col)}
                    onMouseEnter={() => handleMouseEnter(dataRowIndex, col)}
                    onKeyDown={(e) => handleCellKeyDown(e, dataRowIndex, col)}
                    tabIndex={isActive ? 0 : -1}
                    role="gridcell"
                    aria-label={`${translations.row} ${dataRowIndex + 1}, ${translations.column} ${col + 1}: ${cell}`}
                    aria-selected={isSelected || rowIsSelected}
                  >
                    <div className={`relative ${isCellEditing(dataRowIndex, col) ? 'min-h-6' : cell.includes('\n') ? 'min-h-6' : 'h-6'}`}>
                      {isCellEditing(dataRowIndex, col) ? (
                        <textarea
                          ref={textareaRef}
                          value={getCellValue(dataRowIndex, col)}
                          onChange={(e) => handleInputChange(e, dataRowIndex, col)}
                          onKeyDown={(e) => handleCellKeyDown(e, dataRowIndex, col)}
                          onBlur={onEndEdit}
                          rows={getTextareaRows(getCellValue(dataRowIndex, col))}
                          className={`w-full px-1 py-0 text-sm bg-white dark:bg-gray-900 border border-blue-500 rounded outline-none resize-none leading-6 ${
                            isNumberColumn ? "text-right" : ""
                          }`}
                          aria-label={translations.editCell}
                        />
                      ) : (
                        <span
                          className={`block leading-6 ${
                            cell.includes('\n')
                              ? 'whitespace-pre-wrap line-clamp-2'
                              : 'truncate'
                          } ${isNumberColumn ? "text-right" : ""}`}
                        >
                          {cell || "\u00A0"}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
