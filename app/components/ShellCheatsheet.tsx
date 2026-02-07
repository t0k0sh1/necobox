"use client";

import { CheatsheetTemplate } from "@/app/components/CheatsheetTemplate";
import {
  SHELL_CATEGORY_ORDER,
  getShellCommandsByCategory,
  type ShellCommand,
  type ShellCommandCategory,
} from "@/lib/data/shell-commands";
import type { CheatsheetConfig } from "@/lib/types/cheatsheet";

const CATEGORY_COLORS: Record<
  ShellCommandCategory,
  { badge: string; bg: string }
> = {
  file_operations: {
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bg: "border-blue-200 dark:border-blue-800",
  },
  text_processing: {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    bg: "border-purple-200 dark:border-purple-800",
  },
  process_management: {
    badge:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    bg: "border-red-200 dark:border-red-800",
  },
  permissions: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bg: "border-amber-200 dark:border-amber-800",
  },
  networking: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bg: "border-green-200 dark:border-green-800",
  },
  compression: {
    badge:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    bg: "border-cyan-200 dark:border-cyan-800",
  },
  system_info: {
    badge:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    bg: "border-gray-200 dark:border-gray-700",
  },
  pipe_redirect: {
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    bg: "border-teal-200 dark:border-teal-800",
  },
};

const config: CheatsheetConfig<ShellCommandCategory, ShellCommand> = {
  categoryOrder: SHELL_CATEGORY_ORDER,
  getGroupedData: getShellCommandsByCategory,
  categoryColors: CATEGORY_COLORS,
  translationPrefix: "shellCommands",
  getSearchableTexts: (cmd) => [
    cmd.command,
    cmd.nameEn,
    cmd.nameJa,
    cmd.descriptionEn,
    cmd.descriptionJa,
    ...cmd.options.flatMap((opt) => [
      opt.flag,
      opt.descriptionEn,
      opt.descriptionJa,
    ]),
  ],
  getItemKey: (cmd) => cmd.command,
  getCopyText: (cmd) => cmd.command,
  renderItemContent: (cmd, locale) => (
    <>
      <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 shrink-0">
        {cmd.command}
      </code>
      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
        {locale === "ja" ? cmd.nameJa : cmd.nameEn}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:inline flex-1">
        {locale === "ja" ? cmd.descriptionJa : cmd.descriptionEn}
      </span>
    </>
  ),
  renderItemDetail: (cmd, locale, t) =>
    cmd.options.length > 0 ? (
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          {t("options")} ({cmd.options.length})
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
              {locale === "ja" ? opt.descriptionJa : opt.descriptionEn}
            </span>
          </div>
        ))}
      </div>
    ) : null,
};

export function ShellCheatsheet() {
  return <CheatsheetTemplate config={config} />;
}
