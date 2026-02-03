/**
 * CSVパーサーユーティリティ
 * RFC 4180準拠のCSV解析・生成機能を提供
 */

import Encoding from "encoding-japanese";

// 列のデータ型
export type ColumnType = "auto" | "string" | "number";

// サポートするエンコーディング（入力用：自動検出対応）
export type EncodingType = "utf-8" | "utf-8-bom" | "shift_jis" | "euc-jp";

// 出力用エンコーディング（入力用と同一、Shift_JIS/EUC-JPはencoding-japaneseで対応）
export type OutputEncodingType = EncodingType;

export const ENCODING_LABELS: Record<EncodingType, string> = {
  "utf-8": "UTF-8",
  "utf-8-bom": "UTF-8 (BOM)",
  shift_jis: "Shift_JIS",
  "euc-jp": "EUC-JP",
};

export const OUTPUT_ENCODING_LABELS: Record<OutputEncodingType, string> = {
  "utf-8": "UTF-8",
  "utf-8-bom": "UTF-8 (BOM)",
  shift_jis: "Shift_JIS",
  "euc-jp": "EUC-JP",
};

export interface CsvData {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
  columnTypes: ColumnType[]; // 各列のデータ型
}

// 文字列のクォート方法
export type QuoteStyle = "always" | "as-needed";

export interface CsvOptions {
  delimiter: string;
  hasHeader: boolean;
  quoteChar: '"' | "'";
  encoding: EncodingType;
  quoteStyle: QuoteStyle;
  columnNamePrefix: string; // デフォルト列名のプレフィックス（国際化用）
}

export interface CellPosition {
  row: number;
  col: number;
}

// 複数セル選択の範囲
export interface SelectionRange {
  start: CellPosition;  // アンカーポイント（選択開始点）
  end: CellPosition;    // 選択終了点
}

export const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ",",
  hasHeader: true,
  quoteChar: '"',
  encoding: "utf-8",
  quoteStyle: "as-needed",
  columnNamePrefix: "Column",
};

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
 * ArrayBufferを指定したエンコーディングでデコード
 */
export function decodeWithEncoding(
  buffer: ArrayBuffer,
  encoding: EncodingType
): string {
  // BOM付きUTF-8の場合はBOMを除去
  const actualEncoding = encoding === "utf-8-bom" ? "utf-8" : encoding;

  try {
    const decoder = new TextDecoder(actualEncoding);
    let text = decoder.decode(buffer);

    // BOMを除去
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    return text;
  } catch {
    // フォールバック: UTF-8で試行
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
  }
}

/**
 * エンコーディングを自動検出
 * BOM、文字パターンから推定
 */
export function detectEncoding(buffer: ArrayBuffer): EncodingType {
  const bytes = new Uint8Array(buffer);

  // BOM検出
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8-bom";
  }

  // Shift_JIS/EUC-JP判定（簡易版）
  // 日本語文字が含まれているかをチェック
  let shiftJisScore = 0;
  let eucJpScore = 0;

  for (let i = 0; i < Math.min(bytes.length - 1, 1000); i++) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];

    // Shift_JIS: 0x81-0x9F, 0xE0-0xFC で始まる2バイト文字
    if (
      ((b1 >= 0x81 && b1 <= 0x9f) || (b1 >= 0xe0 && b1 <= 0xfc)) &&
      ((b2 >= 0x40 && b2 <= 0x7e) || (b2 >= 0x80 && b2 <= 0xfc))
    ) {
      shiftJisScore++;
    }

    // EUC-JP: 0xA1-0xFE で始まる2バイト文字
    if (b1 >= 0xa1 && b1 <= 0xfe && b2 >= 0xa1 && b2 <= 0xfe) {
      eucJpScore++;
    }
  }

  if (shiftJisScore > eucJpScore && shiftJisScore > 5) {
    return "shift_jis";
  }
  if (eucJpScore > shiftJisScore && eucJpScore > 5) {
    return "euc-jp";
  }

  return "utf-8";
}

/**
 * 文字列を指定したエンコーディングでエンコード
 * UTF-8/UTF-8 BOMはTextEncoder、Shift_JIS/EUC-JPはencoding-japaneseを使用
 */
