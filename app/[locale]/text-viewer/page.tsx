"use client";

import { CopyButton } from "@/app/components/CopyButton";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decompressGz, isGzipFile } from "@/lib/utils/gz-decompressor";
import { validateRegex } from "@/lib/utils/log-filter";
import { hasNonEmptyMatch, highlightMatches } from "@/lib/utils/text-highlight";
import { decompressZip, isZipFile, type ExtractedFile } from "@/lib/utils/zip-decompressor";
import { FileText, HelpCircle, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  lines: string[];
  searchText: string;
  isRegex: boolean;
}

export default function TextViewerPage() {
  const t = useTranslations("textViewer");
  const tCommon = useTranslations("common");

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示オプション
  const [wrapLines, setWrapLines] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 正規表現ヘルプボックスの状態
  const [showRegexHelp, setShowRegexHelp] = useState(false);
  const [helpBoxPosition, setHelpBoxPosition] = useState({ x: 100, y: 100 });
  const [isDraggingHelp, setIsDraggingHelp] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const helpBoxRef = useRef<HTMLDivElement>(null);

  // ドラッグ処理
  useEffect(() => {
    if (!isDraggingHelp) return;

    const handleMouseMove = (e: MouseEvent) => {
      setHelpBoxPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingHelp(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingHelp, dragOffset]);

  const handleHelpBoxMouseDown = (e: React.MouseEvent) => {
    if (helpBoxRef.current) {
      const rect = helpBoxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDraggingHelp(true);
    }
  };

  // 選択中のファイル
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  // 選択中のファイルの行
  const lines = useMemo(() => {
    return activeFile?.lines || [];
  }, [activeFile]);

  // 選択中のファイルの検索テキスト
  const searchText = activeFile?.searchText || "";

  // 選択中のファイルの正規表現フラグ
  const isRegex = activeFile?.isRegex || false;

  // 正規表現のバリデーション結果
  const regexValidation = useMemo(() => {
    if (!isRegex || !searchText.trim()) {
      return { isValid: true, error: undefined };
    }
    return validateRegex(searchText);
  }, [isRegex, searchText]);

  // ファイルごとの検索テキストを更新
  const updateSearchText = useCallback((fileId: string, newSearchText: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, searchText: newSearchText } : f
      )
    );
  }, []);

  // ファイルごとの正規表現フラグを更新
  const updateIsRegex = useCallback((fileId: string, newIsRegex: boolean) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, isRegex: newIsRegex } : f
      )
    );
  }, []);

  // フィルタされた行
  const filteredLines = useMemo(() => {
    if (!searchText.trim()) {
      return lines.map((line, index) => ({ line, originalIndex: index }));
    }

    // 正規表現モードで無効な正規表現の場合は全行を返す
    if (isRegex && !regexValidation.isValid) {
      return lines.map((line, index) => ({ line, originalIndex: index }));
    }

    // hasNonEmptyMatch を使用して空文字列マッチを除外
    return lines
      .map((line, index) => ({ line, originalIndex: index }))
      .filter(({ line }) => hasNonEmptyMatch(line, searchText, isRegex));
  }, [lines, searchText, isRegex, regexValidation.isValid]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // ファイルを並列で処理
        const filePromises = Array.from(selectedFiles).map(async (file): Promise<UploadedFile[]> => {
          try {
            // ZIPファイルの場合は複数ファイルを返す
            if (isZipFile(file)) {
              const extractedFiles: ExtractedFile[] = await decompressZip(file);
              return extractedFiles.map((extracted) => {
                const fileId = crypto.randomUUID();
                const fileLines = extracted.content.split(/\r?\n/);
                return {
                  id: fileId,
                  name: `${file.name}/${extracted.name}`,
                  size: new Blob([extracted.content]).size,
                  lines: fileLines,
                  searchText: "",
                  isRegex: false,
                };
              });
            }

            // GZファイルの場合は解凍して1ファイルとして返す
            if (isGzipFile(file)) {
              const content = await decompressGz(file);
              const fileId = crypto.randomUUID();
              const fileLines = content.split(/\r?\n/);
              // .gz を除いた名前を使用
              const displayName = file.name.replace(/\.gz$/i, "");
              return [{
                id: fileId,
                name: displayName,
                size: new Blob([content]).size,
                lines: fileLines,
                searchText: "",
                isRegex: false,
              }];
            }

            // 通常のテキストファイル
            const content = await file.text();
            const fileId = crypto.randomUUID();
            const fileLines = content.split(/\r?\n/);
            return [{
              id: fileId,
              name: file.name,
              size: file.size,
              lines: fileLines,
              searchText: "",
              isRegex: false,
            }];
          } catch (fileError) {
            const errorMessage =
              fileError instanceof Error
                ? fileError.message
                : "Failed to process file";
            throw new Error(`${file.name}: ${errorMessage}`);
          }
        });

        const results = await Promise.all(filePromises);
        const newFiles = results.flat();
        setFiles((prev) => [...prev, ...newFiles]);

        // 最初のファイルがアップロードされた場合、自動的に選択
        if (newFiles.length > 0 && !activeFileId) {
          setActiveFileId(newFiles[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("error"));
      } finally {
        setIsLoading(false);
      }
    },
    [tCommon, activeFileId]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId);

      // 削除されたファイルが選択中の場合、別のファイルを選択
      if (activeFileId === fileId) {
        if (newFiles.length > 0) {
          setActiveFileId(newFiles[0].id);
        } else {
          setActiveFileId(null);
        }
      }

      return newFiles;
    });
  };

  const handleClear = () => {
    setFiles([]);
    setActiveFileId(null);
    setError(null);
  };

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-7xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* ファイルアップロードエリア */}
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
            <h3 className="text-lg font-medium mb-2">{t("upload.title")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("upload.description")}
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t("upload.selectFiles")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.log,.md,.json,.csv,.xml,.yaml,.yml,.gz,.zip,text/plain,application/json,text/csv,text/xml,application/yaml,text/yaml,application/gzip,application/x-gzip,application/zip"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label={t("upload.selectFiles")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t("upload.dragDrop")}
              </p>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tCommon("loading")}
              </p>
            </div>
          )}

          {/* ファイルタブ表示 */}
          {files.length > 0 && (
            <div className="space-y-4">
              {/* クリアボタン */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  {tCommon("clear")}
                </Button>
              </div>

              <Tabs
                value={activeFileId || undefined}
                onValueChange={(value) => setActiveFileId(value)}
              >
                {/* タブリスト */}
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-gray-100 dark:bg-gray-900 p-1">
                  {files.map((file) => (
                    <TabsTrigger
                      key={file.id}
                      value={file.id}
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 max-w-[200px]"
                    >
                      <span className="truncate">{file.name}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            removeFile(file.id);
                          }
                        }}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5 cursor-pointer"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* タブコンテンツ */}
                {files.map((file) => (
                  <TabsContent key={file.id} value={file.id} className="mt-4">
                    {/* ファイル情報 */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {file.name} - {formatFileSize(file.size)} - {file.lines.length} lines
                    </div>

                    {/* フィルタと表示オプション */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* 検索入力 */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                placeholder={file.isRegex ? t("filter.regexPlaceholder") : t("filter.placeholder")}
                                value={file.searchText}
                                onChange={(e) => updateSearchText(file.id, e.target.value)}
                                className={file.isRegex && !regexValidation.isValid && file.searchText ? "border-red-500" : ""}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`useRegex-${file.id}`}
                                checked={file.isRegex}
                                onCheckedChange={(checked) =>
                                  updateIsRegex(file.id, checked === true)
                                }
                              />
                              <Label htmlFor={`useRegex-${file.id}`} className="text-sm cursor-pointer whitespace-nowrap">
                                {t("filter.useRegex")}
                              </Label>
                              {/* 正規表現ヘルプボタン */}
                              <button
                                type="button"
                                onClick={() => setShowRegexHelp(!showRegexHelp)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label={t("filter.regexHelp.title")}
                              >
                                <HelpCircle className={`w-4 h-4 ${showRegexHelp ? "text-primary" : "text-gray-400"}`} />
                              </button>
                            </div>
                          </div>
                          {/* 正規表現エラーメッセージ */}
                          {file.isRegex && !regexValidation.isValid && file.searchText && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {t("filter.invalidRegex")}
                            </p>
                          )}
                        </div>

                        {/* 表示オプション */}
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="wrapLines"
                              checked={wrapLines}
                              onCheckedChange={(checked) =>
                                setWrapLines(checked === true)
                              }
                            />
                            <Label htmlFor="wrapLines" className="text-sm cursor-pointer">
                              {t("options.wrapLines")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="showLineNumbers"
                              checked={showLineNumbers}
                              onCheckedChange={(checked) =>
                                setShowLineNumbers(checked === true)
                              }
                            />
                            <Label
                              htmlFor="showLineNumbers"
                              className="text-sm cursor-pointer"
                            >
                              {t("options.showLineNumbers")}
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* フィルタ結果カウント */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("filter.resultsCount", {
                          filtered: filteredLines.length,
                          total: lines.length,
                        })}
                      </div>
                    </div>

                    {/* テキスト表示エリア */}
                    <div
                      className={`border rounded-lg bg-gray-50 dark:bg-gray-900 mt-4 ${
                        wrapLines ? "" : "overflow-x-auto"
                      }`}
                    >
                      <div className="p-4 font-mono text-sm">
                        {filteredLines.map(({ line, originalIndex }) => (
                          <div
                            key={originalIndex}
                            className={`group flex ${
                              wrapLines ? "" : "whitespace-nowrap"
                            } hover:bg-gray-100 dark:hover:bg-gray-800`}
                          >
                            {showLineNumbers && (
                              <span className="select-none text-gray-400 dark:text-gray-600 pr-4 text-right min-w-[4rem]">
                                {originalIndex + 1}
                              </span>
                            )}
                            <span
                              className={`flex-1 ${
                                wrapLines ? "break-all" : ""
                              }`}
                            >
                              {searchText.trim() && regexValidation.isValid
                                ? highlightMatches(line, searchText, file.isRegex)
                                : line || "\u00A0"}
                            </span>
                            {/* コピーボタン（ホバー時のみ表示） */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                              <CopyButton
                                text={line}
                                className="h-6 w-6 p-0"
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* 空の状態 */}
          {files.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("emptyState")}</p>
            </div>
          )}
        </div>
      </div>

      {/* 正規表現ヘルプフローティングボックス */}
      {showRegexHelp && (
        <div
          ref={helpBoxRef}
          style={{
            left: helpBoxPosition.x,
            top: helpBoxPosition.y,
          }}
          className="fixed w-80 bg-gray-900 text-white text-xs rounded-lg shadow-2xl z-50 select-none"
        >
          {/* ヘッダー（ドラッグハンドル） */}
          <div
            onMouseDown={handleHelpBoxMouseDown}
            className="flex items-center justify-between p-2 bg-gray-800 rounded-t-lg cursor-move border-b border-gray-700"
          >
            <span className="font-semibold">{t("filter.regexHelp.title")}</span>
            <button
              type="button"
              onClick={() => setShowRegexHelp(false)}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              aria-label={t("filter.regexHelp.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
              <div>{t("filter.regexHelp.dot")}</div>
              <div>{t("filter.regexHelp.asterisk")}</div>
              <div>{t("filter.regexHelp.plus")}</div>
              <div>{t("filter.regexHelp.question")}</div>
              <div>{t("filter.regexHelp.caret")}</div>
              <div>{t("filter.regexHelp.dollar")}</div>
              <div>{t("filter.regexHelp.charClass")}</div>
              <div>{t("filter.regexHelp.negCharClass")}</div>
              <div>{t("filter.regexHelp.digit")}</div>
              <div>{t("filter.regexHelp.word")}</div>
              <div>{t("filter.regexHelp.space")}</div>
              <div>{t("filter.regexHelp.or")}</div>
              <div>{t("filter.regexHelp.group")}</div>
            </div>
            <div className="font-semibold mt-3 mb-1">{t("filter.regexHelp.examples")}</div>
            <div className="space-y-1 font-mono text-[11px]">
              <div>{t("filter.regexHelp.exampleError")}</div>
              <div>{t("filter.regexHelp.exampleIp")}</div>
              <div>{t("filter.regexHelp.exampleTime")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
