"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  batchGenerate,
  type IdType,
} from "@/lib/utils/uuid-generator";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

const TABS: { key: IdType; label: string }[] = [
  { key: "uuidV4", label: "tabs.uuidV4" },
  { key: "uuidV7", label: "tabs.uuidV7" },
  { key: "ulid", label: "tabs.ulid" },
  { key: "nanoid", label: "tabs.nanoid" },
];

export default function UuidGeneratorPage() {
  const t = useTranslations("uuidGenerator");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<IdType>("uuidV4");
  const [count, setCount] = useState(1);
  const [nanoidLength, setNanoidLength] = useState(21);
  const [results, setResults] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const ids = batchGenerate(activeTab, count, { nanoidLength });
    setResults(ids);
  }, [activeTab, count, nanoidLength]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handleCopyAll = useCallback(async () => {
    const text = results.join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 1500);
  }, [results]);

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
              }}
            >
              {t(label as Parameters<typeof t>[0])}
            </Button>
          ))}
        </div>

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

        {/* 結果 */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("generated")}</h2>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                {copiedField === "all" ? (
                  <Check className="size-4 mr-1" />
                ) : (
                  <Copy className="size-4 mr-1" />
                )}
                {copiedField === "all"
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
                    onClick={() => handleCopy(id, `id-${index}`)}
                  >
                    {copiedField === `id-${index}` ? (
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
