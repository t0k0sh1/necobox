"use client";

import { CsvTable } from "@/app/components/CsvTable";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  addColumn,
  addRow,
  createEmptyCsvData,
  decodeWithEncoding,
  detectDelimiter,
  detectEncoding,
  downloadCSV,
  ENCODING_LABELS,
  FILE_EXTENSION_LABELS,
  normalizeSelection,
  OUTPUT_ENCODING_LABELS,
  parseClipboardText,
  parseCSV,
  redetectColumnTypes,
  removeColumn,
  removeRow,
  updateCell,
  updateCells,
  updateColumnType,
  type CellPosition,
  type ColumnType,
  type CsvData,
  type CsvOptions,
  type EncodingType,
  type FileExtension,
  type OutputEncodingType,
  type QuoteStyle,
  type SelectionRange,
} from "@/lib/utils/csv-parser";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Keyboard,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";

type DelimiterType = "," | "\t" | ";" | "|" | "custom";

export default function CsvEditorPage() {
  const t = useTranslations("csvEditor");
  const tCommon = useTranslations("common");

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
        setEditingCell(null);
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
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
  }, [hasHeader, t]);

  // クリア
  const handleClear = useCallback(() => {
    setCsvData(null);
    setSelection(null);
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
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
    setEditingCell(null);
  }, []);

  // 選択範囲の拡張（Shift+クリック/矢印キー）
  const handleExtendSelection = useCallback((row: number, col: number) => {
    setSelection((prev) => {
      if (!prev) return { start: { row, col }, end: { row, col } };
      return { ...prev, end: { row, col } };
    });
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
        cells.push(getCellValue(row, col));
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
        cells.push(getCellValue(row, col));
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

  // キーボードナビゲーション
  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (!csvData) return;

      const maxRow = csvData.rows.length - 1;
      const maxCol = csvData.headers.length - 1;
      // Mac検出: userAgentData（新API）を優先し、フォールバックとしてuserAgentを使用
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = nav.userAgentData?.platform || nav.userAgent || "";
      const isMac = /mac/i.test(platform);
      const isModifierKey = isMac ? e.metaKey : e.ctrlKey;

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

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+矢印: 選択範囲を拡張（終点を基準）
            if (endRow > -1) {
              handleExtendSelection(endRow - 1, endCol);
            }
          } else {
            if (row > -1) {
              handleSelectCell(row - 1, col);
            }
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (e.shiftKey) {
            if (endRow < maxRow) {
              handleExtendSelection(endRow + 1, endCol);
            }
          } else {
            if (row < maxRow) {
              handleSelectCell(row + 1, col);
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
            } else if (row > -1) {
              handleSelectCell(row - 1, maxCol);
            }
          } else {
            // 次のセルへ
            if (col < maxCol) {
              handleSelectCell(row, col + 1);
            } else if (row < maxRow) {
              handleSelectCell(row + 1, 0);
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
    [csvData, editingCell, selection, handleCopy, handleCut, handlePasteCell, handleFillDown, handleFillRight, handleDeleteSelection, handleSelectCell, handleExtendSelection]
  );

  // 行を追加
  const handleAddRow = useCallback(() => {
    if (!csvData) return;
    const newData = addRow(csvData);
    setCsvData(newData);
  }, [csvData]);

  // 行を削除
  const handleDeleteRow = useCallback(() => {
    if (!csvData || !selectedCell || selectedCell.row < 0) return;
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
  }, [csvData, selectedCell]);

  // 列を追加
  const handleAddColumn = useCallback(() => {
    if (!csvData) return;
    const newData = addColumn(csvData, undefined, "auto", t("table.defaultColumnName"));
    setCsvData(newData);
  }, [csvData, t]);

  // 列を削除
  const handleDeleteColumn = useCallback(() => {
    if (!csvData || !selectedCell || csvData.headers.length <= 1) return;
    const newData = removeColumn(csvData, selectedCell.col);
    setCsvData(newData);
    // 選択セルを調整
    if (selectedCell.col >= newData.headers.length) {
      const newCol = Math.max(0, newData.headers.length - 1);
      setSelection({
        start: { row: selectedCell.row, col: newCol },
        end: { row: selectedCell.row, col: newCol },
      });
    }
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

  return (
    <TooltipProvider>
      <div className="flex h-full items-start justify-center py-4 px-4">
        <div className="w-full max-w-6xl">
          <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
            {/* タイトル */}
            <div className="text-center">
              <h1 className="text-3xl font-semibold">{t("title")}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("description")}
              </p>
            </div>

            {/* アップロードエリア（データがない場合） */}
            {!csvData && (
              <div className="space-y-4">
                {/* 入力エンコーディング選択 */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm whitespace-nowrap">
                    {t("options.encodingInput")}:
                  </Label>
                  <Select
                    value={inputEncoding}
                    onValueChange={(v) =>
                      setInputEncoding(v as EncodingType | "auto")
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {t("options.encodingAutoDetect")}
                      </SelectItem>
                      {(
                        Object.entries(ENCODING_LABELS) as [
                          EncodingType,
                          string,
                        ][]
                      ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ファイルアップロード */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    {t("upload.title")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("upload.description")}
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {t("upload.selectFile")}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileInputChange}
                      className="hidden"
                      aria-label={t("upload.selectFile")}
                    />
                    <p className="text-xs text-gray-500">
                      {t("upload.dragDrop")}
                    </p>
                  </div>
                </div>

                {/* テキスト貼り付け */}
                <div className="space-y-2">
                  <Label>{t("upload.pasteData")}</Label>
                  <textarea
                    ref={textareaRef}
                    className="w-full h-32 px-3 py-2 border rounded-md bg-transparent text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("upload.pastePlaceholder")}
                  />
                  <Button variant="outline" onClick={handlePaste}>
                    {tCommon("convert")}
                  </Button>
                </div>

                {/* 新規作成ボタン */}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("toolbar.new")}
                  </Button>
                </div>
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* オプション（データがある場合） */}
            {csvData && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* 区切り文字選択 */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      {t("options.delimiter")}:
                    </Label>
                    <Select
                      value={delimiter}
                      onValueChange={(v) =>
                        handleDelimiterChange(v as DelimiterType)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">
                          {t("options.delimiterComma")}
                        </SelectItem>
                        <SelectItem value={"\t"}>
                          {t("options.delimiterTab")}
                        </SelectItem>
                        <SelectItem value=";">
                          {t("options.delimiterSemicolon")}
                        </SelectItem>
                        <SelectItem value="|">
                          {t("options.delimiterPipe")}
                        </SelectItem>
                        <SelectItem value="custom">
                          {t("options.delimiterCustom")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* カスタム区切り文字入力 */}
                  {delimiter === "custom" && (
                    <Input
                      type="text"
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      className="w-16"
                      maxLength={1}
                    />
                  )}

                  {/* ヘッダー有無 */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasHeader"
                      checked={hasHeader}
                      onCheckedChange={(checked) =>
                        handleHasHeaderChange(checked === true)
                      }
                    />
                    <Label
                      htmlFor="hasHeader"
                      className="text-sm cursor-pointer"
                    >
                      {t("options.hasHeader")}
                    </Label>
                  </div>

                  {/* 自動検出 */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoDetect"
                      checked={autoDetect}
                      onCheckedChange={(checked) =>
                        setAutoDetect(checked === true)
                      }
                    />
                    <Label
                      htmlFor="autoDetect"
                      className="text-sm cursor-pointer"
                    >
                      {t("options.autoDetect")}
                    </Label>
                  </div>

                  {/* キーボードヘルプ */}
                  <Tooltip
                    open={showKeyboardHelp}
                    onOpenChange={setShowKeyboardHelp}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                      >
                        <Keyboard className="w-4 h-4 mr-1" />
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">{t("keyboard.title")}</p>
                        <p>{t("keyboard.arrows")}</p>
                        <p>{t("keyboard.shiftArrows")}</p>
                        <p>{t("keyboard.enter")}</p>
                        <p>{t("keyboard.tab")}</p>
                        <p>{t("keyboard.shiftTab")}</p>
                        <p>{t("keyboard.escape")}</p>
                        <p>{t("keyboard.copy")}</p>
                        <p>{t("keyboard.cut")}</p>
                        <p>{t("keyboard.paste")}</p>
                        <p>{t("keyboard.fillDown")}</p>
                        <p>{t("keyboard.fillRight")}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex-1" />

                  {/* クリア（アップロード画面に戻る） */}
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("toolbar.clear")}
                  </Button>
                </div>

                {/* 検出されたエンコーディングの表示 */}
                {inputEncoding === "auto" && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t("options.encoding")}:{" "}
                    {ENCODING_LABELS[detectedEncoding]} (
                    {t("options.encodingAutoDetect")})
                  </div>
                )}
              </div>
            )}

            {/* ツールバー（データがある場合） */}
            {csvData && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                {/* 行操作 */}
                <Button variant="outline" size="sm" onClick={handleAddRow}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("toolbar.addRow")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteRow}
                  disabled={!selectedCell || selectedCell.row < 0}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  {t("toolbar.deleteRow")}
                </Button>

                {/* 列操作 */}
                <Button variant="outline" size="sm" onClick={handleAddColumn}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t("toolbar.addColumn")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteColumn}
                  disabled={!selectedCell || csvData.headers.length <= 1}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  {t("toolbar.deleteColumn")}
                </Button>

                {/* 型を再検出 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRedetectTypes}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t("options.redetectTypes")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("columnType.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex-1" />

                {/* リセット（ドロップダウン） */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t("toolbar.reset")}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleNew}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("toolbar.resetFull")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearDataOnly}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("toolbar.resetDataOnly")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* ファイル追加 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {t("upload.selectFile")}
                </Button>
              </div>
            )}

            {/* テーブル表示 */}
            {csvData && (
              <div ref={tableContainerRef}>
                <CsvTable
                  data={csvData}
                  editingCell={editingCell}
                  selection={selection}
                  onCellChange={handleCellChange}
                  onStartEdit={handleStartEdit}
                  onEndEdit={handleEndEdit}
                  onSelectCell={handleSelectCell}
                  onExtendSelection={handleExtendSelection}
                  onKeyNavigation={handleKeyNavigation}
                  onColumnTypeChange={handleColumnTypeChange}
                  translations={{
                    header: t("table.header"),
                    row: t("table.row"),
                    column: t("table.column"),
                    editCell: t("table.editCell"),
                    noData: t("table.noData"),
                    columnTypeAuto: t("columnType.auto"),
                    columnTypeString: t("columnType.string"),
                    columnTypeNumber: t("columnType.number"),
                    columnTypeHeader: t("table.columnTypeHeader"),
                  }}
                />
              </div>
            )}

            {/* エクスポート（データがある場合） */}
            {csvData && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* 出力エンコーディング */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      {t("options.encodingOutput")}:
                    </Label>
                    <Select
                      value={outputEncoding}
                      onValueChange={(v) => setOutputEncoding(v as OutputEncodingType)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(OUTPUT_ENCODING_LABELS) as [
                            OutputEncodingType,
                            string,
                          ][]
                        ).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ヘッダーを含める */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exportWithHeader"
                      checked={exportWithHeader}
                      onCheckedChange={(checked) =>
                        setExportWithHeader(checked === true)
                      }
                    />
                    <Label
                      htmlFor="exportWithHeader"
                      className="text-sm cursor-pointer"
                    >
                      {t("export.includeHeader")}
                    </Label>
                  </div>

                  {/* 文字列のクォート */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      {t("export.quoteStrings")}:
                    </Label>
                    <Select
                      value={quoteStyle}
                      onValueChange={(v) => setQuoteStyle(v as QuoteStyle)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="as-needed">
                          {t("export.quoteAsNeeded")}
                        </SelectItem>
                        <SelectItem value="always">
                          {t("export.quoteAlways")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* ファイル名（プレフィックス + ファイル名 + サフィックス） */}
                  <div className="flex items-center gap-1">
                    <Label className="text-sm whitespace-nowrap">
                      {t("export.filename")}:
                    </Label>
                    {/* プレフィックス */}
                    <div className="relative">
                      <Input
                        type="text"
                        value={filenamePrefix}
                        onChange={(e) => setFilenamePrefix(e.target.value)}
                        className="w-32 pr-7"
                        placeholder={t("export.prefix")}
                      />
                      {filenamePrefix && (
                        <button
                          type="button"
                          onClick={() => setFilenamePrefix("")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setFilenamePrefix("");
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label={t("export.clearPrefix")}
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                    </div>
                    {/* ファイル名本体 */}
                    <div className="relative">
                      <Input
                        type="text"
                        value={exportFilename}
                        onChange={(e) => setExportFilename(e.target.value)}
                        className="w-40 pr-7"
                        placeholder={t("export.defaultFilename")}
                      />
                      {exportFilename && (
                        <button
                          type="button"
                          onClick={() => setExportFilename("")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExportFilename("");
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label={t("export.clearFilename")}
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                    </div>
                    {/* サフィックス */}
                    <div className="relative">
                      <Input
                        type="text"
                        value={filenameSuffix}
                        onChange={(e) => setFilenameSuffix(e.target.value)}
                        className="w-32 pr-7"
                        placeholder={t("export.suffix")}
                      />
                      {filenameSuffix && (
                        <button
                          type="button"
                          onClick={() => setFilenameSuffix("")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setFilenameSuffix("");
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label={t("export.clearSuffix")}
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 拡張子 */}
                  <div className="flex items-center gap-1">
                    <Label className="text-sm whitespace-nowrap">
                      {t("export.extension")}:
                    </Label>
                    <Select
                      value={fileExtension}
                      onValueChange={(v) => setFileExtension(v as FileExtension)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(FILE_EXTENSION_LABELS) as [
                            FileExtension,
                            string,
                          ][]
                        ).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ダウンロードボタン */}
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    {t("export.download")}
                  </Button>
                </div>

                {/* ファイル名プレビュー */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("export.preview")}: <span className="font-mono">{filenamePrefix}{exportFilename || t("export.defaultFilename")}{filenameSuffix}{fileExtension}</span>
                </div>
              </div>
            )}

            {/* 空の状態 */}
            {!csvData && !error && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("emptyState")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
