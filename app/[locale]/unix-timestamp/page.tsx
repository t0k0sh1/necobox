"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  timestampToDate,
  dateToTimestamp,
  formatDate,
  isValidTimestamp,
  getCurrentTimestamp,
  type TimestampUnit,
} from "@/lib/utils/unix-timestamp";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { Copy, Check } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useMemo } from "react";

function CopyButton({
  text,
  field,
  isCopied,
  onCopy,
}: {
  text: string;
  field: string;
  isCopied: (id: string) => boolean;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => onCopy(text, field)}
    >
      {isCopied(field) ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}

export default function UnixTimestampPage() {
  const t = useTranslations("unixTimestamp");
  const locale = useLocale();

  const [currentTs, setCurrentTs] = useState(getCurrentTimestamp("seconds"));
  const [currentTsMs, setCurrentTsMs] = useState(
    getCurrentTimestamp("milliseconds")
  );
  const [tsInput, setTsInput] = useState("");
  const [tsUnit, setTsUnit] = useState<TimestampUnit>("seconds");
  const [dateInput, setDateInput] = useState("");
  const [dateUnit, setDateUnit] = useState<TimestampUnit>("seconds");
  const { copy, isCopied } = useCopyToClipboard();

  // 現在のタイムスタンプをリアルタイム更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTs(getCurrentTimestamp("seconds"));
      setCurrentTsMs(getCurrentTimestamp("milliseconds"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // タイムスタンプ → 日時
  const tsResult = useMemo(() => {
    if (!tsInput) return null;
    const validation = isValidTimestamp(tsInput);
    if (!validation.valid) return null;

    const num = Number(tsInput);
    const date = timestampToDate(num, tsUnit);
    if (isNaN(date.getTime())) return null;

    return formatDate(date, locale);
  }, [tsInput, tsUnit, locale]);

  // 日時 → タイムスタンプ
  const dateResult = useMemo(() => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    return dateToTimestamp(date, dateUnit);
  }, [dateInput, dateUnit]);

  const handleCopy = (text: string, field: string) => {
    copy(text, field);
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

        {/* 現在のタイムスタンプ */}
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">{t("currentTimestamp")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("seconds")}
                </span>
                <p className="font-mono text-lg">{currentTs}</p>
              </div>
              <CopyButton text={String(currentTs)} field="currentTs" isCopied={isCopied} onCopy={handleCopy} />
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("milliseconds")}
                </span>
                <p className="font-mono text-lg">{currentTsMs}</p>
              </div>
              <CopyButton text={String(currentTsMs)} field="currentTsMs" isCopied={isCopied} onCopy={handleCopy} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* タイムスタンプ → 日時 */}
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="text-lg font-semibold">{t("timestampToDate")}</h2>
            <div className="space-y-2">
              <Label>{t("timestampInput")}</Label>
              <Input
                placeholder={t("timestampPlaceholder")}
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("unit")}</Label>
              <div className="flex gap-2">
                <Button
                  variant={tsUnit === "seconds" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTsUnit("seconds")}
                >
                  {t("seconds")}
                </Button>
                <Button
                  variant={tsUnit === "milliseconds" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTsUnit("milliseconds")}
                >
                  {t("milliseconds")}
                </Button>
              </div>
            </div>

            {tsResult && (
              <div className="space-y-2 text-sm">
                <h3 className="font-medium">{t("result")}</h3>
                <div className="space-y-1.5">
                  {[
                    { label: t("localTime"), value: tsResult.local, key: "local" },
                    { label: t("utcTime"), value: tsResult.utc, key: "utc" },
                    { label: t("iso8601"), value: tsResult.iso8601, key: "iso" },
                    { label: t("relative"), value: tsResult.relative, key: "rel" },
                  ].map(({ label, value, key }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5"
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {label}
                        </span>
                        <p className="font-mono text-sm">{value}</p>
                      </div>
                      <CopyButton text={value} field={`ts-${key}`} isCopied={isCopied} onCopy={handleCopy} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 日時 → タイムスタンプ */}
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="text-lg font-semibold">{t("dateToTimestamp")}</h2>
            <div className="space-y-2">
              <Label>{t("dateInput")}</Label>
              <Input
                type="datetime-local"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("unit")}</Label>
              <div className="flex gap-2">
                <Button
                  variant={dateUnit === "seconds" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateUnit("seconds")}
                >
                  {t("seconds")}
                </Button>
                <Button
                  variant={dateUnit === "milliseconds" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateUnit("milliseconds")}
                >
                  {t("milliseconds")}
                </Button>
              </div>
            </div>

            {dateResult !== null && (
              <div className="space-y-2 text-sm">
                <h3 className="font-medium">{t("result")}</h3>
                <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                  <p className="font-mono text-lg">{dateResult}</p>
                  <CopyButton text={String(dateResult)} field="dateResult" isCopied={isCopied} onCopy={handleCopy} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
