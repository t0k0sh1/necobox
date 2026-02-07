"use client";

import { CheatsheetTemplate } from "@/app/components/CheatsheetTemplate";
import {
  MARKDOWN_CATEGORY_ORDER,
  getMarkdownSyntaxByCategory,
  type MarkdownCategory,
  type MarkdownSyntax,
} from "@/lib/data/markdown-syntax";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";

const CATEGORY_COLORS: Record<
  MarkdownCategory,
  { badge: string; bg: string }
> = {
  headings: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  emphasis: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  lists: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  links_images: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  code: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  tables: {
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    bg: "border-teal-200 dark:border-teal-800",
  },
  blockquotes: {
    badge:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    bg: "border-gray-200 dark:border-gray-700",
  },
  gfm_extensions: {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    bg: "border-orange-200 dark:border-orange-800",
  },
};

const config: CheatsheetConfig<MarkdownCategory, MarkdownSyntax> = {
  categoryOrder: MARKDOWN_CATEGORY_ORDER,
  getGroupedData: getMarkdownSyntaxByCategory,
  categoryColors: CATEGORY_COLORS,
  translationPrefix: "markdownSyntax",
  getSearchableTexts: (s) => [
    s.syntax,
    s.nameEn,
    s.nameJa,
    s.descriptionEn,
    s.descriptionJa,
    s.markdownSource,
  ],
  getItemKey: (s) => s.syntax,
  getCopyText: (s) => s.markdownSource,
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
    <div className="space-y-3">
      {/* 説明 */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {locale === "ja" ? s.descriptionJa : s.descriptionEn}
      </p>

      {/* ソース */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("source")}
        </div>
        <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
          {s.markdownSource}
        </pre>
      </div>

      {/* プレビュー（renderedHtmlをテキスト表示） */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("preview")}
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
          <code className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
            {s.renderedHtml}
          </code>
        </div>
      </div>
    </div>
  ),
};

export function MarkdownCheatsheet() {
  return <CheatsheetTemplate config={config} />;
}
