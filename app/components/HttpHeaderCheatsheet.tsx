"use client";

import { CheatsheetTemplate } from "@/app/components/CheatsheetTemplate";
import {
  HTTP_HEADER_CATEGORY_ORDER,
  getHttpHeadersByCategory,
  type HttpHeader,
  type HttpHeaderCategory,
} from "@/lib/data/http-headers";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";
import { ExternalLink } from "lucide-react";

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

const DIRECTION_COLORS: Record<HttpHeader["direction"], string> = {
  request:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  response:
    "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  both:
    "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

const DIRECTION_LABELS: Record<HttpHeader["direction"], string> = {
  request: "Req",
  response: "Res",
  both: "Both",
};

const config: CheatsheetConfig<HttpHeaderCategory, HttpHeader> = {
  categoryOrder: HTTP_HEADER_CATEGORY_ORDER,
  getGroupedData: getHttpHeadersByCategory,
  categoryColors: CATEGORY_COLORS,
  translationPrefix: "httpHeaders",
  getSearchableTexts: (h) => [
    h.header,
    h.nameEn,
    h.nameJa,
    h.descriptionEn,
    h.descriptionJa,
    h.exampleValue,
  ],
  getItemKey: (h) => h.header,
  getCopyText: (h) => h.header,
  renderItemContent: (h, locale) => (
    <>
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
        {locale === "ja" ? h.nameJa : h.nameEn}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
        {locale === "ja" ? h.descriptionJa : h.descriptionEn}
      </span>
    </>
  ),
  renderItemDetail: (h, locale, t) => (
    <>
      {/* 説明 */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {locale === "ja" ? h.descriptionJa : h.descriptionEn}
      </p>

      {/* 例 */}
      <div className="text-xs">
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {t("example")}:{" "}
        </span>
        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
          {h.exampleValue}
        </code>
      </div>

      {/* MDNリンク */}
      {h.mdnPath && (
        <a
          href={`https://developer.mozilla.org/${locale === "ja" ? "ja" : "en-US"}/docs/${h.mdnPath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {t("viewOnMdn")}
        </a>
      )}
    </>
  ),
};

export function HttpHeaderCheatsheet() {
  return <CheatsheetTemplate config={config} />;
}
