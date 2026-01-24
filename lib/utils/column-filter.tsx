import type { ReactNode } from "react";

/**
 * 列フィルタ条件
 */
export interface ColumnFilter {
  column: number; // 1始まり
  pattern: string; // 空文字 = ハイライトのみ
}

/**
 * パース結果
 */
export interface ParsedFilter {
  columnFilters: ColumnFilter[];
  generalPattern: string | null;
}

/**
 * 検索テキストを解析して列フィルタと一般パターンを分離する
 *
 * 例:
 * - "error" -> { columnFilters: [], generalPattern: "error" }
 * - "3:" -> { columnFilters: [{ column: 3, pattern: "" }], generalPattern: null }
 * - "3:for" -> { columnFilters: [{ column: 3, pattern: "for" }], generalPattern: null }
 * - "2:GET, 3:200" -> { columnFilters: [{ column: 2, pattern: "GET" }, { column: 3, pattern: "200" }], generalPattern: null }
 */
export function parseColumnFilter(searchText: string): ParsedFilter {
  const trimmed = searchText.trim();

  if (!trimmed) {
    return { columnFilters: [], generalPattern: null };
  }

  // カンマで分割（列フィルタの場合）
  const parts = trimmed.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

  // 列フィルタパターン: "数字:" で始まる（例: "3:", "3:for", "12:value"）
  const columnFilterRegex = /^(\d+):(.*)$/;

  const columnFilters: ColumnFilter[] = [];
  const nonColumnParts: string[] = [];

  for (const part of parts) {
    const match = part.match(columnFilterRegex);
    if (match) {
      const column = parseInt(match[1], 10);
      const pattern = match[2].trim();
      if (column >= 1) {
        columnFilters.push({ column, pattern });
      }
    } else {
      nonColumnParts.push(part);
    }
  }

  // 列フィルタがある場合、非列フィルタ部分は無視するか一般パターンとして扱う
  if (columnFilters.length > 0) {
    // 列フィルタモードでは、非列フィルタ部分は一般パターンとして扱わない
    return { columnFilters, generalPattern: null };
  }

  // 列フィルタがない場合は全体を一般パターンとして扱う
  return { columnFilters: [], generalPattern: trimmed };
}

/**
 * 行を区切り文字で列に分割する
 */
export function splitLineToColumns(line: string, delimiter: string): string[] {
  if (!delimiter) {
    return [line];
  }

  // スペースの場合は連続スペースを1つの区切りとして扱う
  if (delimiter === " ") {
    return line.split(/\s+/).filter((col) => col.length > 0);
  }

  return line.split(delimiter);
}

/**
 * 列フィルタが行にマッチするかを判定する
 * すべてのフィルタがマッチした場合にtrueを返す（AND条件）
 */
export function matchesColumnFilters(
  columns: string[],
  filters: ColumnFilter[],
  isRegex: boolean
): boolean {
  // フィルタがない場合は常にマッチ
  if (filters.length === 0) {
    return true;
  }

  for (const filter of filters) {
    const columnIndex = filter.column - 1; // 0始まりに変換

    // 列番号が範囲外の場合はマッチしない
    if (columnIndex < 0 || columnIndex >= columns.length) {
      return false;
    }

    const columnValue = columns[columnIndex];

    // パターンが空の場合はハイライトのみ（フィルタとしては常にマッチ）
    if (!filter.pattern) {
      continue;
    }

    // パターンマッチ
    if (isRegex) {
      try {
        const regex = new RegExp(filter.pattern, "i");
        if (!regex.test(columnValue)) {
          return false;
        }
      } catch {
        // 無効な正規表現の場合は文字列マッチにフォールバック
        if (!columnValue.toLowerCase().includes(filter.pattern.toLowerCase())) {
          return false;
        }
      }
    } else {
      if (!columnValue.toLowerCase().includes(filter.pattern.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

/**
 * ハイライト対象の列番号セットを取得
 */
export function getHighlightColumns(filters: ColumnFilter[]): Set<number> {
  const columns = new Set<number>();
  for (const filter of filters) {
    columns.add(filter.column);
  }
  return columns;
}

/**
 * 列ハイライトと検索ハイライトを適用した要素を生成する
 */
export function highlightColumnsWithSearch(
  line: string,
  delimiter: string,
  targetColumns: Set<number>,
  pattern: string,
  isRegex: boolean,
  highlightMatchFn: (text: string, pattern: string, isRegex: boolean) => ReactNode
): ReactNode[] {
  // 区切り文字がない場合は通常のハイライトのみ
  if (!delimiter) {
    return [highlightMatchFn(line, pattern, isRegex)];
  }

  const columns = splitLineToColumns(line, delimiter);
  const result: ReactNode[] = [];

  for (let i = 0; i < columns.length; i++) {
    const columnNumber = i + 1; // 1始まり
    const isTargetColumn = targetColumns.size === 0 || targetColumns.has(columnNumber);
    const columnText = columns[i];

    // 区切り文字を追加（最初の列以外）
    if (i > 0) {
      result.push(
        <span key={`sep-${i}`} className={isTargetColumn ? "" : "text-gray-400"}>
          {delimiter === " " ? " " : delimiter}
        </span>
      );
    }

    // 列の内容をレンダリング
    if (isTargetColumn && pattern) {
      // 対象列で検索パターンがある場合はハイライト
      result.push(
        <span key={`col-${i}`}>
          {highlightMatchFn(columnText, pattern, isRegex)}
        </span>
      );
    } else if (isTargetColumn) {
      // 対象列でパターンがない場合はそのまま表示
      result.push(
        <span key={`col-${i}`}>
          {columnText}
        </span>
      );
    } else {
      // 非対象列はグレー表示
      result.push(
        <span key={`col-${i}`} className="text-gray-400">
          {columnText}
        </span>
      );
    }
  }

  return result;
}

/**
 * 列フィルタモードかどうかを判定
 */
export function isColumnFilterMode(parsedFilter: ParsedFilter): boolean {
  return parsedFilter.columnFilters.length > 0;
}

/**
 * 列フィルタからパターンを取得（最初のフィルタのパターンを返す）
 */
export function getColumnFilterPattern(filters: ColumnFilter[]): string {
  for (const filter of filters) {
    if (filter.pattern) {
      return filter.pattern;
    }
  }
  return "";
}
