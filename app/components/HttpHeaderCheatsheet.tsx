"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HTTP_HEADER_CATEGORY_ORDER,
  getHttpHeadersByCategory,
  type HttpHeader,
  type HttpHeaderCategory,
} from "@/lib/data/http-headers";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// カテゴリごとの色設定
const CATEGORY_COLORS: Record<
  HttpHeaderCategory,
  { badge: string; bg: string }
> = {
  request_general: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  response_general: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  caching: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  security: {
    badge:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    bg: "border-red-200 dark:border-red-800",
  },
  cors: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  content_negotiation: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  authentication: {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    bg: "border-orange-200 dark:border-orange-800",
  },
};

// directionバッジの色設定
const DIRECTION_COLORS: Record<string, string> = {
  request:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  response:
    "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  both:
    "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

const DIRECTION_LABELS: Record<string, string> = {
  request: "Req",
  response: "Res",
  both: "Both",
};

export function HttpHeaderCheatsheet() {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<HttpHeaderCategory>
  >(new Set());
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(
    new Set()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const groupedHeaders = useMemo(() => getHttpHeadersByCategory(), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedHeaders;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<HttpHeaderCategory, HttpHeader[]>();

    for (const [category, headers] of groupedHeaders) {
      const matched = headers.filter(
        (h) =>
          h.header.toLowerCase().includes(query) ||
          h.nameEn.toLowerCase().includes(query) ||
          h.nameJa.includes(query) ||
          h.descriptionEn.toLowerCase().includes(query) ||
          h.descriptionJa.includes(query) ||
          h.exampleValue.toLowerCase().includes(query)
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedHeaders, searchQuery]);

  const toggleCategory = (category: HttpHeaderCategory) => {
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

  const toggleHeader = (header: string) => {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(header)) {
        next.delete(header);
      } else {
        next.add(header);
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

  const getName = (h: HttpHeader) =>
    locale === "ja" ? h.nameJa : h.nameEn;
  const getDescription = (h: HttpHeader) =>
    locale === "ja" ? h.descriptionJa : h.descriptionEn;

  const hasResults = filteredGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("httpHeaders.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("httpHeaders.noResults")}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {HTTP_HEADER_CATEGORY_ORDER.map((category) => {
        const headers = filteredGroups.get(category);
        if (!headers || headers.length === 0) return null;

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
              aria-label={t(`httpHeaders.categories.${category}` as Parameters<typeof t>[0])}
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
                    `httpHeaders.categories.${category}` as Parameters<typeof t>[0]
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {headers.length}
              </span>
            </button>

            {/* ヘッダー一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {headers.map((h) => {
                  const isExpanded = expandedHeaders.has(h.header);

                  return (
                    <div key={h.header}>
                      {/* ヘッダー行 */}
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                        <button
                          onClick={() => toggleHeader(h.header)}
                          aria-expanded={isExpanded}
                          aria-label={h.header}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          )}
                          <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
                            {h.header}
                          </code>
                          {/* directionバッジ */}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${DIRECTION_COLORS[h.direction]}`}
                          >
                            {DIRECTION_LABELS[h.direction]}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {getName(h)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
                            {getDescription(h)}
                          </span>
                        </button>

                        {/* コピーボタン */}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={
                            copiedId === `row-${h.header}`
                              ? `${t("httpHeaders.copied")} ${h.header}`
                              : `${t("httpHeaders.copy")} ${h.header}`
                          }
                          className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                            copiedId === `row-${h.header}`
                              ? "opacity-100 text-green-600 dark:text-green-400"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(h.header, `row-${h.header}`);
                          }}
                        >
                          {copiedId === `row-${h.header}` ? (
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
                              {getDescription(h)}
                            </p>

                            {/* 例 */}
                            <div className="text-xs">
                              <span className="font-medium text-gray-500 dark:text-gray-400">
                                {t("httpHeaders.example")}:{" "}
                              </span>
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
                                {h.exampleValue}
                              </code>
                            </div>

                            {/* MDNリンク */}
                            {h.mdnPath && (
                              <a
                                href={`https://developer.mozilla.org/${locale}/docs/${h.mdnPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {t("httpHeaders.viewOnMdn")}
                              </a>
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
