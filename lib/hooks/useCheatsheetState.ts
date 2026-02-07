"use client";

import type { CheatsheetConfig } from "@/lib/types/cheatsheet";
import { useCopyToClipboard } from "./useCopyToClipboard";
import { useMemo, useState } from "react";

export function useCheatsheetState<TCategory extends string, TItem>(
  config: CheatsheetConfig<TCategory, TItem>
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<TCategory>
  >(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { copy, isCopied } = useCopyToClipboard();

  const groupedData = useMemo(() => config.getGroupedData(), [config]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedData;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<TCategory, TItem[]>();

    for (const [category, items] of groupedData) {
      const matched = items.filter((item) =>
        config.getSearchableTexts(item).some((text) =>
          text.toLowerCase().includes(query)
        )
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedData, searchQuery, config]);

  const toggleCategory = (category: TCategory) => {
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

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    copy(text, id);
  };

  return {
    searchQuery,
    setSearchQuery,
    collapsedCategories,
    expandedItems,
    filteredGroups,
    toggleCategory,
    toggleItem,
    handleCopy,
    isCopied,
    hasResults: filteredGroups.size > 0,
  };
}
