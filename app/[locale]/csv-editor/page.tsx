"use client";

import { CsvTable } from "@/app/components/CsvTable";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  OUTPUT_ENCODING_LABELS,
  parseCSV,
  redetectColumnTypes,
  removeColumn,
  removeRow,
  updateCell,
  updateColumnType,
  type CellPosition,
  type ColumnType,
  type CsvData,
  type CsvOptions,
  type EncodingType,
  type FileExtension,
  type OutputEncodingType,
  type QuoteStyle,
} from "@/lib/utils/csv-parser";
import {
  Download,
  FileSpreadsheet,
  HelpCircle,
  Keyboard,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
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
  const [exportWithHeader, setExportWithHeader] = useState<boolean>(true);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>("as-needed");
  const [fileExtension, setFileExtension] = useState<FileExtension>(".csv");

  // 編集状態
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);

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
        setSelectedCell(null);
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
    const newData = createEmptyCsvData(3, 5, hasHeader, t("table.defaultColumnName"));
    setCsvData(newData);
    setSelectedCell(null);
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
  }, [hasHeader, t]);

  // クリア
  const handleClear = useCallback(() => {
    setCsvData(null);
    setSelectedCell(null);
    setEditingCell(null);
    setError(null);
    setExportFilename("data");
  }, []);

  // セル編集開始
  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
    setSelectedCell({ row, col });
  }, []);

  // セル編集終了
  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // セル選択
  const handleSelectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
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

  // コピー処理
  const handleCopy = useCallback(
    (row: number, col: number) => {
      const value = getCellValue(row, col);
      copyToClipboard(value);
    },
    [getCellValue, copyToClipboard]
  );

  // 切り取り処理
  const handleCut = useCallback(
    (row: number, col: number) => {
      const value = getCellValue(row, col);
      copyToClipboard(value);
      handleCellChange(row, col, "");
    },
    [getCellValue, copyToClipboard, handleCellChange]
  );

  // ペースト処理（内部クリップボードを使用）
  const handlePasteCell = useCallback(
    (row: number, col: number) => {
      if (internalClipboard) {
        handleCellChange(row, col, internalClipboard);
        // フォーカスを維持
        requestAnimationFrame(() => {
          refocusSelectedCell();
        });
      }
    },
    [internalClipboard, handleCellChange, refocusSelectedCell]
  );

  // ネイティブペーストイベントのハンドラ（外部からのペースト対応）
  const handleNativePaste = useCallback(
    (e: ClipboardEvent) => {
      // 編集中でなく、セルが選択されている場合のみ処理
      if (editingCell || !selectedCell || !csvData) return;

      // テーブルコンテナ内でのみ処理
      if (!tableContainerRef.current?.contains(document.activeElement)) return;

      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        handleCellChange(selectedCell.row, selectedCell.col, text);
        // 内部クリップボードも更新
        setInternalClipboard(text);
        // フォーカスを維持
        requestAnimationFrame(() => {
          if (tableContainerRef.current) {
            const cell = tableContainerRef.current.querySelector(
              `[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`
            ) as HTMLElement | null;
            if (cell) {
              cell.focus();
            }
          }
        });
      }
    },
    [editingCell, selectedCell, csvData, handleCellChange]
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

      // コピー・切り取り・ペースト
      if (isModifierKey && !editingCell) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          handleCopy(row, col);
          return;
        }
        if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          handleCut(row, col);
          return;
        }
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          handlePasteCell(row, col);
          return;
        }
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (row > -1) {
            setSelectedCell({ row: row - 1, col });
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (row < maxRow) {
            setSelectedCell({ row: row + 1, col });
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (col > 0) {
            setSelectedCell({ row, col: col - 1 });
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (col < maxCol) {
            setSelectedCell({ row, col: col + 1 });
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
              setSelectedCell({ row, col: col - 1 });
            } else if (row > -1) {
              setSelectedCell({ row: row - 1, col: maxCol });
            }
          } else {
            // 次のセルへ
            if (col < maxCol) {
              setSelectedCell({ row, col: col + 1 });
            } else if (row < maxRow) {
              setSelectedCell({ row: row + 1, col: 0 });
            }
          }
          break;
        case "Delete":
        case "Backspace":
          if (!editingCell) {
            e.preventDefault();
            handleCellChange(row, col, "");
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
    [csvData, editingCell, handleCellChange, handleCopy, handleCut, handlePasteCell]
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
      setSelectedCell({
        row: Math.max(-1, newData.rows.length - 1),
        col: selectedCell.col,
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
      setSelectedCell({
        row: selectedCell.row,
        col: Math.max(0, newData.headers.length - 1),
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

    downloadCSV(csvData, exportFilename, options, fileExtension);
  }, [csvData, exportFilename, getDelimiter, outputEncoding, exportWithHeader, quoteStyle, fileExtension]);

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
                        <p>{t("keyboard.enter")}</p>
                        <p>{t("keyboard.tab")}</p>
                        <p>{t("keyboard.shiftTab")}</p>
                        <p>{t("keyboard.escape")}</p>
                        <p>{t("keyboard.copy")}</p>
                        <p>{t("keyboard.cut")}</p>
                        <p>{t("keyboard.paste")}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
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

                {/* クリア */}
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("toolbar.clear")}
                </Button>

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
                  selectedCell={selectedCell}
                  onCellChange={handleCellChange}
                  onStartEdit={handleStartEdit}
                  onEndEdit={handleEndEdit}
                  onSelectCell={handleSelectCell}
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
                  {/* ファイル名 */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      {t("export.filename")}:
                    </Label>
                    <Input
                      type="text"
                      value={exportFilename}
                      onChange={(e) => setExportFilename(e.target.value)}
                      className="w-48"
                      placeholder={t("export.defaultFilename")}
                    />
                  </div>

                  {/* 拡張子 */}
                  <div className="flex items-center gap-2">
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
