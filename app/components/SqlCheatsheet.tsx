"use client";

import { CheatsheetTemplate } from "@/app/components/CheatsheetTemplate";
import {
  SQL_CATEGORY_ORDER,
  getSqlSyntaxByCategory,
  type SqlSyntax,
  type SqlSyntaxCategory,
} from "@/lib/data/sql-syntax";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";

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

const config: CheatsheetConfig<SqlSyntaxCategory, SqlSyntax> = {
  categoryOrder: SQL_CATEGORY_ORDER,
  getGroupedData: getSqlSyntaxByCategory,
  categoryColors: CATEGORY_COLORS,
  translationPrefix: "sqlSyntax",
  getSearchableTexts: (s) => [
    s.syntax,
    s.nameEn,
    s.nameJa,
    s.descriptionEn,
    s.descriptionJa,
    s.exampleSql,
  ],
  getItemKey: (s) => s.syntax,
  getCopyText: (s) => s.syntax,
  renderItemContent: (s, locale) => (
    <>
      <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
        {s.syntax}
      </code>
      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
        {locale === "ja" ? s.nameJa : s.nameEn}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
        {locale === "ja" ? s.descriptionJa : s.descriptionEn}
      </span>
    </>
  ),
  renderItemDetail: (s, locale, t) => (
    <>
      {/* 説明 */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {locale === "ja" ? s.descriptionJa : s.descriptionEn}
      </p>

      {/* SQLサンプル */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("example")}
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
            {t("notes")}
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            {locale === "ja" ? s.notes.ja : s.notes.en}
          </p>
        </div>
      )}
    </>
  ),
};

export function SqlCheatsheet() {
  return <CheatsheetTemplate config={config} />;
}
