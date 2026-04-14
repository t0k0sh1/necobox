"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  batchGenerate,
  type IdType,
  type TimeSourceOption,
} from "@/lib/utils/uuid-generator";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

const TABS: { key: IdType; label: string }[] = [
  { key: "uuidV4", label: "tabs.uuidV4" },
  { key: "uuidV7", label: "tabs.uuidV7" },
  { key: "ulid", label: "tabs.ulid" },
  { key: "nanoid", label: "tabs.nanoid" },
];

type TimeMode = "now" | "range";

export default function UuidGeneratorPage() {
  const t = useTranslations("uuidGenerator");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<IdType>("uuidV4");
  const [count, setCount] = useState(1);
  const [nanoidLength, setNanoidLength] = useState(21);
  const [timeMode, setTimeMode] = useState<TimeMode>("now");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const { copy, isCopied } = useCopyToClipboard(1500);

  const supportsTimeSource =
    activeTab === "uuidV7" || activeTab === "ulid";

  const handleGenerate = useCallback(() => {
    setFormError(null);

    let timeSource: TimeSourceOption | undefined = "now";

    if (supportsTimeSource && timeMode === "range") {
      const start = rangeStart.trim();
      const end = rangeEnd.trim();
      if (!start || !end) {
        setFormError(t("error.rangeRequired"));
        return;
      }
      const minMs = new Date(start).getTime();
      const maxMs = new Date(end).getTime();
      if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
        setFormError(t("error.invalidDateTime"));
        return;
      }
      if (minMs > maxMs) {
        setFormError(t("error.rangeInvalid"));
        return;
      }
      timeSource = { mode: "range", minMs, maxMs };
    }

    try {
      const ids = batchGenerate(activeTab, count, {
        nanoidLength,
        timeSource,
      });
      setResults(ids);
    } catch (e) {
      if (e instanceof RangeError) {
        setFormError(t("error.rangeInvalid"));
        return;
      }
      setFormError(t("error.generateFailed"));
    }
  }, [
    activeTab,
    count,
    nanoidLength,
    rangeEnd,
    rangeStart,
    supportsTimeSource,
    timeMode,
    t,
  ]);

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

        {/* タブ */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab(key);
                setResults([]);
                setFormError(null);
              }}
            >
              {t(label as Parameters<typeof t>[0])}
            </Button>
          ))}
        </div>

        {supportsTimeSource && (
          <div className="space-y-3 rounded-lg border bg-card/30 p-4">
            <h2 className="text-sm font-semibold">{t("timeSourceTitle")}</h2>
            <RadioGroup
              value={timeMode}
              onValueChange={(v) => {
                setTimeMode(v as TimeMode);
                setFormError(null);
              }}
              className="gap-3"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="now" id="time-now" />
                <Label htmlFor="time-now" className="font-normal cursor-pointer">
                  {t("timeModeNow")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="range" id="time-range" />
                <Label
                  htmlFor="time-range"
                  className="font-normal cursor-pointer"
                >
                  {t("timeModeRange")}
                </Label>
              </div>
            </RadioGroup>
            {timeMode === "range" && (
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="range-start">{t("rangeStart")}</Label>
                  <Input
                    id="range-start"
                    type="datetime-local"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-[220px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="range-end">{t("rangeEnd")}</Label>
                  <Input
                    id="range-end"
                    type="datetime-local"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-[220px]"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("timeSourceHint")}</p>
          </div>
        )}

        {/* 設定 */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>{t("count")}</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
              }
              className="w-24"
            />
          </div>
          {activeTab === "nanoid" && (
            <div className="space-y-1">
              <Label>{t("nanoidLength")}</Label>
              <Input
                type="number"
                min={1}
                max={256}
                value={nanoidLength}
                onChange={(e) =>
                  setNanoidLength(
                    Math.max(1, Math.min(256, Number(e.target.value) || 21))
                  )
                }
                className="w-24"
              />
            </div>
          )}
          <Button onClick={handleGenerate}>
            <RefreshCw className="size-4 mr-1" />
            {tCommon("generate")}
          </Button>
        </div>

        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}

        {/* 結果 */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("generated")}</h2>
              <Button variant="outline" size="sm" onClick={() => copy(results.join("\n"), "all")}>
                {isCopied("all") ? (
                  <Check className="size-4 mr-1" />
                ) : (
                  <Copy className="size-4 mr-1" />
                )}
                {isCopied("all")
                  ? tCommon("copiedAll")
                  : t("copyAll")}
              </Button>
            </div>
            <div className="space-y-1.5">
              {results.map((id, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 group"
                >
                  <code className="font-mono text-sm select-all">{id}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copy(id, `id-${index}`)}
                  >
                    {isCopied(`id-${index}`) ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
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
