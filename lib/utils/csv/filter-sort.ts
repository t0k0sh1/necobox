/**
 * CSVフィルター・ソートユーティリティ
 */

import type { ColumnType, CsvData } from "./types";

// フィルターの型定義
export interface StringFilter {
  type: "string";
  value: string; // 部分一致検索（大文字小文字を区別しない）
}

export interface NumberFilter {
  type: "number";
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=";
  value: number;
}

export type ColumnFilter = StringFilter | NumberFilter;

// フィルター状態（列インデックス -> フィルター）
export type FilterState = Map<number, ColumnFilter>;

// ソート状態
export interface SortState {
  columnIndex: number | null;
  direction: "asc" | "desc" | null;
}

// 表示行インデックス配列
export type DisplayRowIndices = number[];

/**
 * 数値として解析可能かどうかをチェック
 */
function parseNumericValue(value: string): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const num = Number(trimmed);
  return isNaN(num) ? null : num;
}

/**
 * 単一のフィルター条件を評価
 */
function evaluateFilter(cellValue: string, filter: ColumnFilter): boolean {
  if (filter.type === "string") {
    // 部分一致検索（大文字小文字を区別しない）
    return cellValue.toLowerCase().includes(filter.value.toLowerCase());
  } else {
    // 数値比較
    const numValue = parseNumericValue(cellValue);
    if (numValue === null) {
      // 数値として解析できない場合はマッチしない
      return false;
    }
    switch (filter.operator) {
      case "=":
        return numValue === filter.value;
      case "!=":
        return numValue !== filter.value;
      case ">":
        return numValue > filter.value;
      case "<":
        return numValue < filter.value;
      case ">=":
        return numValue >= filter.value;
      case "<=":
        return numValue <= filter.value;
      default:
        return true;
    }
  }
}

/**
 * フィルターを適用して表示行インデックスを取得
 * @param rows データ行
 * @param filters フィルター状態
 * @returns 表示する行のインデックス配列
 */
export function applyFilters(
  rows: string[][],
  filters: FilterState
): DisplayRowIndices {
  if (filters.size === 0) {
    // フィルターがない場合は全行を表示
    return rows.map((_, index) => index);
  }

  const result: DisplayRowIndices = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    let matchesAllFilters = true;

    // すべてのフィルター条件を AND で評価
    for (const [colIndex, filter] of filters) {
      const cellValue = row[colIndex] || "";
      if (!evaluateFilter(cellValue, filter)) {
        matchesAllFilters = false;
        break;
      }
    }

    if (matchesAllFilters) {
      result.push(rowIndex);
    }
  }

  return result;
}

/**
 * ソートを適用
 * @param indices 表示行インデックス
 * @param rows データ行
 * @param sortState ソート状態
 * @param columnTypes 列の型情報
 * @returns ソート後の表示行インデックス
 */
export function applySort(
  indices: DisplayRowIndices,
  rows: string[][],
  sortState: SortState,
  columnTypes: ColumnType[]
): DisplayRowIndices {
  if (sortState.columnIndex === null || sortState.direction === null) {
    return indices;
  }

  const colIndex = sortState.columnIndex;
  const direction = sortState.direction;
  const columnType = columnTypes[colIndex] || "auto";

  // 列が数値型かどうかを判定
  const isNumericColumn =
    columnType === "number" ||
    (columnType === "auto" &&
      indices.some((i) => parseNumericValue(rows[i]?.[colIndex] || "") !== null));

  const sorted = [...indices].sort((aIndex, bIndex) => {
    const aValue = rows[aIndex]?.[colIndex] || "";
    const bValue = rows[bIndex]?.[colIndex] || "";

    // 空値は末尾に配置
    const aEmpty = aValue.trim() === "";
    const bEmpty = bValue.trim() === "";

    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    let comparison: number;

    if (isNumericColumn) {
      // 数値比較
      const aNum = parseNumericValue(aValue);
      const bNum = parseNumericValue(bValue);

      // 数値として解析できない場合は末尾に配置
      if (aNum === null && bNum === null) {
        comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
      } else if (aNum === null) {
        return 1;
      } else if (bNum === null) {
        return -1;
      } else {
        comparison = aNum - bNum;
      }
    } else {
      // 文字列比較（辞書順）
      comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * フィルターとソートを適用して表示行インデックスを計算
 * @param csvData CSVデータ
 * @param filters フィルター状態
 * @param sortState ソート状態
 * @returns 表示行インデックス
 */
export function computeDisplayIndices(
  csvData: CsvData,
  filters: FilterState,
  sortState: SortState
): DisplayRowIndices {
  // まずフィルターを適用
  let indices = applyFilters(csvData.rows, filters);

  // 次にソートを適用
  indices = applySort(indices, csvData.rows, sortState, csvData.columnTypes);

  return indices;
}

/**
 * ソート状態をトグル（なし → 昇順 → 降順 → なし）
 */
export function toggleSort(
  currentState: SortState,
  columnIndex: number
): SortState {
  if (currentState.columnIndex !== columnIndex) {
    // 別の列をクリック: その列で昇順
    return { columnIndex, direction: "asc" };
  }

  // 同じ列をクリック: なし → 昇順 → 降順 → なし
  if (currentState.direction === null) {
    return { columnIndex, direction: "asc" };
  } else if (currentState.direction === "asc") {
    return { columnIndex, direction: "desc" };
  } else {
    return { columnIndex: null, direction: null };
  }
}

/**
 * 表示インデックスを元のデータインデックスに変換
 * @param displayIndex 表示上のインデックス
 * @param displayRowIndices 表示行インデックス配列
 * @returns 元のデータインデックス（見つからない場合は -1）
 */
export function displayToDataIndex(
  displayIndex: number,
  displayRowIndices: DisplayRowIndices
): number {
  return displayRowIndices[displayIndex] ?? -1;
}

/**
 * 元のデータインデックスを表示インデックスに変換
 * @param dataIndex 元のデータインデックス
 * @param displayRowIndices 表示行インデックス配列
 * @returns 表示上のインデックス（見つからない場合は -1）
 */
export function dataToDisplayIndex(
  dataIndex: number,
  displayRowIndices: DisplayRowIndices
): number {
  return displayRowIndices.indexOf(dataIndex);
}

/**
 * 初期ソート状態
 */
export const INITIAL_SORT_STATE: SortState = {
  columnIndex: null,
  direction: null,
};

/**
 * 数値フィルターの演算子ラベル
 */
export const NUMBER_FILTER_OPERATORS: Array<{
  value: NumberFilter["operator"];
  label: string;
}> = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: "≥" },
  { value: "<=", label: "≤" },
];
