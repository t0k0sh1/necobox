"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CellPosition, ColumnType, CsvData } from "@/lib/utils/csv-parser";
import React, { useCallback, useEffect, useRef } from "react";

interface CsvTableProps {
  data: CsvData;
  editingCell: CellPosition | null;
  selectedCell: CellPosition | null;
  onCellChange: (row: number, col: number, value: string) => void;
  onStartEdit: (row: number, col: number) => void;
  onEndEdit: () => void;
  onSelectCell: (row: number, col: number) => void;
  onKeyNavigation: (e: React.KeyboardEvent, row: number, col: number) => void;
  onColumnTypeChange?: (col: number, columnType: ColumnType) => void;
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
  };
}

const CELL_MIN_WIDTH = 120;

export function CsvTable({
  data,
  editingCell,
  selectedCell,
  onCellChange,
  onStartEdit,
  onEndEdit,
  onSelectCell,
  onKeyNavigation,
  onColumnTypeChange,
  translations,
}: CsvTableProps) {
  // inputRefはヘッダーセルとデータセルの両方で共有される。
  // 同時に編集できるセルは1つだけなので、Reactは常に編集中のセルの
  // inputへの参照を保持する。
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // 編集中のセルにフォーカス
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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

  // セルがクリックされたときの処理
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      onSelectCell(row, col);
    },
    [onSelectCell]
  );

  // セルがダブルクリックされたときの処理
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      onStartEdit(row, col);
    },
    [onStartEdit]
  );

  // セルのキーダウン処理
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (editingCell) {
        // 編集中の場合
        if (e.key === "Escape") {
          e.preventDefault();
          onEndEdit();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEndEdit();
          // 次の行に移動
          if (row < data.rows.length - 1) {
            onSelectCell(row + 1, col);
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
    [editingCell, data.rows.length, data.headers.length, onEndEdit, onSelectCell, onKeyNavigation]
  );

  // 入力値の変更処理
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
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

  // セルが選択されているかどうか
  const isCellSelected = useCallback(
    (row: number, col: number): boolean => {
      return selectedCell?.row === row && selectedCell?.col === col;
    },
    [selectedCell]
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
            {data.headers.map((header, col) => (
              <th
                key={col}
                data-row={-1}
                data-col={col}
                style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }}
                className={`border-b border-r px-2 py-1 text-left font-semibold text-sm cursor-pointer transition-colors ${
                  isCellSelected(-1, col)
                    ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                onClick={() => handleCellClick(-1, col)}
                onDoubleClick={() => handleCellDoubleClick(-1, col)}
                onKeyDown={(e) => handleCellKeyDown(e, -1, col)}
                tabIndex={isCellSelected(-1, col) ? 0 : -1}
                role="columnheader"
                aria-label={`${translations.column} ${col + 1}: ${header}`}
              >
                <div className="relative h-6">
                  {isCellEditing(-1, col) ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={getCellValue(-1, col)}
                      onChange={(e) => handleInputChange(e, -1, col)}
                      onKeyDown={(e) => handleCellKeyDown(e, -1, col)}
                      onBlur={onEndEdit}
                      className="absolute inset-0 w-full h-full px-1 py-0 text-sm font-semibold bg-white dark:bg-gray-900 border border-blue-500 rounded outline-none"
                      aria-label={translations.editCell}
                    />
                  ) : (
                    <span className="block truncate leading-6">{header || "\u00A0"}</span>
                  )}
                </div>
              </th>
            ))}
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
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${
                rowIndex % 2 === 0
                  ? "bg-white dark:bg-gray-950"
                  : "bg-gray-50 dark:bg-gray-900"
              }`}
            >
              {/* 行番号 */}
              <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-r px-2 py-1 text-xs text-gray-500 dark:text-gray-400 text-center font-mono">
                {rowIndex + 1}
              </td>
              {row.map((cell, col) => {
                const isNumberColumn = data.columnTypes[col] === "number";
                return (
                  <td
                    key={col}
                    data-row={rowIndex}
                    data-col={col}
                    style={{ width: CELL_MIN_WIDTH, minWidth: CELL_MIN_WIDTH }}
                    className={`border-b border-r px-2 py-1 text-sm cursor-pointer transition-colors ${
                      isCellSelected(rowIndex, col)
                        ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => handleCellClick(rowIndex, col)}
                    onDoubleClick={() => handleCellDoubleClick(rowIndex, col)}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col)}
                    tabIndex={isCellSelected(rowIndex, col) ? 0 : -1}
                    role="gridcell"
                    aria-label={`${translations.row} ${rowIndex + 1}, ${translations.column} ${col + 1}: ${cell}`}
                  >
                    <div className="relative h-6">
                      {isCellEditing(rowIndex, col) ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={getCellValue(rowIndex, col)}
                          onChange={(e) => handleInputChange(e, rowIndex, col)}
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col)}
                          onBlur={onEndEdit}
                          className={`absolute inset-0 w-full h-full px-1 py-0 text-sm bg-white dark:bg-gray-900 border border-blue-500 rounded outline-none ${
                            isNumberColumn ? "text-right" : ""
                          }`}
                          aria-label={translations.editCell}
                        />
                      ) : (
                        <span
                          className={`block truncate leading-6 ${
                            isNumberColumn ? "text-right" : ""
                          }`}
                        >
                          {cell || "\u00A0"}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
