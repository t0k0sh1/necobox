"use client";

import {
  addColumn,
  addRow,
  computeDisplayIndices,
  createEmptyCsvData,
  detectDelimiter,
  downloadCSV,
  INITIAL_SORT_STATE,
  normalizeSelection,
  parseCSV,
  redetectColumnTypes,
  removeColumn,
  removeRow,
  removeRows,
  toggleSort,
  updateCell,
  updateCells,
  updateColumnType,
  type CellPosition,
  type ColumnFilter,
  type ColumnType,
  type CsvData,
  type CsvOptions,
  type DisplayRowIndices,
  type EncodingType,
  type FileExtension,
  type FilterState,
  type OutputEncodingType,
  type QuoteStyle,
  type RowSelectionRange,
  type SelectionRange,
  type SortState,
} from "@/lib/utils/csv";
import { detectEncoding, decodeWithEncoding } from "@/lib/utils/encoding";
import { quoteFieldForClipboard, parseClipboardText } from "@/lib/utils/clipboard";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type DelimiterType = "," | "\t" | ";" | "|" | "custom";

interface TranslationFn {
  (key: string): string;
  (key: string, values: Record<string, string | number>): string;
}

export function useCsvEditor(t: TranslationFn) {
  // CSVデータの状態
  const [csvData, setCsvData] = useState<CsvData | null>(null);

  // オプション
  const [delimiter, setDelimiter] = useState<DelimiterType>(",");
  const [customDelimiter, setCustomDelimiter] = useState<string>("");
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);

  // エンコーディング
  const [inputEncoding, setInputEncoding] = useState<EncodingType | "auto">(
    "auto"
  );
  const [outputEncoding, setOutputEncoding] =
    useState<OutputEncodingType>("utf-8-bom");
  const [detectedEncoding, setDetectedEncoding] =
    useState<EncodingType>("utf-8");

  // エクスポート用のオプション
  const [exportFilename, setExportFilename] = useState<string>("data");
  const [filenamePrefix, setFilenamePrefix] = useState<string>("");
  const [filenameSuffix, setFilenameSuffix] = useState<string>("");
  const [exportWithHeader, setExportWithHeader] = useState<boolean>(true);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>("as-needed");
  const [fileExtension, setFileExtension] = useState<FileExtension>(".csv");

  // 編集状態
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionRange | null>(null);

  // フィルター・ソート状態
  const [filterState, setFilterState] = useState<FilterState>(new Map());
  const [sortState, setSortState] = useState<SortState>(INITIAL_SORT_STATE);

  // 単一セル選択のヘルパー（後方互換性のため）
  const selectedCell = selection ? selection.start : null;

  // 内部クリップボード（アプリ内でのコピー&ペースト用）
  const [internalClipboard, setInternalClipboard] = useState<string>("");

  // UI状態
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 実際の区切り文字を取得
  const getDelimiter = useCallback((): string => {
    if (delimiter === "custom") {
      return customDelimiter || ",";
    }
    return delimiter;
  }, [delimiter, customDelimiter]);

  // CSVテキストをパース
  const parseAndSetCsvData = useCallback(
    (text: string) => {
      try {
        let actualDelimiter = getDelimiter();

        // 自動検出が有効な場合
        if (autoDetect) {
          actualDelimiter = detectDelimiter(text);
          // 検出した区切り文字をUIに反映
          if (actualDelimiter === ",") setDelimiter(",");
          else if (actualDelimiter === "\t") setDelimiter("\t");
          else if (actualDelimiter === ";") setDelimiter(";");
          else if (actualDelimiter === "|") setDelimiter("|");
          else {
            setDelimiter("custom");
            setCustomDelimiter(actualDelimiter);
          }
        }

        const options: Partial<CsvOptions> = {
          delimiter: actualDelimiter,
          hasHeader,
          columnNamePrefix: t("table.defaultColumnName"),
        };

        const data = parseCSV(text, options);

        if (data.headers.length === 0 && data.rows.length === 0) {
          setError(t("error.emptyFile"));
          return;
        }

        setCsvData(data);
        setError(null);
        setSelection(null);
        setRowSelection(null);
        setEditingCell(null);
        // フィルター・ソートをリセット
        setFilterState(new Map());
        setSortState(INITIAL_SORT_STATE);
      } catch (err) {
        setError(t("error.parseError"));
        console.error("CSV parse error:", err);
      }
    },
    [getDelimiter, autoDetect, hasHeader, t]
  );

  // ファイル選択処理（ArrayBufferで読み込んでエンコーディング処理）
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];

      // ファイル名からエクスポート用のファイル名を設定
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setExportFilename(nameWithoutExt);

      try {
        const buffer = await file.arrayBuffer();

        // エンコーディングを決定
        let encoding: EncodingType;
        if (inputEncoding === "auto") {
          encoding = detectEncoding(buffer);
          setDetectedEncoding(encoding);
        } else {
          encoding = inputEncoding;
        }
        // 入力エンコーディングを出力エンコーディングにも自動設定
        setOutputEncoding(encoding);

        // デコード
        const text = decodeWithEncoding(buffer, encoding);
        parseAndSetCsvData(text);
      } catch (err) {
        setError(t("error.invalidFile"));
        console.error("File read error:", err);
      }
    },
    [parseAndSetCsvData, inputEncoding, t]
  );

  // ファイル入力変更ハンドラ
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // テキスト貼り付け処理
  const handlePaste = useCallback(() => {
    const text = textareaRef.current?.value;
    if (text && text.trim()) {
      parseAndSetCsvData(text);
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
    }
  }, [parseAndSetCsvData]);

  // 新規作成
  const handleNew = useCallback(() => {
    const newData = createEmptyCsvData(3, 1, hasHeader, t("table.defaultColumnName"));
    setCsvData(newData);
    setSelection(null);
    setRowSelection(null);
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
    // フィルター・ソートをリセット
    setFilterState(new Map());
    setSortState(INITIAL_SORT_STATE);
  }, [hasHeader, t]);

  // クリア
  const handleClear = useCallback(() => {
    setCsvData(null);
    setSelection(null);
    setRowSelection(null);
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
    // フィルター・ソートをリセット
    setFilterState(new Map());
    setSortState(INITIAL_SORT_STATE);
  }, []);

  // データのみクリア（スキーマ維持）
  const handleClearDataOnly = useCallback(() => {
    if (!csvData) return;
    // ヘッダーと列の型を維持して、行データだけをクリア
    setCsvData({
      ...csvData,
      rows: [],
    });
    setSelection(null);
    setRowSelection(null);
    setEditingCell(null);
    setError(null);
  }, [csvData]);

  // セル編集開始
  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
    setSelection({ start: { row, col }, end: { row, col } });
  }, []);

  // セル編集終了
  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // セル選択（単一セル）
  const handleSelectCell = useCallback((row: number, col: number) => {
    setSelection({ start: { row, col }, end: { row, col } });
    setRowSelection(null); // 行選択をクリア
    setEditingCell(null);
  }, []);

  // 選択範囲の拡張（Shift+クリック/矢印キー）
  const handleExtendSelection = useCallback((row: number, col: number) => {
    setSelection((prev) => {
      if (!prev) return { start: { row, col }, end: { row, col } };
      return { ...prev, end: { row, col } };
    });
    setRowSelection(null); // 行選択をクリア
    setEditingCell(null);
  }, []);

  // 行選択（単一行）
  const handleSelectRow = useCallback((row: number) => {
    setRowSelection({ startRow: row, endRow: row });
    setSelection(null); // セル選択をクリア
    setEditingCell(null);
  }, []);

  // 行選択範囲の拡張（Shift+クリック/ドラッグ）
  const handleExtendRowSelection = useCallback((row: number) => {
    setRowSelection((prev) => {
      if (!prev) return { startRow: row, endRow: row };
      return { ...prev, endRow: row };
    });
    setSelection(null); // セル選択をクリア
    setEditingCell(null);
  }, []);

  // セル値変更
  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (!csvData) return;
      const newData = updateCell(csvData, row, col, value);
      setCsvData(newData);
    },
    [csvData]
  );

  // 列のデータ型を変更
  const handleColumnTypeChange = useCallback(
    (col: number, columnType: ColumnType) => {
      if (!csvData) return;
      const newData = updateColumnType(csvData, col, columnType);
      setCsvData(newData);
    },
    [csvData]
  );

  // 列のデータ型を再検出
  const handleRedetectTypes = useCallback(() => {
    if (!csvData) return;
    const newData = redetectColumnTypes(csvData);
    setCsvData(newData);
  }, [csvData]);

  // セル値を取得
  const getCellValue = useCallback(
    (row: number, col: number): string => {
      if (!csvData) return "";
      if (row === -1) {
        return csvData.headers[col] || "";
      }
      return csvData.rows[row]?.[col] || "";
    },
    [csvData]
  );

  // 選択中のセルにフォーカスを戻す
  const refocusSelectedCell = useCallback(() => {
    if (selectedCell && tableContainerRef.current) {
      const cell = tableContainerRef.current.querySelector(
        `[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`
      ) as HTMLElement | null;
      if (cell) {
        cell.focus();
      }
    }
  }, [selectedCell]);

  // クリップボードにテキストをコピー（システムクリップボード + 内部クリップボード）
  const copyToClipboard = useCallback((text: string) => {
    // 内部クリップボードには必ず保存
    setInternalClipboard(text);

    // システムクリップボードにもコピーを試みる（失敗しても内部クリップボードがある）
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).catch(() => {
        // 失敗しても内部クリップボードがあるので問題なし
      });
    } else {
      // フォールバック: execCommand を使用
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // 失敗しても内部クリップボードがあるので問題なし
      }
    }

    // フォーカスを選択中のセルに戻す
    requestAnimationFrame(() => {
      refocusSelectedCell();
    });
  }, [refocusSelectedCell]);

  // コピー処理（複数セル対応）
  const handleCopy = useCallback(() => {
    if (!selection || !csvData) return;
    const norm = normalizeSelection(selection);
    const lines: string[] = [];

    for (let row = norm.start.row; row <= norm.end.row; row++) {
      const cells: string[] = [];
      for (let col = norm.start.col; col <= norm.end.col; col++) {
        // 改行やタブを含むセルはダブルクォートで囲む
        cells.push(quoteFieldForClipboard(getCellValue(row, col)));
      }
      lines.push(cells.join("\t"));
    }

    copyToClipboard(lines.join("\n"));
  }, [selection, csvData, getCellValue, copyToClipboard]);

  // 切り取り処理（複数セル対応）
  const handleCut = useCallback(() => {
    if (!selection || !csvData) return;
    const norm = normalizeSelection(selection);
    const lines: string[] = [];
    const updates: Array<{ row: number; col: number; value: string }> = [];

    for (let row = norm.start.row; row <= norm.end.row; row++) {
      const cells: string[] = [];
      for (let col = norm.start.col; col <= norm.end.col; col++) {
        // 改行やタブを含むセルはダブルクォートで囲む
        cells.push(quoteFieldForClipboard(getCellValue(row, col)));
        updates.push({ row, col, value: "" });
      }
      lines.push(cells.join("\t"));
    }

    copyToClipboard(lines.join("\n"));
    setCsvData(updateCells(csvData, updates));
  }, [selection, csvData, getCellValue, copyToClipboard]);

  // ペースト処理（複数セル対応、内部クリップボードを使用）
  const handlePasteCell = useCallback(() => {
    if (!selection || !csvData || !internalClipboard) return;
    const norm = normalizeSelection(selection);

    const updates = parseClipboardText(
      internalClipboard,
      norm.start.row,
      norm.start.col,
      csvData.rows.length,
      csvData.headers.length
    );

    if (updates.length > 0) {
      setCsvData(updateCells(csvData, updates));
    }
    // フォーカスを維持
    requestAnimationFrame(() => {
      refocusSelectedCell();
    });
  }, [selection, csvData, internalClipboard, refocusSelectedCell]);

  // Ctrl+D: 下方向に複製（Excel準拠）
  // - 単一セル選択時: 上のセルの値を選択中のセルにコピー
  // - 複数セル選択時: 最上行の値を下の行すべてにコピー
  const handleFillDown = useCallback(() => {
    if (!selection || !csvData) return;
    const norm = normalizeSelection(selection);
    const updates: Array<{ row: number; col: number; value: string }> = [];

    const isSingleCell = norm.start.row === norm.end.row && norm.start.col === norm.end.col;

    if (isSingleCell) {
      // 単一セル選択: 上のセルからコピー
      const sourceRow = norm.start.row - 1;
      // ヘッダー行(-1)の上や、データの最初の行(0)で上がヘッダー(-1)の場合も許可
      if (sourceRow >= -1) {
        for (let col = norm.start.col; col <= norm.end.col; col++) {
          const sourceValue = getCellValue(sourceRow, col);
          updates.push({ row: norm.start.row, col, value: sourceValue });
        }
      }
    } else {
      // 複数セル選択: 最上行の値を下の行にコピー
      for (let col = norm.start.col; col <= norm.end.col; col++) {
        const sourceValue = getCellValue(norm.start.row, col);
        for (let row = norm.start.row + 1; row <= norm.end.row; row++) {
          updates.push({ row, col, value: sourceValue });
        }
      }
    }

    if (updates.length > 0) {
      setCsvData(updateCells(csvData, updates));
    }
  }, [selection, csvData, getCellValue]);

  // Ctrl+R: 右方向に複製（Excel準拠）
  // - 単一セル選択時: 左のセルの値を選択中のセルにコピー
  // - 複数セル選択時: 最左列の値を右の列すべてにコピー
  const handleFillRight = useCallback(() => {
    if (!selection || !csvData) return;
    const norm = normalizeSelection(selection);
    const updates: Array<{ row: number; col: number; value: string }> = [];

    const isSingleCell = norm.start.row === norm.end.row && norm.start.col === norm.end.col;

    if (isSingleCell) {
      // 単一セル選択: 左のセルからコピー
      const sourceCol = norm.start.col - 1;
      if (sourceCol >= 0) {
        for (let row = norm.start.row; row <= norm.end.row; row++) {
          const sourceValue = getCellValue(row, sourceCol);
          updates.push({ row, col: norm.start.col, value: sourceValue });
        }
      }
    } else {
      // 複数セル選択: 最左列の値を右の列にコピー
      for (let row = norm.start.row; row <= norm.end.row; row++) {
        const sourceValue = getCellValue(row, norm.start.col);
        for (let col = norm.start.col + 1; col <= norm.end.col; col++) {
          updates.push({ row, col, value: sourceValue });
        }
      }
    }

    if (updates.length > 0) {
      setCsvData(updateCells(csvData, updates));
    }
  }, [selection, csvData, getCellValue]);

  // 選択範囲の削除
  const handleDeleteSelection = useCallback(() => {
    if (!selection || !csvData) return;
    const norm = normalizeSelection(selection);
    const updates: Array<{ row: number; col: number; value: string }> = [];

    for (let row = norm.start.row; row <= norm.end.row; row++) {
      for (let col = norm.start.col; col <= norm.end.col; col++) {
        updates.push({ row, col, value: "" });
      }
    }

    if (updates.length > 0) {
      setCsvData(updateCells(csvData, updates));
    }
  }, [selection, csvData]);

  // ネイティブペーストイベントのハンドラ（外部からのペースト対応）
  const handleNativePaste = useCallback(
    (e: ClipboardEvent) => {
      // 編集中でなく、セルが選択されている場合のみ処理
      if (editingCell || !selection || !csvData) return;

      // テーブルコンテナ内でのみ処理
      if (!tableContainerRef.current?.contains(document.activeElement)) return;

      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        // 内部クリップボードを更新
        setInternalClipboard(text);

        // ペースト処理（共有ヘルパーを使用）
        const norm = normalizeSelection(selection);
        const updates = parseClipboardText(
          text,
          norm.start.row,
          norm.start.col,
          csvData.rows.length,
          csvData.headers.length
        );

        if (updates.length > 0) {
          setCsvData(updateCells(csvData, updates));
        }

        // フォーカスを維持
        requestAnimationFrame(() => {
          refocusSelectedCell();
        });
      }
    },
    [editingCell, selection, csvData, refocusSelectedCell]
  );

  // ペーストイベントのリスナー登録
  useEffect(() => {
    document.addEventListener("paste", handleNativePaste);
    return () => {
      document.removeEventListener("paste", handleNativePaste);
    };
  }, [handleNativePaste]);

  // displayRowIndices を計算（フィルター・ソート適用後）
  const displayRowIndices: DisplayRowIndices = useMemo(() => {
    if (!csvData) return [];
    return computeDisplayIndices(csvData, filterState, sortState);
  }, [csvData, filterState, sortState]);

  // キーボードナビゲーション
  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (!csvData) return;

      const maxCol = csvData.headers.length - 1;
      // Mac検出: userAgentData（新API）を優先し、フォールバックとしてuserAgentを使用
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = nav.userAgentData?.platform || nav.userAgent || "";
      const isMac = /mac/i.test(platform);
      const isModifierKey = isMac ? e.metaKey : e.ctrlKey;

      // 表示行インデックスベースのナビゲーション用ヘルパー
      const getDisplayIndex = (dataRow: number): number => {
        if (dataRow === -1) return -1; // ヘッダー行
        return displayRowIndices.indexOf(dataRow);
      };
      const getDataIndex = (displayIdx: number): number => {
        if (displayIdx === -1) return -1; // ヘッダー行
        return displayRowIndices[displayIdx] ?? -1;
      };
      const maxDisplayRow = displayRowIndices.length - 1;

      // Ctrl+D: 下方向に複製
      if (isModifierKey && (e.key === "d" || e.key === "D") && !editingCell) {
        e.preventDefault();
        handleFillDown();
        return;
      }

      // Ctrl+R: 右方向に複製
      if (isModifierKey && (e.key === "r" || e.key === "R") && !editingCell) {
        e.preventDefault();
        handleFillRight();
        return;
      }

      // コピー・切り取り・ペースト
      if (isModifierKey && !editingCell) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          handleCopy();
          return;
        }
        if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          handleCut();
          return;
        }
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          handlePasteCell();
          return;
        }
      }

      // Shift+矢印キーの場合は選択範囲の終点を基準にする
      const endRow = selection?.end.row ?? row;
      const endCol = selection?.end.col ?? col;

      // 表示インデックスを取得
      const currentDisplayRow = getDisplayIndex(row);
      const endDisplayRow = getDisplayIndex(endRow);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+矢印: 選択範囲を拡張（終点を基準）
            if (endRow === -1) {
              // ヘッダー行からは上に行けない
            } else if (endDisplayRow > 0) {
              const prevDataRow = getDataIndex(endDisplayRow - 1);
              if (prevDataRow !== -1) {
                handleExtendSelection(prevDataRow, endCol);
              }
            } else if (endDisplayRow === 0) {
              // 最初の表示行からヘッダーへ
              handleExtendSelection(-1, endCol);
            }
          } else {
            if (row === -1) {
              // ヘッダー行からは上に行けない
            } else if (currentDisplayRow > 0) {
              const prevDataRow = getDataIndex(currentDisplayRow - 1);
              if (prevDataRow !== -1) {
                handleSelectCell(prevDataRow, col);
              }
            } else if (currentDisplayRow === 0) {
              // 最初の表示行からヘッダーへ
              handleSelectCell(-1, col);
            }
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (e.shiftKey) {
            if (endRow === -1) {
              // ヘッダー行から最初の表示行へ
              if (displayRowIndices.length > 0) {
                handleExtendSelection(displayRowIndices[0], endCol);
              }
            } else if (endDisplayRow < maxDisplayRow) {
              const nextDataRow = getDataIndex(endDisplayRow + 1);
              if (nextDataRow !== -1) {
                handleExtendSelection(nextDataRow, endCol);
              }
            }
          } else {
            if (row === -1) {
              // ヘッダー行から最初の表示行へ
              if (displayRowIndices.length > 0) {
                handleSelectCell(displayRowIndices[0], col);
              }
            } else if (currentDisplayRow < maxDisplayRow) {
              const nextDataRow = getDataIndex(currentDisplayRow + 1);
              if (nextDataRow !== -1) {
                handleSelectCell(nextDataRow, col);
              }
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            if (endCol > 0) {
              handleExtendSelection(endRow, endCol - 1);
            }
          } else {
            if (col > 0) {
              handleSelectCell(row, col - 1);
            }
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            if (endCol < maxCol) {
              handleExtendSelection(endRow, endCol + 1);
            }
          } else {
            if (col < maxCol) {
              handleSelectCell(row, col + 1);
            }
          }
          break;
        case "Enter":
          e.preventDefault();
          setEditingCell({ row, col });
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            // 前のセルへ
            if (col > 0) {
              handleSelectCell(row, col - 1);
            } else if (row === -1) {
              // ヘッダー行の最初の列: 何もしない
            } else if (currentDisplayRow > 0) {
              const prevDataRow = getDataIndex(currentDisplayRow - 1);
              if (prevDataRow !== -1) {
                handleSelectCell(prevDataRow, maxCol);
              }
            } else if (currentDisplayRow === 0) {
              // 最初の表示行からヘッダーへ
              handleSelectCell(-1, maxCol);
            }
          } else {
            // 次のセルへ
            if (col < maxCol) {
              handleSelectCell(row, col + 1);
            } else if (row === -1) {
              // ヘッダー行の最後の列から最初の表示行へ
              if (displayRowIndices.length > 0) {
                handleSelectCell(displayRowIndices[0], 0);
              }
            } else if (currentDisplayRow < maxDisplayRow) {
              const nextDataRow = getDataIndex(currentDisplayRow + 1);
              if (nextDataRow !== -1) {
                handleSelectCell(nextDataRow, 0);
              }
            }
          }
          break;
        case "Delete":
        case "Backspace":
          if (!editingCell) {
            e.preventDefault();
            handleDeleteSelection();
          }
          break;
        default:
          // 文字入力で編集開始
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setEditingCell({ row, col });
          }
          break;
      }
    },
    [csvData, editingCell, selection, displayRowIndices, handleCopy, handleCut, handlePasteCell, handleFillDown, handleFillRight, handleDeleteSelection, handleSelectCell, handleExtendSelection]
  );

  // フィルター変更ハンドラ
  const handleFilterChange = useCallback(
    (columnIndex: number, filter: ColumnFilter | null) => {
      setFilterState((prev) => {
        const next = new Map(prev);
        if (filter === null) {
          next.delete(columnIndex);
        } else {
          next.set(columnIndex, filter);
        }
        return next;
      });
    },
    []
  );

  // ソートハンドラ
  const handleSort = useCallback(
    (columnIndex: number) => {
      setSortState((prev) => toggleSort(prev, columnIndex));
    },
    []
  );

  // すべてのフィルターをクリア
  const handleClearAllFilters = useCallback(() => {
    setFilterState(new Map());
  }, []);

  // 行を追加
  const handleAddRow = useCallback(() => {
    if (!csvData) return;
    const newData = addRow(csvData);
    setCsvData(newData);
  }, [csvData]);

  // 行を削除（行選択がある場合は複数行削除）
  const handleDeleteRow = useCallback(() => {
    if (!csvData) return;

    // 行選択がある場合は複数行削除
    if (rowSelection) {
      const minRow = Math.min(rowSelection.startRow, rowSelection.endRow);
      const maxRow = Math.max(rowSelection.startRow, rowSelection.endRow);
      const indicesToDelete: number[] = [];
      for (let i = minRow; i <= maxRow; i++) {
        indicesToDelete.push(i);
      }
      const newData = removeRows(csvData, indicesToDelete);
      setCsvData(newData);
      // 行選択をクリアし、削除後の位置にセル選択を設定
      setRowSelection(null);
      if (newData.rows.length > 0) {
        const newRow = Math.min(minRow, newData.rows.length - 1);
        setSelection({
          start: { row: newRow, col: 0 },
          end: { row: newRow, col: 0 },
        });
      } else {
        setSelection(null);
      }
      return;
    }

    // セル選択がある場合は単一行削除
    if (!selectedCell || selectedCell.row < 0) return;
    const newData = removeRow(csvData, selectedCell.row);
    setCsvData(newData);
    // 選択セルを調整
    if (selectedCell.row >= newData.rows.length) {
      const newRow = Math.max(-1, newData.rows.length - 1);
      setSelection({
        start: { row: newRow, col: selectedCell.col },
        end: { row: newRow, col: selectedCell.col },
      });
    }
  }, [csvData, selectedCell, rowSelection]);

  // 列を追加
  const handleAddColumn = useCallback(() => {
    if (!csvData) return;
    const newData = addColumn(csvData, undefined, "auto", t("table.defaultColumnName"));
    setCsvData(newData);
  }, [csvData, t]);

  // 列を削除
  const handleDeleteColumn = useCallback(() => {
    if (!csvData || !selectedCell || csvData.headers.length <= 1) return;
    const deletedCol = selectedCell.col;
    const newData = removeColumn(csvData, deletedCol);
    setCsvData(newData);
    // 選択セルを調整
    if (selectedCell.col >= newData.headers.length) {
      const newCol = Math.max(0, newData.headers.length - 1);
      setSelection({
        start: { row: selectedCell.row, col: newCol },
        end: { row: selectedCell.row, col: newCol },
      });
    }
    // フィルター・ソート状態を更新（削除された列より後のインデックスをシフト）
    setFilterState((prev) => {
      const next = new Map<number, ColumnFilter>();
      for (const [colIndex, filter] of prev) {
        if (colIndex < deletedCol) {
          next.set(colIndex, filter);
        } else if (colIndex > deletedCol) {
          next.set(colIndex - 1, filter);
        }
        // colIndex === deletedCol の場合はフィルターを削除
      }
      return next;
    });
    // ソート状態を更新
    setSortState((prev) => {
      if (prev.columnIndex === null) return prev;
      if (prev.columnIndex === deletedCol) {
        return INITIAL_SORT_STATE;
      } else if (prev.columnIndex > deletedCol) {
        return { ...prev, columnIndex: prev.columnIndex - 1 };
      }
      return prev;
    });
  }, [csvData, selectedCell]);

  // CSVダウンロード
  const handleDownload = useCallback(() => {
    if (!csvData) return;

    const options: Partial<CsvOptions> = {
      delimiter: getDelimiter(),
      hasHeader: exportWithHeader,
      encoding: outputEncoding,
      quoteStyle,
    };

    // プレフィックス・サフィックスを含めた最終ファイル名を生成
    // ファイルシステムで無効な文字をサニタイズ
    const sanitizeFilename = (name: string): string => {
      // Windows/Mac/Linuxで無効な文字を除去: / \ : * ? " < > |
      return name.replace(/[/\\:*?"<>|]/g, "");
    };
    const finalFilename = sanitizeFilename(`${filenamePrefix}${exportFilename}${filenameSuffix}`);
    downloadCSV(csvData, finalFilename, options, fileExtension);
  }, [csvData, exportFilename, filenamePrefix, filenameSuffix, getDelimiter, outputEncoding, exportWithHeader, quoteStyle, fileExtension]);

  // オプション変更時にデータを再パース
  const handleDelimiterChange = useCallback((value: DelimiterType) => {
    setDelimiter(value);
    setAutoDetect(false);
  }, []);

  const handleHasHeaderChange = useCallback(
    (checked: boolean) => {
      setHasHeader(checked);
      // データがある場合は再パース
      if (csvData) {
        // ヘッダー設定の変更を反映
        if (checked && !csvData.hasHeader) {
          // ヘッダーなし -> ヘッダーあり: 最初の行をヘッダーに
          if (csvData.rows.length > 0) {
            setCsvData({
              ...csvData,
              headers: csvData.rows[0],
              rows: csvData.rows.slice(1),
              hasHeader: true,
            });
          }
        } else if (!checked && csvData.hasHeader) {
          // ヘッダーあり -> ヘッダーなし: ヘッダーを最初の行に
          const columnPrefix = t("table.defaultColumnName");
          const newHeaders = Array.from(
            { length: csvData.headers.length },
            (_, i) => `${columnPrefix} ${i + 1}`
          );
          setCsvData({
            ...csvData,
            headers: newHeaders,
            rows: [csvData.headers, ...csvData.rows],
            hasHeader: false,
          });
        }
      }
    },
    [csvData, t]
  );

  return {
    // CSVデータ
    csvData,

    // パースオプション
    delimiter,
    customDelimiter,
    setCustomDelimiter,
    hasHeader,
    autoDetect,
    setAutoDetect,

    // エンコーディング
    inputEncoding,
    setInputEncoding,
    outputEncoding,
    setOutputEncoding,
    detectedEncoding,

    // エクスポート設定
    exportFilename,
    setExportFilename,
    filenamePrefix,
    setFilenamePrefix,
    filenameSuffix,
    setFilenameSuffix,
    exportWithHeader,
    setExportWithHeader,
    quoteStyle,
    setQuoteStyle,
    fileExtension,
    setFileExtension,

    // 編集状態
    editingCell,
    selection,
    rowSelection,
    selectedCell,

    // フィルター・ソート
    filterState,
    sortState,
    displayRowIndices,

    // UI状態
    isDragging,
    error,
    showKeyboardHelp,
    setShowKeyboardHelp,

    // Refs
    fileInputRef,
    textareaRef,
    tableContainerRef,

    // ハンドラ
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    handleNew,
    handleClear,
    handleClearDataOnly,
    handleStartEdit,
    handleEndEdit,
    handleSelectCell,
    handleExtendSelection,
    handleSelectRow,
    handleExtendRowSelection,
    handleCellChange,
    handleColumnTypeChange,
    handleRedetectTypes,
    handleKeyNavigation,
    handleFilterChange,
    handleSort,
    handleClearAllFilters,
    handleAddRow,
    handleDeleteRow,
    handleAddColumn,
    handleDeleteColumn,
    handleDownload,
    handleDelimiterChange,
    handleHasHeaderChange,
  };
}
