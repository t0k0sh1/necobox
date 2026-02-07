"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeTextStats,
  convertCase,
  joinLines,
  removeEmptyLines,
  removeDuplicateLines,
  sortLines,
  splitToLines,
  trimLines,
  wrapLines,
  type CaseType,
  type Delimiter,
  type SortOrder,
  type WrapPreset,
} from "@/lib/utils/text-processor";
import { Check, ChevronRight, Copy, RotateCcw, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback, useRef } from "react";

type OperationType =
  | "case-convert"
  | "wrap"
  | "join-lines"
  | "split-to-lines"
  | "remove-duplicates"
  | "sort-lines"
  | "trim-lines"
  | "remove-empty-lines";

interface OperationStep {
  id: number;
  type: OperationType;
  caseType: CaseType;
  sortOrder: SortOrder;
  wrapPreset: WrapPreset;
  customPrefix: string;
  customSuffix: string;
  delimiter: Delimiter;
}

const OPERATIONS: OperationType[] = [
  "case-convert",
  "wrap",
  "join-lines",
  "split-to-lines",
  "remove-duplicates",
  "sort-lines",
  "trim-lines",
  "remove-empty-lines",
];

const OPERATION_I18N_MAP: Record<OperationType, string> = {
  "case-convert": "operation.caseConvert",
  wrap: "operation.wrap",
  "join-lines": "operation.joinLines",
  "split-to-lines": "operation.splitToLines",
  "remove-duplicates": "operation.removeDuplicates",
  "sort-lines": "operation.sortLines",
  "trim-lines": "operation.trimLines",
  "remove-empty-lines": "operation.removeEmptyLines",
};

const WRAP_PRESET_MAP: Record<
  Exclude<WrapPreset, "custom">,
  { prefix: string; suffix: string }
> = {
  "single-quote": { prefix: "'", suffix: "'" },
  "double-quote": { prefix: '"', suffix: '"' },
  backtick: { prefix: "`", suffix: "`" },
};

function applyStep(text: string, step: OperationStep): string {
  if (text === "") return "";

  switch (step.type) {
    case "case-convert":
      return convertCase(text, step.caseType);
    case "wrap": {
      const preset =
        step.wrapPreset === "custom"
          ? { prefix: step.customPrefix, suffix: step.customSuffix }
          : WRAP_PRESET_MAP[step.wrapPreset];
      return wrapLines(text, preset.prefix, preset.suffix);
    }
    case "join-lines":
      return joinLines(text, step.delimiter);
    case "split-to-lines":
      return splitToLines(text, step.delimiter);
    case "remove-duplicates":
      return removeDuplicateLines(text);
    case "sort-lines":
      return sortLines(text, step.sortOrder);
    case "trim-lines":
      return trimLines(text);
    case "remove-empty-lines":
      return removeEmptyLines(text);
  }
}

