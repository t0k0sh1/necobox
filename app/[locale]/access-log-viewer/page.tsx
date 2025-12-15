"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, FileText, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { parseAccessLog, type AccessLogEntry } from "@/lib/utils/access-log-parser";
import { decompressGz, isGzipFile } from "@/lib/utils/gz-decompressor";
import {
  filterLogEntries,
  parseStatusCodeFilter,
  validateRegex,
  type LogFilters,
} from "@/lib/utils/log-filter";

type SortField = "timestamp" | "ip" | "status" | "method" | "path" | `column-${number}`;
type SortDirection = "asc" | "desc";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

export default function AccessLogViewerPage() {
  const t = useTranslations("accessLogViewer");
  const tCommon = useTranslations("common");

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [entries, setEntries] = useState<AccessLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>("");
  const [pathRegexFilter, setPathRegexFilter] = useState<string>("");

  // Sort
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate filters
  const statusCodeValidation = useMemo(() => {
    if (!statusCodeFilter.trim()) {
      return { isValid: true, error: undefined };
    }
    return parseStatusCodeFilter(statusCodeFilter);
  }, [statusCodeFilter]);

  const pathRegexValidation = useMemo(() => {
    if (!pathRegexFilter.trim()) {
      return { isValid: true, error: undefined };
    }
    return validateRegex(pathRegexFilter);
  }, [pathRegexFilter]);

  // Memoize extracted columns per entry to avoid recomputation
  const extractedColumnsCache = useMemo(() => {
    const cache = new Map<string, string[]>();
    return cache;
  }, [entries]);

  // Extract additional columns from raw field
  const extractAdditionalColumns = useCallback((entry: AccessLogEntry): string[] => {
    // Use raw as cache key since it's unique per entry
    const cacheKey = entry.raw;
    if (extractedColumnsCache.has(cacheKey)) {
      return extractedColumnsCache.get(cacheKey)!;
    }
    const raw = entry.raw.trim();
    if (!raw) return [];

    // Split by spaces, but preserve quoted strings and bracketed content
    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    let inBrackets = false;
    let bracketDepth = 0;

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if ((char === '"' || char === "'") && !inQuotes && !inBrackets) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
        current += char;
      } else if (char === "[" && !inQuotes) {
        if (!inBrackets) {
          inBrackets = true;
          bracketDepth = 0;
        }
        bracketDepth++;
        current += char;
      } else if (char === "]" && !inQuotes && inBrackets) {
        bracketDepth--;
        current += char;
        if (bracketDepth === 0) {
          inBrackets = false;
        }
      } else if (char === " " && !inQuotes && !inBrackets) {
        if (current.trim()) {
          tokens.push(current.trim());
        }
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      tokens.push(current.trim());
    }

    // Build a set of known field values to exclude (with and without quotes)
    const knownValues = new Set<string>();

    // Add known field values (both quoted and unquoted versions)
    const addKnownValue = (value: string | undefined) => {
      if (value && value !== "-") {
        knownValues.add(value);
        knownValues.add(`"${value}"`);
        knownValues.add(`'${value}'`);
      }
    };

    addKnownValue(entry.ip);
    addKnownValue(entry.method);
    addKnownValue(entry.path);
    if (entry.status > 0) {
      const statusStr = entry.status.toString();
      knownValues.add(statusStr);
      knownValues.add(`"${statusStr}"`);
    }
    if (entry.size) {
      const sizeStr = entry.size.toString();
      knownValues.add(sizeStr);
      knownValues.add(`"${sizeStr}"`);
    }
    addKnownValue(entry.referer);
    addKnownValue(entry.userAgent);

    // Track which known values we've already excluded (to avoid double exclusion)
    const excludedValues = new Set<string>();

    // Filter tokens, excluding known fields
    const filteredTokens = tokens.filter((token) => {
      // Skip empty tokens
      if (!token || token === "-") return false;

      // Skip timestamp patterns (e.g., [10/Oct/2000:13:55:36 -0700] or [Sun Dec 04 04:47:44 2005])
      if (token.match(/^\[.*\]$/)) return false;

      // Skip HTTP version (e.g., HTTP/1.0, HTTP/1.1)
      if (token.match(/^HTTP\/\d+\.\d+$/)) return false;

      // Skip tokens that are part of a bracketed timestamp (in case of split issues)
      if (token.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/i)) return false;
      if (token.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i)) return false;
      if (token.match(/^\d{1,2}:\d{2}:\d{2}$/)) return false; // Time pattern like 04:47:44

      // Check if token matches a known value (exact match)
      if (knownValues.has(token)) {
        // Only exclude if we haven't excluded this value yet
        if (!excludedValues.has(token)) {
          excludedValues.add(token);
          return false;
        }
      }

      // Check unquoted version
      const unquoted = token.replace(/^["']|["']$/g, "");
      if (unquoted !== token && knownValues.has(unquoted)) {
        if (!excludedValues.has(unquoted)) {
          excludedValues.add(unquoted);
          return false;
        }
      }

      return true;
    });

    // Cache the result
    extractedColumnsCache.set(cacheKey, filteredTokens);
    return filteredTokens;
  }, [extractedColumnsCache]);

  // Calculate maximum number of additional columns across all entries
  const maxAdditionalColumns = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(extractAdditionalColumns).map((cols) => cols.length));
  }, [entries, extractAdditionalColumns]);

  // Apply filters and sort
  const filteredAndSortedEntries = useMemo(() => {
    const filters: LogFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      statusCode: statusCodeFilter || undefined,
      pathRegex: pathRegexFilter || undefined,
    };

    let filtered = filterLogEntries(entries, filters);

    // Sort
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        if (sortField.startsWith("column-")) {
          const columnIndex = parseInt(sortField.replace("column-", ""), 10);
          const aCols = extractAdditionalColumns(a);
          const bCols = extractAdditionalColumns(b);
          const aVal = aCols[columnIndex] || "";
          const bVal = bCols[columnIndex] || "";
          comparison = aVal.localeCompare(bVal);
        } else {
          switch (sortField) {
            case "timestamp":
              comparison = a.timestamp.getTime() - b.timestamp.getTime();
              break;
            case "ip":
              comparison = (a.ip || "").localeCompare(b.ip || "");
              break;
            case "status":
              comparison = a.status - b.status;
              break;
            case "method":
              comparison = (a.method || "").localeCompare(b.method || "");
              break;
            case "path":
              comparison = (a.path || "").localeCompare(b.path || "");
              break;
          }
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [entries, startDate, endDate, statusCodeFilter, pathRegexFilter, sortField, sortDirection, extractAdditionalColumns]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);
      setParseErrors([]);

      try {
        const newFiles: UploadedFile[] = [];
        const allEntries: AccessLogEntry[] = [];
        const allParseErrors: string[] = [];

        // Process files in parallel
        const filePromises = Array.from(selectedFiles).map(async (file) => {
          const fileId = `${Date.now()}-${Math.random()}`;
          newFiles.push({
            id: fileId,
            name: file.name,
            size: file.size,
          });

          try {
            let content: string;

            if (isGzipFile(file)) {
              content = await decompressGz(file);
            } else {
              content = await file.text();
            }

            const result = parseAccessLog(content);
            allEntries.push(...result.entries);
            if (result.errors.length > 0) {
              allParseErrors.push(
                ...result.errors.map((err) => `${file.name}: ${err}`)
              );
            }
          } catch (fileError) {
            const errorMessage =
              fileError instanceof Error
                ? fileError.message
                : "Failed to process file";
            allParseErrors.push(`${file.name}: ${errorMessage}`);
          }
        });

        await Promise.all(filePromises);

        setFiles((prev) => [...prev, ...newFiles]);
        setEntries((prev) => [...prev, ...allEntries]);
        setParseErrors((prev) => [...prev, ...allParseErrors]);

        // Only show error if no entries were created at all (file read failure, etc.)
        // Parse errors are shown separately and don't prevent entries from being created
        if (allEntries.length === 0 && newFiles.length > 0) {
          setError(t("error.noValidEntries"));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("error.fileProcessingFailed")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    // Note: We don't remove entries because we can't track which entries came from which file
    // In a production app, you might want to track this
  };

  const handleClear = () => {
    setFiles([]);
    setEntries([]);
    setError(null);
    setParseErrors([]);
    setStartDate("");
    setEndDate("");
    setStatusCodeFilter("");
    setPathRegexFilter("");
    setSortField(null);
    setSortDirection("desc");
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

  const handleSort = (field: SortField | string) => {
    const sortFieldValue = field as SortField;
    if (sortField === sortFieldValue) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(sortFieldValue);
      setSortDirection("asc");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSortIcon = (field: SortField | string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
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

          {/* File Upload Area */}
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
                accept=".log,.txt,.gz,text/plain"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label={t("upload.selectFiles")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t("upload.dragDrop")}
              </p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">
                  {t("uploadedFiles", { count: files.length })}
                </p>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  {tCommon("clear")}
                </Button>
              </div>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="ml-2"
                      aria-label={t("upload.removeFile", { fileName: file.name })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {entries.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold">{t("filters.title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Filters */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("filters.startDate")}</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("filters.endDate")}</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Status Code Filter */}
                <div className="space-y-2">
                  <Label htmlFor="statusCode">
                    {t("filters.statusCode")}
                    <span className="text-xs text-gray-500 ml-2">
                      ({t("filters.statusCodeHint")})
                    </span>
                  </Label>
                  <Input
                    id="statusCode"
                    type="text"
                    placeholder="404, 4xx, !2xx, 4xx,5xx"
                    value={statusCodeFilter}
                    onChange={(e) => setStatusCodeFilter(e.target.value)}
                  />
                  {!statusCodeValidation.isValid && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {statusCodeValidation.error || t("filters.invalidStatus")}
                    </p>
                  )}
                </div>

                {/* Path Regex Filter */}
                <div className="space-y-2">
                  <Label htmlFor="pathRegex">
                    {t("filters.pathRegex")}
                    <span className="text-xs text-gray-500 ml-2">
                      ({t("filters.regexHint")})
                    </span>
                  </Label>
                  <Input
                    id="pathRegex"
                    type="text"
                    placeholder="/api/.*"
                    value={pathRegexFilter}
                    onChange={(e) => setPathRegexFilter(e.target.value)}
                  />
                  {!pathRegexValidation.isValid && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {pathRegexValidation.error || t("filters.invalidRegex")}
                    </p>
                  )}
                </div>
              </div>

              {/* Filter Results Count */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("filters.resultsCount", {
                  filtered: filteredAndSortedEntries.length,
                  total: entries.length,
                })}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm font-medium mb-2">
                {t("parseErrors.title")} ({parseErrors.length})
              </p>
              <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {parseErrors.slice(0, 10).map((err, idx) => (
                  <li key={idx} className="text-yellow-600 dark:text-yellow-400">
                    {err}
                  </li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="text-yellow-600 dark:text-yellow-400">
                    ... {parseErrors.length - 10} {t("parseErrors.more")}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tCommon("loading")}
              </p>
            </div>
          )}

          {/* Log Entries Table */}
          {filteredAndSortedEntries.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold">
                {t("table.title")} ({filteredAndSortedEntries.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[180px]"
                        onClick={() => handleSort("timestamp")}
                      >
                        <div className="flex items-center gap-2">
                          {t("table.timestamp")}
                          {getSortIcon("timestamp")}
                        </div>
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[120px]"
                        onClick={() => handleSort("ip")}
                      >
                        <div className="flex items-center gap-2">
                          {t("table.ip")}
                          {getSortIcon("ip")}
                        </div>
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[80px]"
                        onClick={() => handleSort("method")}
                      >
                        <div className="flex items-center gap-2">
                          {t("table.method")}
                          {getSortIcon("method")}
                        </div>
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[200px]"
                        onClick={() => handleSort("path")}
                      >
                        <div className="flex items-center gap-2">
                          {t("table.path")}
                          {getSortIcon("path")}
                        </div>
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[80px]"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-2">
                          {t("table.status")}
                          {getSortIcon("status")}
                        </div>
                      </th>
                      <th className="text-left p-2 whitespace-nowrap min-w-[100px]">{t("table.size")}</th>
                      <th className="text-left p-2 whitespace-nowrap min-w-[200px]">{t("table.userAgent")}</th>
                      {Array.from({ length: maxAdditionalColumns }, (_, i) => (
                        <th
                          key={i}
                          className="text-left p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 whitespace-nowrap min-w-[150px]"
                          onClick={() => handleSort(`column-${i}`)}
                        >
                          <div className="flex items-center gap-2">
                            {t("table.column", { number: i + 1 })}
                            {getSortIcon(`column-${i}`)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedEntries.map((entry, idx) => {
                      const additionalColumns = extractAdditionalColumns(entry);
                      return (
                        <tr
                          key={idx}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="p-2 text-sm font-mono whitespace-nowrap min-w-[180px]">
                            {entry.timestamp.toLocaleString()}
                          </td>
                          <td className="p-2 text-sm font-mono whitespace-nowrap min-w-[120px]">
                            {entry.ip || "-"}
                          </td>
                          <td className="p-2 text-sm font-mono whitespace-nowrap min-w-[80px]">
                            {entry.method || "-"}
                          </td>
                          <td className="p-2 text-sm font-mono max-w-md truncate min-w-[200px]">
                            {entry.path || "-"}
                          </td>
                          <td className="p-2 text-sm font-mono whitespace-nowrap min-w-[80px]">
                            {entry.status > 0 ? (
                              <span
                                className={`px-2 py-1 rounded ${
                                  entry.status >= 500
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : entry.status >= 400
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : entry.status >= 300
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                }`}
                              >
                                {entry.status}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                -
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-sm whitespace-nowrap min-w-[100px]">
                            {entry.size
                              ? formatFileSize(entry.size)
                              : t("table.noSize")}
                          </td>
                          <td className="p-2 text-sm font-mono max-w-md truncate min-w-[200px]" title={entry.userAgent || ""}>
                            {entry.userAgent || "-"}
                          </td>
                          {Array.from({ length: maxAdditionalColumns }, (_, i) => (
                            <td
                              key={i}
                              className="p-2 text-sm font-mono max-w-md truncate whitespace-nowrap min-w-[150px]"
                              title={additionalColumns[i] || ""}
                            >
                              {additionalColumns[i] || "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {entries.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("emptyState")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

