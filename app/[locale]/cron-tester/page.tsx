"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseCron,
  parseAwsCron,
  validateCron,
  getNextExecutions,
  describeCron,
  CRON_PRESETS,
  AWS_CRON_PRESETS,
  type CronFormat,
} from "@/lib/utils/cron-tester";
import { Copy, Check, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";

const STANDARD_FIELD_KEYS = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
] as const;

const AWS_FIELD_KEYS = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
  "year",
] as const;

const DEFAULT_EXPRESSIONS: Record<CronFormat, string> = {
  standard: "* * * * *",
  aws: "* * * * ? *",
};

export default function CronTesterPage() {
  const t = useTranslations("cronTester");
  const locale = useLocale();

  const [format, setFormat] = useState<CronFormat>("standard");
  const [expression, setExpression] = useState(DEFAULT_EXPRESSIONS.standard);
  const [nextCount, setNextCount] = useState(10);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const validation = useMemo(
    () => validateCron(expression, format),
    [expression, format]
  );

  const parts = useMemo(() => {
    if (format === "aws") return parseAwsCron(expression);
    return parseCron(expression);
  }, [expression, format]);

  const description = useMemo(
    () =>
      parts
        ? describeCron(parts, locale === "ja" ? "ja" : "en")
        : "",
    [parts, locale]
  );

  const nextExecutions = useMemo(
    () =>
      validation.valid
        ? getNextExecutions(expression, nextCount, undefined, format)
        : [],
    [expression, nextCount, validation.valid, format]
  );

  const fieldKeys = format === "aws" ? AWS_FIELD_KEYS : STANDARD_FIELD_KEYS;
  const fieldCount = format === "aws" ? 6 : 5;
  const presets = format === "aws" ? AWS_CRON_PRESETS : CRON_PRESETS;

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handlePreset = useCallback((expr: string) => {
    setExpression(expr);
  }, []);

  const handleFormatChange = useCallback((newFormat: CronFormat) => {
    setFormat(newFormat);
    setExpression(DEFAULT_EXPRESSIONS[newFormat]);
  }, []);

  const handleFieldChange = useCallback(
    (fieldIndex: number, value: string) => {
      const expectedCount = format === "aws" ? 6 : 5;
      const defaultChar = format === "aws" && (fieldIndex === 2 || fieldIndex === 4) ? "?" : "*";
      const currentParts = expression.trim().split(/\s+/);
      while (currentParts.length < expectedCount) currentParts.push("*");
      currentParts[fieldIndex] = value || defaultChar;
      setExpression(currentParts.join(" "));
    },
    [expression, format]
  );

  const fieldValues = expression.trim().split(/\s+/);
  while (fieldValues.length < fieldCount) fieldValues.push("*");

  const getFieldHelp = (field: string): string => {
    if (format === "standard") {
      if (field === "dayOfMonth") return t("fieldHelp.dayOfMonthStandard" as Parameters<typeof t>[0]);
      if (field === "dayOfWeek") return t("fieldHelp.dayOfWeekStandard" as Parameters<typeof t>[0]);
    }
    return t(`fieldHelp.${field}` as Parameters<typeof t>[0]);
  };

  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl space-y-6">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>

        {/* フォーマット切り替え */}
        <div className="space-y-2">
          <Label>{t("format.label")}</Label>
          <div className="flex gap-2">
            <Button
              variant={format === "standard" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFormatChange("standard")}
            >
              {t("format.standard")}
            </Button>
            <Button
              variant={format === "aws" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFormatChange("aws")}
            >
              {t("format.aws")}
            </Button>
          </div>
        </div>

        {/* Cron式入力 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="shrink-0">{t("expression")}</Label>
            <Input
              placeholder={
                format === "aws"
                  ? t("expressionPlaceholderAws")
                  : t("expressionPlaceholder")
              }
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="font-mono text-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(expression, "expr")}
            >
              {copiedField === "expr" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          {/* バリデーション結果 */}
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <>
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-sm text-green-600">{t("valid")}</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-red-600" />
                <span className="text-sm text-red-600">{t("invalid")}</span>
                {validation.errors.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    — {validation.errors[0].message}
                  </span>
                )}
              </>
            )}
          </div>

          {/* AWS注釈 */}
          {format === "aws" && (
            <p className="text-xs text-muted-foreground">
              {t("awsNote")}
            </p>
          )}

          {/* 説明文 */}
          {description && (
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {t("descriptionLabel")}
              </span>
              <p className="text-sm font-medium">{description}</p>
            </div>
          )}
        </div>

        {/* フィールドごとの入力 */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className={`grid gap-2 ${format === "aws" ? "grid-cols-6" : "grid-cols-5"}`}>
            {fieldKeys.map((field, index) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">
                  {t(`fields.${field}` as Parameters<typeof t>[0])}
                </Label>
                <Input
                  value={fieldValues[index] || "*"}
                  onChange={(e) => handleFieldChange(index, e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {getFieldHelp(field)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* プリセット */}
        <div className="space-y-2">
          <Label>{t("presets")}</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.expression}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset.expression)}
                className="font-mono"
              >
                <span className="mr-2 text-muted-foreground">
                  {preset.expression}
                </span>
                {t(`preset.${preset.i18nKey}` as Parameters<typeof t>[0])}
              </Button>
            ))}
          </div>
        </div>

        {/* 次回実行時刻 */}
        {nextExecutions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">
                {t("nextExecutions")}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <Label>{t("nextCount")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={nextCount}
                  onChange={(e) =>
                    setNextCount(
                      Math.max(1, Math.min(50, Number(e.target.value) || 10))
                    )
                  }
                  className="w-20"
                />
                <span className="text-muted-foreground">{t("times")}</span>
              </div>
            </div>
            <div className="space-y-1">
              {nextExecutions.map((date, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm">
                      {date.toLocaleString(locale, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      handleCopy(date.toISOString(), `next-${index}`)
                    }
                  >
                    {copiedField === `next-${index}` ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
