/**
 * CSVパーサーユーティリティ
 * RFC 4180準拠のCSV解析・生成機能を提供
 *
 * このファイルは後方互換性のためのre-exportファイルです。
 * 実際の実装は lib/utils/csv/ と lib/utils/encoding/ にあります。
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
} from "./csv";

export {
  ENCODING_LABELS,
  OUTPUT_ENCODING_LABELS,
  DEFAULT_CSV_OPTIONS,
  FILE_EXTENSION_LABELS,
} from "./csv";

// パーサー
export {
  isNumeric,
  detectColumnType,
  detectDelimiter,
  parseCSV,
} from "./csv";

// 文字列化
export { escapeField, stringifyCSV, downloadCSV } from "./csv";

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
} from "./csv";

// 選択範囲
export { normalizeSelection, isCellInSelection } from "./csv";

// エンコーディング
export { detectEncoding, decodeWithEncoding, encodeWithEncoding } from "./encoding";

// クリップボード
export {
  quoteFieldForClipboard,
  parseClipboardText,
} from "./clipboard";
