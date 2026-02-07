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
import { Label } from "@/components/ui/label";
import type { KnowledgeConfig, KnowledgeItem } from "@/lib/types/knowledge";
import { useKnowledgeState } from "@/lib/hooks/useKnowledgeState";
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

interface KnowledgeTemplateProps {
  config: KnowledgeConfig;
}

export function KnowledgeTemplate({ config }: KnowledgeTemplateProps) {
  const t = useTranslations("knowledgeHub");
  const locale = useLocale();
  const cheatsheetPath = config.cheatsheetPath ?? "/cheatsheets";

  const {
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
    hasResults,
  } = useKnowledgeState(config.items);

  const getSituation = (item: KnowledgeItem) =>
    locale === "ja" ? item.situationJa : item.situationEn;
  const getExplanation = (item: KnowledgeItem) =>
    locale === "ja" ? item.explanationJa : item.explanationEn;

  const isMultiline = (code: string) => code.includes("\n");

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
                            {isMultiline(snippet.code) ? (
                              <pre className="block text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 overflow-x-auto">
                                <code>{snippet.code}</code>
                              </pre>
                            ) : (
                              <code className="block text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 overflow-x-auto">
                                {snippet.code}
                              </code>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={
                                isCopied(snippetId)
                                  ? `${t("copied")} ${snippetLabel}`
                                  : `${t("copy")} ${snippetLabel}`
                              }
                              className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${
                                isCopied(snippetId)
                                  ? "opacity-100 text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCopyClick(snippet.code, snippetId)
                              }
                            >
                              {isCopied(snippetId) ? (
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
                  {item.hasRelatedCheatsheet && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        href={cheatsheetPath}
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
            {dialogPlaceholders.map((name) => {
              const inputId = `placeholder-${name}`;
              return (
                <div key={name} className="space-y-1">
                  <Label
                    htmlFor={inputId}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    {name}
                  </Label>
                  <Input
                    id={inputId}
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
              );
            })}
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
