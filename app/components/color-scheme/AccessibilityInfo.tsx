"use client";

import type { SchemeColor, ContrastPair } from "@/lib/utils/color-scheme-designer";
import { calculateContrastPairs } from "@/lib/utils/color-scheme-designer";
import { useMemo } from "react";

interface AccessibilityInfoProps {
  colors: SchemeColor[];
}

export function AccessibilityInfo({ colors }: AccessibilityInfoProps) {
  const pairs = useMemo(
    () => calculateContrastPairs(colors),
    [colors]
  );

  return (
    <div className="space-y-2">
      <div className="max-h-60 overflow-y-auto space-y-1.5">
        {pairs.map((pair, i) => (
          <ContrastPairRow key={i} pair={pair} />
        ))}
      </div>
    </div>
  );
}

function ContrastPairRow({
  pair,
}: {
  pair: ContrastPair;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {/* プレビュー */}
      <div
        className="w-8 h-6 rounded border flex items-center justify-center text-[8px] font-bold shrink-0"
        style={{ backgroundColor: pair.bgHex, color: pair.fgHex }}
      >
        Aa
      </div>

      {/* 組み合わせ名 */}
      <div className="flex-1 min-w-0 truncate text-gray-600 dark:text-gray-400">
        {pair.fgName} / {pair.bgName}
      </div>

      {/* コントラスト比 */}
      <span className="font-mono text-[10px] shrink-0 w-12 text-right">
        {pair.ratio.toFixed(1)}:1
      </span>

      {/* WCAG バッジ */}
      <span
        className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
          pair.wcagAA
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
        }`}
      >
        AA
      </span>
      <span
        className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
          pair.wcagAAA
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
        }`}
      >
        AAA
      </span>
    </div>
  );
}
