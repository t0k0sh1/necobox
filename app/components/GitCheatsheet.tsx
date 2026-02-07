"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GIT_CATEGORY_ORDER,
  getGitCommandsByCategory,
  type GitCommand,
  type GitCommandCategory,
} from "@/lib/data/git-commands";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

// カテゴリごとの色設定
const CATEGORY_COLORS: Record<
  GitCommandCategory,
  { badge: string; bg: string }
> = {
  basics: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  branching: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  diff_history: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  remote: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  stash: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  reset_undo: {
    badge:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    bg: "border-red-200 dark:border-red-800",
  },
  tag: {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    bg: "border-orange-200 dark:border-orange-800",
  },
  worktree: {
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    bg: "border-teal-200 dark:border-teal-800",
  },
  config: {
    badge:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    bg: "border-gray-200 dark:border-gray-700",
  },
};

export function GitCheatsheet() {
  const t = useTranslations("cheatsheets");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<GitCommandCategory>
  >(new Set());
  const [expandedCommands, setExpandedCommands] = useState<Set<string>>(
    new Set()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const groupedCommands = useMemo(() => getGitCommandsByCategory(), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedCommands;

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<GitCommandCategory, GitCommand[]>();

    for (const [category, commands] of groupedCommands) {
      const matched = commands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(query) ||
          cmd.nameEn.toLowerCase().includes(query) ||
          cmd.nameJa.includes(query) ||
          cmd.descriptionEn.toLowerCase().includes(query) ||
          cmd.descriptionJa.includes(query) ||
          cmd.options.some(
            (opt) =>
              opt.flag.toLowerCase().includes(query) ||
              opt.descriptionEn.toLowerCase().includes(query) ||
              opt.descriptionJa.includes(query)
          )
      );
      if (matched.length > 0) {
        filtered.set(category, matched);
      }
    }

    return filtered;
  }, [groupedCommands, searchQuery]);

  const toggleCategory = (category: GitCommandCategory) => {
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

  const toggleCommand = (command: string) => {
    setExpandedCommands((prev) => {
      const next = new Set(prev);
      if (next.has(command)) {
        next.delete(command);
      } else {
        next.add(command);
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

  const getName = (cmd: GitCommand) =>
    locale === "ja" ? cmd.nameJa : cmd.nameEn;
  const getDescription = (cmd: GitCommand) =>
    locale === "ja" ? cmd.descriptionJa : cmd.descriptionEn;

  const hasResults = filteredGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("gitCommands.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 検索結果なし */}
      {!hasResults && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("gitCommands.noResults")}
        </div>
      )}

      {/* カテゴリごとのリスト */}
      {GIT_CATEGORY_ORDER.map((category) => {
        const commands = filteredGroups.get(category);
        if (!commands || commands.length === 0) return null;

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
              aria-label={`${t(`gitCommands.categories.${category}` as Parameters<typeof t>[0])} ${isCollapsed ? "expand" : "collapse"}`}
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
                    `gitCommands.categories.${category}` as Parameters<typeof t>[0]
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {commands.length}
              </span>
            </button>

            {/* コマンド一覧 */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {commands.map((cmd) => {
                  const isExpanded = expandedCommands.has(cmd.command);

                  return (
                    <div key={cmd.command}>
                      {/* コマンド行 */}
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                        <button
                          onClick={() => toggleCommand(cmd.command)}
                          aria-expanded={isExpanded}
                          aria-label={`${cmd.command} ${isExpanded ? "collapse" : "expand"}`}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          )}
                          <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
                            {cmd.command}
                          </code>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {getName(cmd)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
                            {getDescription(cmd)}
                          </span>
                        </button>

                        {/* コピーボタン */}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`${t("gitCommands.copy")} ${cmd.command}`}
                          className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                            copiedId === `row-${cmd.command}`
                              ? "opacity-100 text-green-600 dark:text-green-400"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(cmd.command, `row-${cmd.command}`);
                          }}
                        >
                          {copiedId === `row-${cmd.command}` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* オプション一覧（アコーディオン） */}
                      {isExpanded && cmd.options.length > 0 && (
                        <div className="px-4 pb-3 pt-1 bg-gray-50/50 dark:bg-gray-900/20">
                          <div className="ml-6 space-y-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                              {t("gitCommands.options")} ({cmd.options.length})
                            </div>
                            {cmd.options.map((opt) => (
                              <div
                                key={opt.flag}
                                className="flex items-start gap-3 py-1.5 group/option"
                              >
                                <code className="text-xs font-mono text-blue-600 dark:text-blue-400 shrink-0 min-w-0 break-all">
                                  {opt.flag}
                                </code>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {locale === "ja"
                                    ? opt.descriptionJa
                                    : opt.descriptionEn}
                                </span>
                              </div>
                            ))}
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