export default function TextProcessorPage() {
  const t = useTranslations("textProcessor");
  const nextIdRef = useRef(0);

  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // 統計情報
  const stats = useMemo(() => computeTextStats(input), [input]);

  // パイプライン出力の自動計算
  const output = useMemo(() => {
    if (input === "" || steps.length === 0) return "";
    return steps.reduce((text, step) => applyStep(text, step), input);
  }, [input, steps]);

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedStepId) ?? null,
    [steps, selectedStepId]
  );

  const addStep = useCallback((type: OperationType) => {
    const id = nextIdRef.current++;
    const step: OperationStep = {
      id,
      type,
      caseType: "camelCase",
      sortOrder: "asc",
      wrapPreset: "single-quote",
      customPrefix: "",
      customSuffix: "",
      delimiter: "comma",
    };
    setSteps((prev) => [...prev, step]);
    setSelectedStepId(id);
  }, []);

  const removeStep = useCallback(
    (id: number) => {
      setSteps((prev) => prev.filter((s) => s.id !== id));
      if (selectedStepId === id) {
        setSelectedStepId(null);
      }
    },
    [selectedStepId]
  );

  const updateStep = useCallback(
    (id: number, update: Partial<OperationStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...update } : s))
      );
    },
    []
  );

  const clearSteps = useCallback(() => {
    setSteps([]);
    setSelectedStepId(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleOutputToInput = useCallback(() => {
    if (output) setInput(output);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

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

          {/* 統計情報 + アクションボタン */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-2.5">
            <span>
              {t("stats.characters")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.characters}
              </strong>
            </span>
            <span>
              {t("stats.charactersNoSpaces")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.charactersNoSpaces}
              </strong>
            </span>
            <span>
              {t("stats.words")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.words}
              </strong>
            </span>
            <span>
              {t("stats.lines")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.lines}
              </strong>
            </span>
            <span>
              {t("stats.nonEmptyLines")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.nonEmptyLines}
              </strong>
            </span>
            <span>
              {t("stats.bytes")}:{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {stats.bytes}
              </strong>
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!output}
                className="gap-1.5 h-7 text-xs"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? t("toolbar.copied") : t("toolbar.copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOutputToInput}
                disabled={!output}
                className="gap-1.5 h-7 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("toolbar.outputToInput")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!input}
                className="gap-1.5 h-7 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("toolbar.clear")}
              </Button>
            </div>
          </div>

          {/* 入出力エリア */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("input")}</Label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputPlaceholder")}
                className="w-full min-h-[300px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("input")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("output")}</Label>
              <textarea
                value={output}
                readOnly
                placeholder={t("outputPlaceholder")}
                className="w-full min-h-[300px] rounded-md border bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("output")}
              />
            </div>
          </div>

          {/* パイプライン */}
          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">
                  {t("pipeline.label")}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSteps}
                  className="h-6 text-xs text-gray-500 hover:text-red-500"
                >
                  {t("pipeline.clearAll")}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <button
                      onClick={() =>
                        setSelectedStepId(
                          selectedStepId === step.id ? null : step.id
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedStepId === step.id
                          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-[10px] opacity-60">
                        {index + 1}
                      </span>
                      {t(
                        OPERATION_I18N_MAP[
                          step.type
                        ] as Parameters<typeof t>[0]
                      )}
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        aria-label={t("pipeline.removeStep")}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* 選択中のステップのサブオプション */}
              {selectedStep && selectedStep.type === "case-convert" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(
                    [
                      "camelCase",
                      "snake_case",
                      "kebab-case",
                      "PascalCase",
                      "CONSTANT_CASE",
                    ] as CaseType[]
                  ).map((ct) => (
                    <Button
                      key={ct}
                      variant={
                        selectedStep.caseType === ct ? "default" : "secondary"
                      }
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() =>
                        updateStep(selectedStep.id, { caseType: ct })
                      }
                    >
                      {ct}
                    </Button>
                  ))}
                </div>
              )}

              {selectedStep && selectedStep.type === "wrap" && (
                <div className="flex flex-wrap items-end gap-2 pt-1">
                  {(
                    [
                      "single-quote",
                      "double-quote",
                      "backtick",
                      "custom",
                    ] as WrapPreset[]
                  ).map((wp) => (
                    <Button
                      key={wp}
                      variant={
                        selectedStep.wrapPreset === wp
                          ? "default"
                          : "secondary"
                      }
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        updateStep(selectedStep.id, { wrapPreset: wp })
                      }
                    >
                      {t(
                        `wrap.${wp === "single-quote" ? "singleQuote" : wp === "double-quote" ? "doubleQuote" : wp}` as Parameters<typeof t>[0]
                      )}
                    </Button>
                  ))}
                  {selectedStep.wrapPreset === "custom" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wrap.prefix")}</Label>
                        <Input
                          value={selectedStep.customPrefix}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              customPrefix: e.target.value,
                            })
                          }
                          className="w-[100px] h-8 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wrap.suffix")}</Label>
                        <Input
                          value={selectedStep.customSuffix}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              customSuffix: e.target.value,
                            })
                          }
                          className="w-[100px] h-8 font-mono text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedStep &&
                (selectedStep.type === "join-lines" ||
                  selectedStep.type === "split-to-lines") && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["tab", "comma", "space"] as Delimiter[]).map((d) => (
                      <Button
                        key={d}
                        variant={
                          selectedStep.delimiter === d
                            ? "default"
                            : "secondary"
                        }
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          updateStep(selectedStep.id, { delimiter: d })
                        }
                      >
                        {t(
                          `delimiter.${d}` as Parameters<typeof t>[0]
                        )}
                      </Button>
                    ))}
                  </div>
                )}

              {selectedStep && selectedStep.type === "sort-lines" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["asc", "desc", "reverse"] as SortOrder[]).map((so) => (
                    <Button
                      key={so}
                      variant={
                        selectedStep.sortOrder === so
                          ? "default"
                          : "secondary"
                      }
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        updateStep(selectedStep.id, { sortOrder: so })
                      }
                    >
                      {t(`sort.${so}` as Parameters<typeof t>[0])}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作追加ボタン群 */}
          <div className="space-y-3">
            <Label className="text-xs text-gray-500">
              {steps.length === 0
                ? t("operation.label")
                : t("pipeline.addOperation")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {OPERATIONS.map((op) => (
                <Button
                  key={op}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(op)}
                >
                  {t(
                    OPERATION_I18N_MAP[op] as Parameters<typeof t>[0]
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
