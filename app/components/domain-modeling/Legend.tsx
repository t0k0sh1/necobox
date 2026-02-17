"use client";

import { SLOT_COLORS, type SlotType } from "@/lib/utils/domain-modeling";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const LEGEND_ITEMS: { type: SlotType | "hotspot"; i18nKey: string }[] = [
  { type: "events", i18nKey: "domainEvent" },
  { type: "commands", i18nKey: "command" },
  { type: "aggregates", i18nKey: "aggregate" },
  { type: "actors", i18nKey: "actor" },
  { type: "policies", i18nKey: "policy" },
  { type: "views", i18nKey: "readModelView" },
  { type: "externalSystems", i18nKey: "externalSystem" },
  { type: "hotspot", i18nKey: "hotspot" },
];

const SHORTCUT_KEYS = [
  { key: "Space + Drag", i18nKey: "panCanvas" },
  { key: "Wheel", i18nKey: "zoom" },
  { key: "Double-click", i18nKey: "editText" },
  { key: "Right-click", i18nKey: "deleteNote" },
  { key: "Delete", i18nKey: "deleteSelected" },
  { key: "\u2318Z / Ctrl+Z", i18nKey: "undo" },
];

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("domainModeling.legend");

  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow text-gray-600 dark:text-gray-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        {t("toggle")}
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1.5 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg w-[280px]">
          {/* 凡例 */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            {t("colors")}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
            {LEGEND_ITEMS.map(({ type, i18nKey }) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                  style={{ backgroundColor: SLOT_COLORS[type].bg }}
                />
                <span className="text-[11px] text-gray-700 dark:text-gray-300">
                  {t(i18nKey)}
                </span>
              </div>
            ))}
          </div>

          {/* 操作ガイド */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            {t("operations")}
          </p>
          <div className="space-y-0.5">
            {SHORTCUT_KEYS.map(({ key, i18nKey }) => (
              <div key={key} className="flex items-baseline gap-2 text-[11px]">
                <kbd className="shrink-0 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-mono">
                  {key}
                </kbd>
                <span className="text-gray-600 dark:text-gray-400">{t(i18nKey)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
