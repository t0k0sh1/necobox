/**
 * CSVユーティリティ
 */

// 型定義
export type {
  ColumnType,
  EncodingType,
  OutputEncodingType,
  CsvData,
  QuoteStyle,
  CsvOptions,
  CellPosition,
  SelectionRange,
  FileExtension,
} from "./types";

export {
  ENCODING_LABELS,
  OUTPUT_ENCODING_LABELS,
  DEFAULT_CSV_OPTIONS,
  FILE_EXTENSION_LABELS,
} from "./types";

// パーサー
export {
  isNumeric,
  detectColumnType,
  detectDelimiter,
  parseCSV,
} from "./parser";

// 文字列化
export { escapeField, stringifyCSV, downloadCSV } from "./stringify";

// 操作
export {
  createEmptyCsvData,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  updateCell,
  updateCells,
  updateColumnType,
  redetectColumnTypes,
} from "./operations";

// 選択範囲
export { normalizeSelection, isCellInSelection } from "./selection";
