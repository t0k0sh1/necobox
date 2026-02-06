"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_ORDER,
  getStatusCodesByCategory,
  type HttpStatusCategory,
  type HttpStatusCode,
} from "@/lib/data/http-status-codes";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

// カテゴリごとの色設定
const CATEGORY_COLORS: Record<
  HttpStatusCategory,
  { badge: string; bg: string }
> = {
  "1xx": {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  "2xx": {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  "3xx": {
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    bg: "border-yellow-200 dark:border-yellow-800",
  },
  "4xx": {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    bg: "border-orange-200 dark:border-orange-800",
  },
  "5xx": {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    bg: "border-red-200 dark:border-red-800",
  },
  non_standard: {
    badge:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    bg: "border-gray-200 dark:border-gray-700",
  },
};

const MDN_BASE_URLS: Record<string, string> = {
  en: "https://developer.mozilla.org/en-US/docs/",
  ja: "https://developer.mozilla.org/ja/docs/",
};

export function HttpStatusCheatsheet() {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<HttpStatusCategory>
  >(new Set());
  const [selectedCode, setSelectedCode] = useState<HttpStatusCode | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const groupedCodes = useMemo(() => getStatusCodesByCategory(), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedCodes;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<HttpStatusCategory, HttpStatusCode[]>();

    for (const [category, codes] of groupedCodes) {
      const matched = codes.filter(
        (code) =>
          code.code.toString().includes(query) ||
          code.nameEn.toLowerCase().includes(query) ||
          code.nameJa.includes(query) ||
          code.descriptionEn.toLowerCase().includes(query) ||
          code.descriptionJa.includes(query)
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedCodes, searchQuery]);

  const toggleCategory = (category: HttpStatusCategory) => {
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

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyDetail = async (code: HttpStatusCode) => {
    const isJa = locale === "ja";
    const name = isJa ? code.nameJa : code.nameEn;
    const description = isJa ? code.descriptionJa : code.descriptionEn;
    const example = isJa ? code.usageExampleJa : code.usageExampleEn;

    let text = `${code.code} ${code.nameEn} (${name})\n\n${description}`;
    if (example) {
      text += `\n\n${t("httpStatus.usageExample")}: ${example}`;
    }
    if (code.rfc) {
      text += `\n\n${code.rfc}: ${code.rfcUrl || ""}`;
    }
    if (code.mdnPath) {
      text += `\nMDN: ${MDN_BASE_URLS[locale] || MDN_BASE_URLS.en}${code.mdnPath}`;
    }

    await handleCopy(text, `detail-${code.code}`);
  };

  const getName = (code: HttpStatusCode) =>
    locale === "ja" ? code.nameJa : code.nameEn;
  const getDescription = (code: HttpStatusCode) =>
    locale === "ja" ? code.descriptionJa : code.descriptionEn;
  const getUsageExample = (code: HttpStatusCode) =>
    locale === "ja" ? code.usageExampleJa : code.usageExampleEn;

  const hasResults = filteredGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("httpStatus.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("httpStatus.noResults")}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {CATEGORY_ORDER.map((category) => {
        const codes = filteredGroups.get(category);
        if (!codes || codes.length === 0) return null;

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
              aria-label={`${t(`httpStatus.categories.${category}` as Parameters<typeof t>[0])} ${isCollapsed ? "expand" : "collapse"}`}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                  {category}
                </span>
                <span className="font-medium text-sm">
                  {t(`httpStatus.categories.${category}` as Parameters<typeof t>[0])}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {codes.length}
              </span>
            </button>

            {/* ステータスコード一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {codes.map((code) => (
                  <div
                    key={code.code}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group"
                  >
                    {/* コード番号（クリックで詳細） */}
                    <button
                      onClick={() => setSelectedCode(code)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold ${colors.badge}`}
                      >
                        {code.code}
                      </span>
                      <span className="font-medium text-sm truncate">
                        {code.nameEn}
                      </span>
                      {locale === "ja" && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:inline">
                          {code.nameJa}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
                        {getDescription(code)}
                      </span>
                    </button>

                    {/* コピーボタン */}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${t("httpStatus.copy")} ${code.code} ${code.nameEn}`}
                      className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        copiedId === `row-${code.code}`
                          ? "opacity-100 text-green-600 dark:text-green-400"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(
                          `${code.code} ${code.nameEn}`,
                          `row-${code.code}`
                        );
                      }}
                    >
                      {copiedId === `row-${code.code}` ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 詳細Dialog */}
      <Dialog
        open={selectedCode !== null}
        onOpenChange={(open) => !open && setSelectedCode(null)}
      >
        {selectedCode && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-sm font-mono font-bold ${
                    CATEGORY_COLORS[selectedCode.category].badge
                  }`}
                >
                  {selectedCode.code}
                </span>
                <span>{selectedCode.nameEn}</span>
              </DialogTitle>
              <DialogDescription>
                {getName(selectedCode)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* 説明 */}
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {t("httpStatus.description")}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getDescription(selectedCode)}
                </p>
              </div>

              {/* 使用例 */}
              {getUsageExample(selectedCode) && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {t("httpStatus.usageExample")}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded p-3">
                    {getUsageExample(selectedCode)}
                  </p>
                </div>
              )}

              {/* RFC */}
              {selectedCode.rfc && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {t("httpStatus.relatedRfc")}
                  </h4>
                  {selectedCode.rfcUrl ? (
                    <a
                      href={selectedCode.rfcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      {selectedCode.rfc}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCode.rfc}
                    </span>
                  )}
                </div>
              )}

              {/* MDN */}
              {selectedCode.mdnPath && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {t("httpStatus.mdnReference")}
                  </h4>
                  <a
                    href={`${MDN_BASE_URLS[locale] || MDN_BASE_URLS.en}${selectedCode.mdnPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {t("httpStatus.viewOnMdn")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* コピーボタン */}
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyDetail(selectedCode)}
                className={
                  copiedId === `detail-${selectedCode.code}`
                    ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                    : ""
                }
              >
                {copiedId === `detail-${selectedCode.code}` ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t("httpStatus.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {t("httpStatus.copyDetail")}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
