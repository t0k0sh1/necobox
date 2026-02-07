"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SQL_CATEGORY_ORDER,
  getSqlSyntaxByCategory,
  type SqlSyntax,
  type SqlSyntaxCategory,
} from "@/lib/data/sql-syntax";
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
  SqlSyntaxCategory,
  { badge: string; bg: string }
> = {
  select: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  join: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  aggregate: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  subquery: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  window_function: {
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    bg: "border-teal-200 dark:border-teal-800",
  },
  dml: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  ddl: {
    badge:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    bg: "border-red-200 dark:border-red-800",
  },
  constraint: {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    bg: "border-orange-200 dark:border-orange-800",
  },
};

export function SqlCheatsheet() {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<SqlSyntaxCategory>
  >(new Set());
  const [expandedSyntaxes, setExpandedSyntaxes] = useState<Set<string>>(
    new Set()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const groupedSyntaxes = useMemo(() => getSqlSyntaxByCategory(), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedSyntaxes;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<SqlSyntaxCategory, SqlSyntax[]>();

    for (const [category, syntaxes] of groupedSyntaxes) {
      const matched = syntaxes.filter(
        (s) =>
          s.syntax.toLowerCase().includes(query) ||
          s.nameEn.toLowerCase().includes(query) ||
          s.nameJa.includes(query) ||
          s.descriptionEn.toLowerCase().includes(query) ||
          s.descriptionJa.includes(query) ||
          s.exampleSql.toLowerCase().includes(query)
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedSyntaxes, searchQuery]);

  const toggleCategory = (category: SqlSyntaxCategory) => {
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

  const toggleSyntax = (syntax: string) => {
    setExpandedSyntaxes((prev) => {
      const next = new Set(prev);
      if (next.has(syntax)) {
        next.delete(syntax);
      } else {
        next.add(syntax);
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

  const getName = (s: SqlSyntax) =>
    locale === "ja" ? s.nameJa : s.nameEn;
  const getDescription = (s: SqlSyntax) =>
    locale === "ja" ? s.descriptionJa : s.descriptionEn;

  const hasResults = filteredGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("sqlSyntax.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("sqlSyntax.noResults")}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {SQL_CATEGORY_ORDER.map((category) => {
        const syntaxes = filteredGroups.get(category);
        if (!syntaxes || syntaxes.length === 0) return null;

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
              aria-label={t(`sqlSyntax.categories.${category}` as Parameters<typeof t>[0])}
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
                    `sqlSyntax.categories.${category}` as Parameters<typeof t>[0]
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {syntaxes.length}
              </span>
            </button>

            {/* 構文一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {syntaxes.map((s) => {
                  const isExpanded = expandedSyntaxes.has(s.syntax);

                  return (
                    <div key={s.syntax}>
                      {/* 構文行 */}
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                        <button
                          onClick={() => toggleSyntax(s.syntax)}
                          aria-expanded={isExpanded}
                          aria-label={s.syntax}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          )}
                          <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
                            {s.syntax}
                          </code>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {getName(s)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
                            {getDescription(s)}
                          </span>
                        </button>

                        {/* コピーボタン */}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={
                            copiedId === `row-${s.syntax}`
                              ? `${t("sqlSyntax.copied")} ${s.syntax}`
                              : `${t("sqlSyntax.copy")} ${s.syntax}`
                          }
                          className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                            copiedId === `row-${s.syntax}`
                              ? "opacity-100 text-green-600 dark:text-green-400"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(s.syntax, `row-${s.syntax}`);
                          }}
                        >
                          {copiedId === `row-${s.syntax}` ? (
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
                              {getDescription(s)}
                            </p>

                            {/* SQLサンプル */}
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t("sqlSyntax.example")}
                              </div>
                              <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                <code className="text-gray-800 dark:text-gray-200">
                                  {s.exampleSql}
                                </code>
                              </pre>
                            </div>

                            {/* 補足 */}
                            {s.notes && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                                <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-0.5">
                                  {t("sqlSyntax.notes")}
                                </div>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                  {locale === "ja" ? s.notes.ja : s.notes.en}
                                </p>
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
