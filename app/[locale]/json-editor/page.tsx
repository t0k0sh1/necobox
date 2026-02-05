"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FormatMode,
  type IndentType,
  type ValidationError,
  type ValidationWarning,
  formatJson,
  validateJson,
} from "@/lib/utils/json";
import {
  AlertTriangle,
  Braces,
  Check,
  Copy,
  Download,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useRef, useState } from "react";

export default function JsonEditorPage() {
  const t = useTranslations("jsonEditor");
  const tCommon = useTranslations("common");

  // 入力テキスト
  const [input, setInput] = useState<string>("");

  // フォーマットオプション
  const [formatMode, setFormatMode] = useState<FormatMode>("pretty");
  const [indent, setIndent] = useState<IndentType>(2);

  // UI状態
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // バリデーション結果（入力から派生）
  const validationResult = useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: null as boolean | null,
        error: null as ValidationError | null,
        warnings: [] as ValidationWarning[],
      };
    }
    const result = validateJson(input);
    return {
      isValid: result.valid,
      error: result.error ?? null,
      warnings: result.warnings ?? [],
    };
  }, [input]);

  const isValid = validationResult.isValid;
  const validationError = validationResult.error;
  const validationWarnings = validationResult.warnings;

  // クリップボードにコピー
  const handleCopy = useCallback(async () => {
    if (!input.trim()) return;

    try {
      await navigator.clipboard.writeText(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      const textarea = document.createElement("textarea");
      textarea.value = input;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [input]);

  // ファイルダウンロード
  const handleDownload = useCallback(() => {
    if (!input.trim()) return;

    const blob = new Blob([input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [input]);

  // クリア
  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  // ファイル読み込み
  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
  }, []);

  // ファイル選択
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      // ファイルサイズチェック（10MB以下）
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      handleFileRead(file);
    },
    [handleFileRead]
  );

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

  // フォーマットモード変更時に自動フォーマット
  const handleFormatModeChange = useCallback(
    (value: FormatMode) => {
      setFormatMode(value);
      // 有効なJSONの場合のみ自動フォーマット
      if (input.trim() && isValid) {
        const result = formatJson(input, {
          mode: value,
          indent: value === "pretty" ? indent : undefined,
        });
        if (result.success && result.output) {
          setInput(result.output);
        }
      }
    },
    [input, isValid, indent]
  );

  // インデント変更時に自動フォーマット
  const handleIndentChange = useCallback(
    (value: string) => {
      const newIndent: IndentType =
        value === "tab" ? "tab" : (parseInt(value, 10) as 2 | 4);
      setIndent(newIndent);
      // 有効なJSONの場合のみ自動フォーマット
      if (input.trim() && isValid && formatMode === "pretty") {
        const result = formatJson(input, { mode: "pretty", indent: newIndent });
        if (result.success && result.output) {
          setInput(result.output);
        }
      }
    },
    [input, isValid, formatMode]
  );

  // エラーメッセージの整形
  const getErrorMessage = useCallback((): string => {
    if (!validationError) return "";
    if (validationError.line && validationError.column) {
      return t("validation.errorAt", {
        line: validationError.line,
        column: validationError.column,
        message: validationError.message,
      });
    }
    return t("validation.errorMessage", { message: validationError.message });
  }, [validationError, t]);

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          {/* タイトル */}
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* 入力エリア */}
          <div className="space-y-2">
            <Label htmlFor="json-input">{t("input.label")}</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative ${
                isDragging ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
            >
              <textarea
                ref={textareaRef}
                id="json-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-80 px-3 py-2 border rounded-md bg-transparent text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("input.placeholder")}
              />
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-md border-2 border-dashed border-primary">
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">
                      {t("input.dragDrop")}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                handleFileSelect(e.target.files);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="hidden"
              aria-label={t("input.dragDrop")}
            />
          </div>

          {/* ツールバー */}
          <div className="flex flex-wrap items-center gap-4">
            {/* 表示形式切り替え */}
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">
                {t("format.label")}:
              </Label>
              <div className="flex border rounded-md" role="radiogroup" aria-label={t("format.label")}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={formatMode === "pretty"}
                  onClick={() => handleFormatModeChange("pretty")}
                  className={`text-sm px-3 py-1.5 rounded-l-md transition-colors ${
                    formatMode === "pretty"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {t("format.pretty")}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={formatMode === "minify"}
                  onClick={() => handleFormatModeChange("minify")}
                  className={`text-sm px-3 py-1.5 rounded-r-md transition-colors ${
                    formatMode === "minify"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {t("format.minify")}
                </button>
              </div>
            </div>

            {/* インデント選択（整形モードのみ） */}
            {formatMode === "pretty" && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">
                  {t("indent.label")}:
                </Label>
                <Select
                  value={indent === "tab" ? "tab" : String(indent)}
                  onValueChange={handleIndentChange}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">{t("indent.twoSpaces")}</SelectItem>
                    <SelectItem value="4">{t("indent.fourSpaces")}</SelectItem>
                    <SelectItem value="tab">{t("indent.tab")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1" />

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!input.trim()}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? tCommon("copied") : t("toolbar.copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!input.trim() || !isValid}
              >
                <Download className="w-4 h-4 mr-1" />
                {t("toolbar.download")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-1" />
                {t("toolbar.clear")}
              </Button>
            </div>
          </div>

          {/* バリデーション結果 */}
          {isValid !== null && (
            <div className="space-y-2">
              {/* 有効/無効ステータス */}
              <div
                className={`flex items-center gap-2 p-3 rounded-md ${
                  isValid
                    ? validationWarnings.length > 0
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700"
                      : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
                }`}
              >
                {isValid ? (
                  validationWarnings.length > 0 ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        {t("validation.validWithWarnings")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {t("validation.valid")}
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {getErrorMessage()}
                    </span>
                  </>
                )}
              </div>

              {/* 警告リスト */}
              {validationWarnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                  <ul className="space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li
                        key={index}
                        className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          {warning.line
                            ? t("validation.warningAt", {
                                line: warning.line,
                                message: warning.message,
                              })
                            : warning.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 空の状態 */}
          {!input.trim() && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Braces className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("error.emptyInput")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
