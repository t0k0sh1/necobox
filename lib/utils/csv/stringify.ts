/**
 * CSV文字列化ユーティリティ
 */

import { encodeWithEncoding } from "../encoding";

import { isNumeric } from "./parser";
import type {
  ColumnType,
  CsvData,
  CsvOptions,
  EncodingType,
  FileExtension,
  QuoteStyle,
} from "./types";
import { DEFAULT_CSV_OPTIONS } from "./types";

/**
 * フィールドをCSV形式にエスケープ
 */
export function escapeField(
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
