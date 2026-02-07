"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  GIT_KNOWLEDGE,
  type KnowledgeItem,
} from "@/lib/data/git-knowledge";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// タグの色設定
const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// プレースホルダー（<...>形式）を抽出
const PLACEHOLDER_RE = /<([^>]+)>/g;

function extractPlaceholders(code: string): string[] {
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

function buildCommand(
  code: string,
  values: Record<string, string>
): string {
  return code.replace(PLACEHOLDER_RE, (_, name: string) => {
    const v = values[name]?.trim();
    return v || `<${name}>`;
  });
}

export function GitKnowledge() {
  const t = useTranslations("knowledgeHub");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // プレースホルダーモーダル用の状態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSnippetId, setDialogSnippetId] = useState<string | null>(null);
  const [dialogCode, setDialogCode] = useState("");
  const [dialogPlaceholders, setDialogPlaceholders] = useState<string[]>([]);
  const [dialogValues, setDialogValues] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return GIT_KNOWLEDGE;

    const query = searchQuery.toLowerCase().trim();
    return GIT_KNOWLEDGE.filter(
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
  }, [searchQuery]);

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

  const performCopy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        setCopiedId(id);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    []
  );

  const handleCopyClick = useCallback(
    (code: string, snippetId: string) => {
      const placeholders = extractPlaceholders(code);
      if (placeholders.length === 0) {
        performCopy(code, snippetId);
      } else {
        setDialogCode(code);
        setDialogSnippetId(snippetId);
        setDialogPlaceholders(placeholders);
        setDialogValues({});
        setDialogOpen(true);
      }
    },
    [performCopy]
  );

  const handleDialogCopy = useCallback(() => {
    if (!dialogSnippetId) return;
    const result = buildCommand(dialogCode, dialogValues);
    performCopy(result, dialogSnippetId);
    setDialogOpen(false);
  }, [dialogCode, dialogValues, dialogSnippetId, performCopy]);

  const getSituation = (item: KnowledgeItem) =>
    locale === "ja" ? item.situationJa : item.situationEn;
  const getExplanation = (item: KnowledgeItem) =>
    locale === "ja" ? item.explanationJa : item.explanationEn;

  const hasResults = filteredItems.length > 0;
  const previewCommand = buildCommand(dialogCode, dialogValues);

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("noResults")}
        </div>
      )}

      {/* カード一覧 */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isExpanded = expandedItems.has(item.id);

          return (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700"
            >
              {/* カードヘッダー */}
              <button
                onClick={() => toggleItem(item.id)}
                aria-expanded={isExpanded}
                aria-label={getSituation(item)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
                )}
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-1">
                  {getSituation(item)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              {/* カードボディ */}
              {isExpanded && (
                <div className="px-4 py-4 space-y-4 bg-white dark:bg-black">
                  {/* 解説テキスト */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {getExplanation(item)}
                  </p>

                  {/* スニペット群 */}
                  <div className="space-y-3">
                    {item.snippets.map((snippet, idx) => {
                      const snippetId = `${item.id}-${idx}`;
                      const snippetLabel =
                        locale === "ja" ? snippet.labelJa : snippet.labelEn;
                      const snippetNote =
                        locale === "ja" ? snippet.noteJa : snippet.noteEn;

                      return (
                        <div key={snippetId} className="space-y-1">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {snippetLabel}
                          </div>
                          <div className="relative group">
                            <code className="block text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 overflow-x-auto">
                              {snippet.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={
                                copiedId === snippetId
                                  ? `${t("copied")} ${snippet.code}`
                                  : `${t("copy")} ${snippet.code}`
                              }
                              className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                                copiedId === snippetId
                                  ? "opacity-100 text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCopyClick(snippet.code, snippetId)
                              }
                            >
                              {copiedId === snippetId ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                          {snippetNote && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                              {snippetNote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* チートシートへのリンク */}
                  {item.relatedCheatsheetTab && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        href="/cheatsheets"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {t("viewCheatsheet")}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* プレースホルダー入力モーダル */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("placeholderDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("placeholderDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {dialogPlaceholders.map((name) => (
              <div key={name} className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {name}
                </label>
                <Input
                  type="text"
                  placeholder={`<${name}>`}
                  value={dialogValues[name] ?? ""}
                  onChange={(e) =>
                    setDialogValues((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          {/* プレビュー */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("placeholderDialog.preview")}
            </div>
            <code className="block text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-gray-900 dark:text-gray-100 break-all">
              {previewCommand}
            </code>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("placeholderDialog.cancel")}
            </Button>
            <Button onClick={handleDialogCopy}>
              <Copy className="w-4 h-4 mr-2" />
              {t("placeholderDialog.copyCommand")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
