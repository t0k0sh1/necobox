/**
 * CSVデータ操作ユーティリティ
 */

import { detectColumnType } from "./parser";
import type { ColumnType, CsvData } from "./types";

/**
 * 空のCsvDataを生成
 * @param cols 列数
 * @param rows 行数
 * @param hasHeader ヘッダーありかどうか
 * @param columnNamePrefix 列名のプレフィックス（国際化用）
 */
export function createEmptyCsvData(
  cols: number = 3,
  rows: number = 5,
  hasHeader: boolean = true,
  columnNamePrefix: string = "Column"
): CsvData {
  const headers = Array.from(
    { length: cols },
    (_, i) => `${columnNamePrefix} ${i + 1}`
  );
  const emptyRows = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
  const columnTypes: ColumnType[] = Array.from({ length: cols }, () => "auto");

  return {
    headers,
    rows: emptyRows,
    hasHeader,
    columnTypes,
  };
}

/**
 * 行を追加
 */
export function addRow(data: CsvData, index?: number): CsvData {
  const newRow = Array.from({ length: data.headers.length }, () => "");
  const newRows = [...data.rows];

  if (index === undefined || index >= newRows.length) {
    newRows.push(newRow);
  } else {
    newRows.splice(index, 0, newRow);
  }

  return { ...data, rows: newRows };
}

/**
 * 行を削除
 */
export function removeRow(data: CsvData, index: number): CsvData {
  if (index < 0 || index >= data.rows.length) {
    return data;
  }

  const newRows = [...data.rows];
  newRows.splice(index, 1);

  return { ...data, rows: newRows };
}

/**
 * 複数行を一括削除
 * @param data CSVデータ
 * @param indices 削除する行のインデックス配列
 */
export function removeRows(data: CsvData, indices: number[]): CsvData {
  // 重複を除去し降順にソート（後ろから削除でインデックスずれ防止）
  const uniqueIndices = [...new Set(indices)]
    .filter((i) => i >= 0 && i < data.rows.length)
    .sort((a, b) => b - a);

  if (uniqueIndices.length === 0) return data;

  const newRows = [...data.rows];
  for (const index of uniqueIndices) {
    newRows.splice(index, 1);
  }
  return { ...data, rows: newRows };
}

/**
 * 列を追加
 * @param data CSVデータ
 * @param index 挿入位置（省略時は末尾）
 * @param columnType 列のデータ型
 * @param columnNamePrefix 列名のプレフィックス（国際化用）
 */
export function addColumn(
  data: CsvData,
  index?: number,
  columnType: ColumnType = "auto",
  columnNamePrefix: string = "Column"
): CsvData {
  const colIndex =
    index === undefined || index >= data.headers.length
      ? data.headers.length
      : index;

  const newHeaders = [...data.headers];
  newHeaders.splice(
    colIndex,
    0,
    `${columnNamePrefix} ${newHeaders.length + 1}`
  );

  const newRows = data.rows.map((row) => {
    const newRow = [...row];
    newRow.splice(colIndex, 0, "");
    return newRow;
  });

  const newColumnTypes = [...data.columnTypes];
  newColumnTypes.splice(colIndex, 0, columnType);

  return {
    ...data,
    headers: newHeaders,
    rows: newRows,
    columnTypes: newColumnTypes,
  };
}

/**
 * 列を削除
 */
export function removeColumn(data: CsvData, index: number): CsvData {
  if (index < 0 || index >= data.headers.length) {
    return data;
  }

  const newHeaders = [...data.headers];
  newHeaders.splice(index, 1);

  const newRows = data.rows.map((row) => {
    const newRow = [...row];
    newRow.splice(index, 1);
    return newRow;
  });

  const newColumnTypes = [...data.columnTypes];
  newColumnTypes.splice(index, 1);

  return {
    ...data,
    headers: newHeaders,
    rows: newRows,
    columnTypes: newColumnTypes,
  };
}

/**
 * セルの値を更新
 */
export function updateCell(
  data: CsvData,
  row: number,
  col: number,
  value: string
): CsvData {
  if (col < 0 || col >= data.headers.length) {
    return data;
  }

  // ヘッダー行の更新（row === -1）
  if (row === -1) {
    const newHeaders = [...data.headers];
    newHeaders[col] = value;
    return { ...data, headers: newHeaders };
  }

  // データ行の更新
  if (row < 0 || row >= data.rows.length) {
    return data;
  }

  const newRows = data.rows.map((r, i) => {
    if (i === row) {
      const newRow = [...r];
      newRow[col] = value;
      return newRow;
    }
    return r;
  });

  return { ...data, rows: newRows };
}

/**
 * 複数セルの一括更新（パフォーマンス最適化版）
 */
export function updateCells(
  data: CsvData,
  updates: Array<{ row: number; col: number; value: string }>
): CsvData {
  // アップデートがない場合はそのまま返す
  if (updates.length === 0) {
    return data;
  }

  // ヘッダー更新があるかチェック
  const headerUpdates = updates.filter((u) => u.row === -1);
  const rowUpdates = updates.filter((u) => u.row >= 0);

  // ヘッダーを一度だけクローン
  const newHeaders =
    headerUpdates.length > 0 ? [...data.headers] : data.headers;
  for (const { col, value } of headerUpdates) {
    if (col >= 0 && col < newHeaders.length) {
      newHeaders[col] = value;
    }
  }

  // 行配列を一度だけクローンし、その上で全ての更新を適用する
  const newRows = data.rows.map((row) => [...row]);
  for (const { row, col, value } of rowUpdates) {
    if (
      row >= 0 &&
      row < newRows.length &&
      col >= 0 &&
      col < newRows[row].length
    ) {
      newRows[row][col] = value;
    }
  }

  return { ...data, headers: newHeaders, rows: newRows };
}

/**
 * 列のデータ型を更新
 */
export function updateColumnType(
  data: CsvData,
  col: number,
  columnType: ColumnType
): CsvData {
  if (col < 0 || col >= data.columnTypes.length) {
    return data;
  }

  const newColumnTypes = [...data.columnTypes];
  newColumnTypes[col] = columnType;

  return { ...data, columnTypes: newColumnTypes };
}

/**
 * 全ての列のデータ型を再検出
 */
export function redetectColumnTypes(data: CsvData): CsvData {
  const columnTypes: ColumnType[] = [];
  for (let col = 0; col < data.headers.length; col++) {
    const columnValues = data.rows.map((row) => row[col]);
    columnTypes.push(detectColumnType(columnValues));
  }
  return { ...data, columnTypes };
}
