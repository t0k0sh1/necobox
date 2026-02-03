/**
 * CSVパーサー
 * RFC 4180準拠のCSV解析機能を提供
 */

import type { ColumnType, CsvData, CsvOptions } from "./types";
import { DEFAULT_CSV_OPTIONS } from "./types";

/**
 * 値が数値として解釈可能かチェック
 */
export function isNumeric(value: string): boolean {
  if (value.trim() === "") return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * 列のデータ型を自動検出
 * 全ての値が数値として解釈可能ならnumber、そうでなければstring
 */
export function detectColumnType(values: string[]): ColumnType {
  const nonEmptyValues = values.filter((v) => v.trim() !== "");
  if (nonEmptyValues.length === 0) return "auto";

  const allNumeric = nonEmptyValues.every((v) => isNumeric(v));
  return allNumeric ? "number" : "string";
}

/**
 * 区切り文字を自動検出する
 * カンマ、タブ、セミコロン、パイプの出現頻度から推定
 */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).slice(0, 10); // 最初の10行をサンプリング
  if (lines.length === 0) return ",";

  const delimiters = [",", "\t", ";", "|"];
  const counts: Record<string, number[]> = {};

  for (const delimiter of delimiters) {
    counts[delimiter] = lines.map((line) => {
      // クォート内の区切り文字を除外してカウント
      // RFC 4180準拠: ダブルクォートのみをクォート文字として扱い、
      // エスケープされたクォート（""）も考慮
      let count = 0;
      let inQuote = false;
      const quoteChar = '"';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === quoteChar) {
          if (inQuote && nextChar === quoteChar) {
            // エスケープされたクォート（""）はスキップ
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (!inQuote && char === delimiter) {
          count++;
        }
      }
      return count;
    });
  }

  // 各区切り文字の一貫性をスコア化（全行で同じ数出現するほど高スコア）
  let bestDelimiter = ",";
  let bestScore = -1;

  for (const delimiter of delimiters) {
    const delimiterCounts = counts[delimiter];
    const nonZeroCounts = delimiterCounts.filter((c) => c > 0);
    if (nonZeroCounts.length === 0) continue;

    const avgCount =
      nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
    const variance =
      nonZeroCounts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) /
      nonZeroCounts.length;

    // スコア: 平均出現数が多く、分散が小さいほど良い
    const score = avgCount / (variance + 1);
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * CSVテキストをパースしてCsvDataに変換
 * RFC 4180準拠: クォート内の改行、ダブルクォートのエスケープに対応
 */
export function parseCSV(
  text: string,
  options: Partial<CsvOptions> = {}
): CsvData {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
  const { delimiter, hasHeader, quoteChar, columnNamePrefix } = opts;

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuote = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuote) {
      if (char === quoteChar) {
        if (nextChar === quoteChar) {
          // エスケープされたクォート
          currentField += quoteChar;
          i += 2;
          continue;
        } else {
          // クォート終了
          inQuote = false;
          i++;
          continue;
        }
      } else {
        // クォート内の文字（改行も含む）
        currentField += char;
        i++;
        continue;
      }
    }

    // クォート外
    if (char === quoteChar) {
      // クォート開始
      inQuote = true;
      i++;
      continue;
    }

    if (char === delimiter) {
      // フィールド区切り
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (char === "\r" && nextChar === "\n") {
      // Windows改行
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i += 2;
      continue;
    }

    if (char === "\n") {
      // Unix改行
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
      continue;
    }

    // 通常の文字
    currentField += char;
    i++;
  }

  // 最後のフィールドと行を追加
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // 空行を除去
  const filteredRows = rows.filter(
    (row) => row.length > 1 || (row.length === 1 && row[0] !== "")
  );

  if (filteredRows.length === 0) {
    return { headers: [], rows: [], hasHeader, columnTypes: [] };
  }

  // 列数を統一（最大列数に合わせる）
  const maxCols = Math.max(...filteredRows.map((row) => row.length));
  const normalizedRows = filteredRows.map((row) => {
    const newRow = [...row];
    while (newRow.length < maxCols) {
      newRow.push("");
    }
    return newRow;
  });

  // 各列のデータ型を自動検出
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;
  const columnTypes: ColumnType[] = [];
  for (let col = 0; col < maxCols; col++) {
    const columnValues = dataRows.map((row) => row[col]);
    columnTypes.push(detectColumnType(columnValues));
  }

  if (hasHeader && normalizedRows.length > 0) {
    return {
      headers: normalizedRows[0],
      rows: normalizedRows.slice(1),
      hasHeader: true,
      columnTypes,
    };
  }

  // ヘッダーなしの場合、列番号をヘッダーとして使用
  const headers = Array.from(
    { length: maxCols },
    (_, i) => `${columnNamePrefix} ${i + 1}`
  );
  return {
    headers,
    rows: normalizedRows,
    hasHeader: false,
    columnTypes,
  };
}
