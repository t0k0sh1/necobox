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
  RowSelectionRange,
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
  removeRows,
  addColumn,
  removeColumn,
  updateCell,
  updateCells,
  updateColumnType,
  redetectColumnTypes,
} from "./operations";

// 選択範囲
export { normalizeSelection, isCellInSelection } from "./selection";

// フィルター・ソート
export {
  applyFilters,
  applySort,
  computeDisplayIndices,
  toggleSort,
  displayToDataIndex,
  dataToDisplayIndex,
  INITIAL_SORT_STATE,
  NUMBER_FILTER_OPERATORS,
} from "./filter-sort";

export type {
  StringFilter,
  NumberFilter,
  ColumnFilter,
  FilterState,
  SortState,
  DisplayRowIndices,
} from "./filter-sort";
