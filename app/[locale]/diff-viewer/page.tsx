"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { computeDiff, type DiffResult } from "@/lib/utils/diff-viewer";
import {
  DiffDisplay,
  type DiffViewMode,
} from "@/app/components/DiffDisplay";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { formatUnifiedDiff } from "@/lib/utils/diff-viewer";

const VIEW_MODES: DiffViewMode[] = ["side-by-side", "inline", "unified"];

export default function DiffViewerPage() {
  const t = useTranslations("diffViewer");
  const tCommon = useTranslations("common");

  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [viewMode, setViewMode] = useState<DiffViewMode>("side-by-side");
  const [copied, setCopied] = useState(false);

  // 差分計算
  const result = useMemo<DiffResult | null>(() => {
    if (!before && !after) return null;
    return computeDiff(before, after);
  }, [before, after]);

  // コピー（unified diff 形式）
  const handleCopy = async () => {
    if (!result) return;
    const text = formatUnifiedDiff(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />

        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* 入力エリア */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("before")}</Label>
              <textarea
                value={before}
                onChange={(e) => setBefore(e.target.value)}
                placeholder={t("beforePlaceholder")}
                className="w-full min-h-[200px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("before")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("after")}</Label>
              <textarea
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                placeholder={t("afterPlaceholder")}
                className="w-full min-h-[200px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("after")}
              />
            </div>
          </div>

          {/* ツールバー */}
          <div className="flex flex-wrap items-center gap-4">
            {/* 表示モード切替 */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              {VIEW_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                >
                  {t(`mode.${mode}` as Parameters<typeof t>[0])}
                </Button>
              ))}
            </div>

            {/* コピー */}
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? tCommon("copied") : tCommon("copy")}
              </Button>
            )}

            {/* 統計 */}
            {result && (
              <div className="flex gap-3 text-sm font-mono ml-auto">
                <span className="text-green-600 dark:text-green-400">
                  +{result.stats.addedLines}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  -{result.stats.removedLines}
                </span>
                <span className="text-gray-500">
                  ={result.stats.unchangedLines}
                </span>
              </div>
            )}
          </div>

          {/* 差分表示 */}
          {result ? (
            <DiffDisplay
              result={result}
              mode={viewMode}
              labels={{
                before: t("before"),
                after: t("after"),
                noDifferences: t("noDifferences"),
              }}
            />
          ) : (
            <div className="border rounded-md p-8 text-center text-gray-500 text-sm">
              {t("emptyState")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