export function encodeWithEncoding(
  text: string,
  encoding: EncodingType
): Uint8Array {
  if (encoding === "utf-8") {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  if (encoding === "utf-8-bom") {
    const encoder = new TextEncoder();
    const content = encoder.encode(text);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const result = new Uint8Array(bom.length + content.length);
    result.set(bom, 0);
    result.set(content, bom.length);
    return result;
  }

  if (encoding === "shift_jis") {
    // encoding-japaneseでShift_JISに変換
    const unicodeArray = Encoding.stringToCode(text);
    const sjisArray = Encoding.convert(unicodeArray, {
      to: "SJIS",
      from: "UNICODE",
    });
    return new Uint8Array(sjisArray);
  }

  if (encoding === "euc-jp") {
    // encoding-japaneseでEUC-JPに変換
    const unicodeArray = Encoding.stringToCode(text);
    const eucjpArray = Encoding.convert(unicodeArray, {
      to: "EUCJP",
      from: "UNICODE",
    });
    return new Uint8Array(eucjpArray);
  }

  // フォールバック: UTF-8
  const encoder = new TextEncoder();
  return encoder.encode(text);
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
  const headers = Array.from({ length: maxCols }, (_, i) => `${columnNamePrefix} ${i + 1}`);
  return {
    headers,
    rows: normalizedRows,
    hasHeader: false,
    columnTypes,
  };
}

/**
 * フィールドをCSV形式にエスケープ
 */
function escapeField(
  field: string,
  delimiter: string,
  quoteChar: '"' | "'",
  columnType: ColumnType = "auto",
  quoteStyle: QuoteStyle = "as-needed"
): string {
  // 数値型の場合、数値として解釈可能ならクォートなしで出力
  if (columnType === "number" && isNumeric(field)) {
    return field;
  }

  // クォートが必要かチェック
  const needsQuote =
    field.includes(quoteChar) ||
    field.includes(delimiter) ||
    field.includes("\n") ||
    field.includes("\r");

  // 文字列型の場合
  if (columnType === "string") {
    // 常にクォートするか、必要な時のみクォートするか
    if (quoteStyle === "always" || needsQuote) {
      const escaped = field.replace(
        new RegExp(quoteChar, "g"),
        quoteChar + quoteChar
      );
      return quoteChar + escaped + quoteChar;
    }
    return field;
  }

  // auto型の場合、必要に応じてクォート
  if (needsQuote) {
    // クォート文字をダブルにエスケープ
    const escaped = field.replace(
      new RegExp(quoteChar, "g"),
      quoteChar + quoteChar
    );
    return quoteChar + escaped + quoteChar;
  }

  return field;
}

/**
 * CsvDataをCSVテキストに変換
 */
export function stringifyCSV(
  data: CsvData,
  options: Partial<CsvOptions> = {}
): string {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
  const { delimiter, hasHeader, quoteChar, quoteStyle } = opts;

  const lines: string[] = [];

  // ヘッダー行を出力（ヘッダーは常に文字列型として扱う）
  if (hasHeader && data.headers.length > 0) {
    const headerLine = data.headers
      .map((h) => escapeField(h, delimiter, quoteChar, "string", quoteStyle))
      .join(delimiter);
    lines.push(headerLine);
  }

  // データ行を出力
  for (const row of data.rows) {
    const line = row
      .map((cell, colIndex) => {
        const columnType = data.columnTypes[colIndex] || "auto";
        return escapeField(cell, delimiter, quoteChar, columnType, quoteStyle);
      })
      .join(delimiter);
    lines.push(line);
  }

  return lines.join("\n");
}

// サポートする拡張子
export type FileExtension = ".csv" | ".tsv" | ".txt";

export const FILE_EXTENSION_LABELS: Record<FileExtension, string> = {
  ".csv": "CSV (.csv)",
  ".tsv": "TSV (.tsv)",
  ".txt": "Text (.txt)",
};

/**
 * エンコーディングに対応するcharset文字列を取得
 */
function getCharset(encoding: EncodingType): string {
  switch (encoding) {
    case "utf-8":
    case "utf-8-bom":
      return "utf-8";
    case "shift_jis":
      return "shift_jis";
    case "euc-jp":
      return "euc-jp";
    default:
      return "utf-8";
  }
}

/**
 * CSVデータをファイルとしてダウンロード
 */
export function downloadCSV(
  data: CsvData,
  filename: string,
  options: Partial<CsvOptions> = {},
  extension: FileExtension = ".csv"
): void {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
  const csvContent = stringifyCSV(data, opts);
  const charset = getCharset(opts.encoding);

  // MIMEタイプを拡張子とエンコーディングに応じて設定
  let mimeType = `text/csv;charset=${charset}`;
  if (extension === ".tsv") {
    mimeType = `text/tab-separated-values;charset=${charset}`;
  } else if (extension === ".txt") {
    mimeType = `text/plain;charset=${charset}`;
  }

  // エンコード
  const encoded = encodeWithEncoding(csvContent, opts.encoding);
  const blob = new Blob([encoded as BlobPart], {
    type: mimeType,
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // 拡張子がすでに付いている場合は除去してから追加
  const baseFilename = filename.replace(/\.(csv|tsv|txt)$/i, "");
  link.download = `${baseFilename}${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
  const headers = Array.from({ length: cols }, (_, i) => `${columnNamePrefix} ${i + 1}`);
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
  newHeaders.splice(colIndex, 0, `${columnNamePrefix} ${newHeaders.length + 1}`);

  const newRows = data.rows.map((row) => {
    const newRow = [...row];
    newRow.splice(colIndex, 0, "");
    return newRow;
  });

  const newColumnTypes = [...data.columnTypes];
  newColumnTypes.splice(colIndex, 0, columnType);

  return { ...data, headers: newHeaders, rows: newRows, columnTypes: newColumnTypes };
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

  return { ...data, headers: newHeaders, rows: newRows, columnTypes: newColumnTypes };
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
    if (row >= 0 && row < newRows.length && col >= 0 && col < newRows[row].length) {
      newRows[row][col] = value;
    }
  }

  return { ...data, headers: newHeaders, rows: newRows };
}

/**
 * クリップボード用（TSV形式）にフィールドをクォートする
 * タブ、改行、ダブルクォートを含む場合はダブルクォートで囲む
 */
export function quoteFieldForClipboard(value: string): string {
  if (value.includes("\t") || value.includes("\n") || value.includes('"')) {
    // ダブルクォートをエスケープ（" -> ""）してダブルクォートで囲む
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * クリップボードテキストを解析して更新配列を生成
 * ダブルクォートで囲まれたフィールド（改行を含む）に対応
 * @param text クリップボードのテキスト
 * @param startRow 開始行
 * @param startCol 開始列
 * @param maxRows 最大行数（-1で無制限、ヘッダー行は別カウント）
 * @param maxCols 最大列数
 */
export function parseClipboardText(
  text: string,
  startRow: number,
  startCol: number,
  maxRows: number,
  maxCols: number
): Array<{ row: number; col: number; value: string }> {
  // CRLF/CR を LF に正規化
  const normalizedText = text.replace(/\r\n?/g, "\n");

  // ダブルクォートを考慮してTSVをパース
  const rows = parseTsvWithQuotes(normalizedText);

  const updates: Array<{ row: number; col: number; value: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = startRow + i;
    // ヘッダー行（row === -1）は許可、データ行は範囲内のみ
    if (row !== -1 && maxRows !== -1 && row >= maxRows) break;

    const cells = rows[i];
    for (let j = 0; j < cells.length; j++) {
      const col = startCol + j;
      if (col >= maxCols) break;
      updates.push({ row, col, value: cells[j] });
    }
  }

  return updates;
}

/**
 * ダブルクォートを考慮してTSV形式のテキストをパース
 */
function parseTsvWithQuotes(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // 次の文字もダブルクォートならエスケープされたダブルクォート
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          // クォート終了
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        if (currentField === "") {
          // クォート開始（フィールド先頭のダブルクォートのみをクォート開始として扱う）
          inQuotes = true;
        } else {
          // フィールド中のダブルクォートはリテラルとして扱う
          currentField += '"';
        }
        i++;
      } else if (char === "\t") {
        // フィールド区切り
        currentRow.push(currentField);
        currentField = "";
        i++;
      } else if (char === "\n") {
        // 行区切り
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // 最後のフィールドと行を追加
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // 末尾の空行を除去
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }

  return rows;
}
