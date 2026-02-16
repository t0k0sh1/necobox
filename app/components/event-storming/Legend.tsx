"use client";

import { SLOT_COLORS, type SlotType } from "@/lib/utils/event-storming";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useState } from "react";

const LEGEND_ITEMS: { type: SlotType | "hotspot"; label: string }[] = [
  { type: "events", label: "ドメインイベント" },
  { type: "commands", label: "コマンド" },
  { type: "aggregates", label: "集約" },
  { type: "actors", label: "アクター" },
  { type: "policies", label: "ポリシー" },
  { type: "views", label: "リードモデル / ビュー" },
  { type: "externalSystems", label: "外部システム" },
  { type: "hotspot", label: "ホットスポット" },
];

const SHORTCUT_HINTS = [
  { key: "Space + ドラッグ", desc: "キャンバスをパン" },
  { key: "ホイール", desc: "ズーム" },
  { key: "ダブルクリック", desc: "テキスト編集" },
  { key: "右クリック", desc: "ノート削除" },
  { key: "Delete", desc: "選択要素を削除" },
  { key: "⌘Z / Ctrl+Z", desc: "元に戻す" },
];

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow text-gray-600 dark:text-gray-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        凡例・操作ガイド
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
            付箋の色
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
            {LEGEND_ITEMS.map(({ type, label }) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                  style={{ backgroundColor: SLOT_COLORS[type].bg }}
                />
                <span className="text-[11px] text-gray-700 dark:text-gray-300">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* 操作ガイド */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            操作
          </p>
          <div className="space-y-0.5">
            {SHORTCUT_HINTS.map(({ key, desc }) => (
              <div key={key} className="flex items-baseline gap-2 text-[11px]">
                <kbd className="shrink-0 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-mono">
                  {key}
                </kbd>
                <span className="text-gray-600 dark:text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
