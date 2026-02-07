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
  ENCODING_LABELS,
  FILE_EXTENSION_LABELS,
  OUTPUT_ENCODING_LABELS,
  type EncodingType,
  type FileExtension,
  type OutputEncodingType,
  type QuoteStyle,
} from "@/lib/utils/csv";
import { useCsvEditor, type DelimiterType } from "@/lib/hooks/useCsvEditor";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FilterX,
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
import React from "react";

export default function CsvEditorPage() {
  const t = useTranslations("csvEditor");
  const tCommon = useTranslations("common");

  const {
    csvData,
    delimiter,
    customDelimiter,
    setCustomDelimiter,
    hasHeader,
    autoDetect,
    setAutoDetect,
    inputEncoding,
    setInputEncoding,
    outputEncoding,
    setOutputEncoding,
    detectedEncoding,
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
    editingCell,
    selection,
    rowSelection,
    selectedCell,
    filterState,
    sortState,
    displayRowIndices,
    isDragging,
    error,
    showKeyboardHelp,
    setShowKeyboardHelp,
    fileInputRef,
    textareaRef,
    tableContainerRef,
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
  } = useCsvEditor(t);

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
                        <p>{t("keyboard.newline")}</p>
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
                  disabled={
                    !rowSelection &&
                    (!selectedCell || selectedCell.row < 0)
                  }
                >
                  <Minus className="w-4 h-4 mr-1" />
                  {rowSelection
                    ? t("toolbar.deleteRowsCount", { count: Math.abs(rowSelection.endRow - rowSelection.startRow) + 1 })
                    : t("toolbar.deleteRow")}
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

            {/* フィルター状態表示 */}
            {csvData && filterState.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {t("filter.showingRows", {
                    filtered: displayRowIndices.length,
                    total: csvData.rows.length,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-7 px-2 text-xs"
                >
                  <FilterX className="w-3.5 h-3.5 mr-1" />
                  {t("filter.clearAll")}
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
                  rowSelection={rowSelection}
                  onCellChange={handleCellChange}
                  onStartEdit={handleStartEdit}
                  onEndEdit={handleEndEdit}
                  onSelectCell={handleSelectCell}
                  onExtendSelection={handleExtendSelection}
                  onSelectRow={handleSelectRow}
                  onExtendRowSelection={handleExtendRowSelection}
                  onKeyNavigation={handleKeyNavigation}
                  onColumnTypeChange={handleColumnTypeChange}
                  displayRowIndices={displayRowIndices}
                  filterState={filterState}
                  sortState={sortState}
                  onSort={handleSort}
                  onFilterChange={handleFilterChange}
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
                    filterPlaceholder: t("filter.placeholder"),
                    filterClear: t("filter.clear"),
                    operatorEquals: t("filter.operatorEquals"),
                    operatorNotEquals: t("filter.operatorNotEquals"),
                    operatorGreater: t("filter.operatorGreater"),
                    operatorLess: t("filter.operatorLess"),
                    operatorGreaterOrEquals: t("filter.operatorGreaterOrEquals"),
                    operatorLessOrEquals: t("filter.operatorLessOrEquals"),
                    sortAscending: t("sort.ascending"),
                    sortDescending: t("sort.descending"),
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
