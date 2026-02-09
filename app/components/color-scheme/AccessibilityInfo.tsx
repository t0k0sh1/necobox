"use client";

import type { SchemeColor, ContrastPair } from "@/lib/utils/color-scheme-designer";
import { calculateContrastPairs } from "@/lib/utils/color-scheme-designer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface AccessibilityInfoProps {
  colors: SchemeColor[];
}

export function AccessibilityInfo({ colors }: AccessibilityInfoProps) {
  const t = useTranslations("colorSchemeDesigner.accessibilityInfo");
  const pairs = useMemo(
    () => calculateContrastPairs(colors),
    [colors]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        {/* 説明ポップオーバー */}
        <div className="flex items-start gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{t("description")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3 space-y-2.5 text-xs" align="start">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {t("aaTitle")}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {t("aaDescription")}
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {t("aaaTitle")}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {t("aaaDescription")}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {pairs.length === 0 ? (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {t("noPairs")}
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1.5">
            {pairs.map((pair, i) => (
              <ContrastPairRow key={i} pair={pair} t={t} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function ContrastPairRow({
  pair,
  t,
}: {
  pair: ContrastPair;
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner.accessibilityInfo">>;
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

      {/* WCAG AA バッジ */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
              pair.wcagAA
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {pair.wcagAA ? (
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
            ) : (
              <X className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            AA
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {pair.wcagAA ? t("aaTooltipPass") : t("aaTooltipFail")}
        </TooltipContent>
      </Tooltip>

      {/* WCAG AAA バッジ */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
              pair.wcagAAA
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {pair.wcagAAA ? (
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
            ) : (
              <X className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            AAA
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {pair.wcagAAA ? t("aaaTooltipPass") : t("aaaTooltipFail")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
