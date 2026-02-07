"use client";

import { CheatsheetTemplate } from "@/app/components/CheatsheetTemplate";
import {
  MIME_CATEGORY_ORDER,
  getMimeTypesByCategory,
  type MimeCategory,
  type MimeType,
} from "@/lib/data/mime-types";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";

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

const config: CheatsheetConfig<MimeCategory, MimeType> = {
  categoryOrder: MIME_CATEGORY_ORDER,
  getGroupedData: getMimeTypesByCategory,
  categoryColors: CATEGORY_COLORS,
  translationPrefix: "mimeTypes",
  getSearchableTexts: (m) => [
    m.mimeType,
    m.nameEn,
    m.nameJa,
    m.descriptionEn,
    m.descriptionJa,
    ...m.extensions,
  ],
  getItemKey: (m) => m.mimeType,
  getCopyText: (m) => m.mimeType,
  renderItemContent: (m, locale) => (
    <>
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
        {locale === "ja" ? m.nameJa : m.nameEn}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
        {locale === "ja" ? m.descriptionJa : m.descriptionEn}
      </span>
    </>
  ),
  renderItemDetail: (m, locale, t) => {
    const commonUsage = locale === "ja" ? m.commonUsageJa : m.commonUsageEn;
    return (
      <>
        {/* 説明 */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {locale === "ja" ? m.descriptionJa : m.descriptionEn}
        </p>

        {/* 拡張子 */}
        {m.extensions.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-500 dark:text-gray-400">
              {t("extensions")}:{" "}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {m.extensions.join(", ")}
            </span>
          </div>
        )}

        {/* 一般的な用途 */}
        {commonUsage && (
          <div className="text-xs">
            <span className="font-medium text-gray-500 dark:text-gray-400">
              {t("commonUsage")}:{" "}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {commonUsage}
            </span>
          </div>
        )}
      </>
    );
  },
};

export function MimeTypeCheatsheet() {
  return <CheatsheetTemplate config={config} />;
}
