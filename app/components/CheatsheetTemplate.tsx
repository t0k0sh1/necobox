"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheatsheetState } from "@/lib/hooks/useCheatsheetState";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface CheatsheetTemplateProps<TCategory extends string, TItem> {
  config: CheatsheetConfig<TCategory, TItem>;
}

export function CheatsheetTemplate<TCategory extends string, TItem>({
  config,
}: CheatsheetTemplateProps<TCategory, TItem>) {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const prefix = config.translationPrefix;

  const {
    searchQuery,
    setSearchQuery,
    collapsedCategories,
    expandedItems,
    filteredGroups,
    toggleCategory,
    toggleItem,
    handleCopy,
    isCopied,
    hasResults,
  } = useCheatsheetState(config);

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t(
            `${prefix}.searchPlaceholder` as Parameters<typeof t>[0]
          )}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t(`${prefix}.noResults` as Parameters<typeof t>[0])}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {config.categoryOrder.map((category) => {
        const items = filteredGroups.get(category);
        if (!items || items.length === 0) return null;

        const isCollapsed = collapsedCategories.has(category);
        const colors = config.categoryColors[category];

        return (
          <div
            key={category}
            className={`border rounded-lg overflow-hidden ${colors.bg}`}
          >
            {/* カテゴリヘッダー */}
            <button
              onClick={() => toggleCategory(category)}
              aria-expanded={!isCollapsed}
              aria-label={t(
                `${prefix}.categories.${category}` as Parameters<typeof t>[0]
              )}
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
                    `${prefix}.categories.${category}` as Parameters<
                      typeof t
                    >[0]
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {items.length}
              </span>
            </button>

            {/* アイテム一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => {
                  const itemKey = config.getItemKey(item);
                  const isExpanded = expandedItems.has(itemKey);
                  const copyId = `row-${itemKey}`;

                  return (
                    <div key={itemKey}>
                      {/* アイテム行 */}
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                        <button
                          onClick={() => toggleItem(itemKey)}
                          aria-expanded={isExpanded}
                          aria-label={itemKey}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          )}
                          {config.renderItemContent(item, locale)}
                        </button>

                        {/* コピーボタン */}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={
                            isCopied(copyId)
                              ? `${t(`${prefix}.copied` as Parameters<typeof t>[0])} ${itemKey}`
                              : `${t(`${prefix}.copy` as Parameters<typeof t>[0])} ${itemKey}`
                          }
                          className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                            isCopied(copyId)
                              ? "opacity-100 text-green-600 dark:text-green-400"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(config.getCopyText(item), copyId);
                          }}
                        >
                          {isCopied(copyId) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* 詳細（アコーディオン） */}
                      {isExpanded && config.renderItemDetail && (
                        <div className="px-4 pb-3 pt-1 bg-gray-50/50 dark:bg-gray-900/20">
                          <div className="ml-6 space-y-2">
                            {config.renderItemDetail(
                              item,
                              locale,
                              (key: string) =>
                                t(
                                  `${prefix}.${key}` as Parameters<typeof t>[0]
                                ),
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
