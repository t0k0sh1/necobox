/**
 * CSV関連の型定義
 */

// 列のデータ型
export type ColumnType = "auto" | "string" | "number";

// サポートするエンコーディング（入力用：自動検出対応）
export type EncodingType = "utf-8" | "utf-8-bom" | "shift_jis" | "euc-jp";

// 出力用エンコーディング（入力用と同一）
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
  start: CellPosition; // アンカーポイント（選択開始点）
  end: CellPosition; // 選択終了点
}

// 行選択の範囲
export interface RowSelectionRange {
  startRow: number; // アンカー行（選択開始点）
  endRow: number; // フォーカス行（選択終了点）
}

export const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ",",
  hasHeader: true,
  quoteChar: '"',
  encoding: "utf-8",
  quoteStyle: "as-needed",
  columnNamePrefix: "Column",
};

// サポートする拡張子
export type FileExtension = ".csv" | ".tsv" | ".txt";

export const FILE_EXTENSION_LABELS: Record<FileExtension, string> = {
  ".csv": "CSV (.csv)",
  ".tsv": "TSV (.tsv)",
  ".txt": "Text (.txt)",
};
