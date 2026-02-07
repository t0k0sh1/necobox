"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MIME_CATEGORY_ORDER,
  getMimeTypesByCategory,
  type MimeCategory,
  type MimeType,
} from "@/lib/data/mime-types";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// カテゴリごとの色設定
const CATEGORY_COLORS: Record<
  MimeCategory,
  { badge: string; bg: string }
> = {
  text: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  application: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  image: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  audio: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  video: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  font: {
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    bg: "border-teal-200 dark:border-teal-800",
  },
  multipart: {
    badge:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    bg: "border-gray-200 dark:border-gray-700",
  },
};

export function MimeTypeCheatsheet() {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<MimeCategory>
  >(new Set());
  const [expandedMimeTypes, setExpandedMimeTypes] = useState<Set<string>>(
    new Set()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const groupedMimeTypes = useMemo(() => getMimeTypesByCategory(), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedMimeTypes;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<MimeCategory, MimeType[]>();

    for (const [category, mimeTypes] of groupedMimeTypes) {
      const matched = mimeTypes.filter(
        (m) =>
          m.mimeType.toLowerCase().includes(query) ||
          m.nameEn.toLowerCase().includes(query) ||
          m.nameJa.includes(query) ||
          m.descriptionEn.toLowerCase().includes(query) ||
          m.descriptionJa.includes(query) ||
          m.extensions.some((ext) => ext.toLowerCase().includes(query))
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedMimeTypes, searchQuery]);

  const toggleCategory = (category: MimeCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleMimeType = (mimeType: string) => {
    setExpandedMimeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(mimeType)) {
        next.delete(mimeType);
      } else {
        next.add(mimeType);
      }
      return next;
    });
  };

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedId(id);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const getName = (m: MimeType) =>
    locale === "ja" ? m.nameJa : m.nameEn;
  const getDescription = (m: MimeType) =>
    locale === "ja" ? m.descriptionJa : m.descriptionEn;
  const getCommonUsage = (m: MimeType) =>
    locale === "ja" ? m.commonUsageJa : m.commonUsageEn;

  const hasResults = filteredGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("mimeTypes.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("mimeTypes.noResults")}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {MIME_CATEGORY_ORDER.map((category) => {
        const mimeTypes = filteredGroups.get(category);
        if (!mimeTypes || mimeTypes.length === 0) return null;

        const isCollapsed = collapsedCategories.has(category);
        const colors = CATEGORY_COLORS[category];

        return (
          <div
            key={category}
            className={`border rounded-lg overflow-hidden ${colors.bg}`}
          >
            {/* カテゴリヘッダー */}
            <button
              onClick={() => toggleCategory(category)}
              aria-expanded={!isCollapsed}
              aria-label={t(`mimeTypes.categories.${category}` as Parameters<typeof t>[0])}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}
                >
                  {t(
                    `mimeTypes.categories.${category}` as Parameters<typeof t>[0]
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {mimeTypes.length}
              </span>
            </button>

            {/* MIMEタイプ一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {mimeTypes.map((m) => {
                  const isExpanded = expandedMimeTypes.has(m.mimeType);

                  return (
                    <div key={m.mimeType}>
                      {/* MIMEタイプ行 */}
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                        <button
                          onClick={() => toggleMimeType(m.mimeType)}
                          aria-expanded={isExpanded}
                          aria-label={m.mimeType}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          )}
                          <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
                            {m.mimeType}
                          </code>
                          {/* 拡張子バッジ */}
                          <div className="flex items-center gap-1 shrink-0">
                            {m.extensions.map((ext) => (
                              <span
                                key={ext}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                {ext}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {getName(m)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
                            {getDescription(m)}
                          </span>
                        </button>

                        {/* コピーボタン（mimeTypeをコピー） */}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={
                            copiedId === `row-${m.mimeType}`
                              ? `${t("mimeTypes.copied")} ${m.mimeType}`
                              : `${t("mimeTypes.copy")} ${m.mimeType}`
                          }
                          className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                            copiedId === `row-${m.mimeType}`
                              ? "opacity-100 text-green-600 dark:text-green-400"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(m.mimeType, `row-${m.mimeType}`);
                          }}
                        >
                          {copiedId === `row-${m.mimeType}` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* 詳細（アコーディオン） */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 bg-gray-50/50 dark:bg-gray-900/20">
                          <div className="ml-6 space-y-2">
                            {/* 説明 */}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {getDescription(m)}
                            </p>

                            {/* 拡張子 */}
                            {m.extensions.length > 0 && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-500 dark:text-gray-400">
                                  {t("mimeTypes.extensions")}:{" "}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {m.extensions.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* 一般的な用途 */}
                            {getCommonUsage(m) && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-500 dark:text-gray-400">
                                  {t("mimeTypes.commonUsage")}:{" "}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {getCommonUsage(m)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
