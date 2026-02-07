"use client";

import type { KnowledgeItem } from "@/lib/types/knowledge";
import { useCopyToClipboard } from "./useCopyToClipboard";
import { useCallback, useMemo, useState } from "react";

// プレースホルダー（<...>形式）を抽出
// 識別子文字の直後の <...> はジェネリクス（例: List<String>）なので除外
const PLACEHOLDER_RE = /(?<![A-Za-z0-9_])<([^>]+)>/g;

export function extractPlaceholders(code: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(code)) !== null) {
    if (!matches.includes(m[1])) {
      matches.push(m[1]);
    }
  }
  PLACEHOLDER_RE.lastIndex = 0;
  return matches;
}

export function buildCommand(
  code: string,
  values: Record<string, string>
): string {
  return code.replace(PLACEHOLDER_RE, (_, name: string) => {
    const v = values[name]?.trim();
    return v || `<${name}>`;
  });
}

export function useKnowledgeState(items: KnowledgeItem[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { copy, isCopied } = useCopyToClipboard();

  // プレースホルダーモーダル用の状態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSnippetId, setDialogSnippetId] = useState<string | null>(null);
  const [dialogCode, setDialogCode] = useState("");
  const [dialogPlaceholders, setDialogPlaceholders] = useState<string[]>([]);
  const [dialogValues, setDialogValues] = useState<Record<string, string>>({});

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.situationEn.toLowerCase().includes(query) ||
        item.situationJa.includes(query) ||
        item.explanationEn.toLowerCase().includes(query) ||
        item.explanationJa.includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.snippets.some(
          (s) =>
            s.code.toLowerCase().includes(query) ||
            s.labelEn.toLowerCase().includes(query) ||
            s.labelJa.includes(query)
        )
    );
  }, [searchQuery, items]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyClick = useCallback(
    (code: string, snippetId: string) => {
      const placeholders = extractPlaceholders(code);
      if (placeholders.length === 0) {
        copy(code, snippetId);
      } else {
        setDialogCode(code);
        setDialogSnippetId(snippetId);
        setDialogPlaceholders(placeholders);
        setDialogValues({});
        setDialogOpen(true);
      }
    },
    [copy]
  );

  const handleDialogCopy = useCallback(() => {
    if (!dialogSnippetId) return;
    const result = buildCommand(dialogCode, dialogValues);
    copy(result, dialogSnippetId);
    setDialogOpen(false);
  }, [dialogCode, dialogValues, dialogSnippetId, copy]);

  const previewCommand = buildCommand(dialogCode, dialogValues);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    expandedItems,
    toggleItem,
    isCopied,
    handleCopyClick,
    dialogOpen,
    setDialogOpen,
    dialogPlaceholders,
    dialogValues,
    setDialogValues,
    handleDialogCopy,
    previewCommand,
    hasResults: filteredItems.length > 0,
  };
}
