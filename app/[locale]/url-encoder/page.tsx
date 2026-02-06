"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  urlEncode,
  urlDecode,
  parseQueryParams,
  buildQueryString,
  type EncodeMode,
} from "@/lib/utils/url-encoder";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

export default function UrlEncoderPage() {
  const t = useTranslations("urlEncoder");
  const tCommon = useTranslations("common");

  const [inputText, setInputText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [mode, setMode] = useState<EncodeMode>("component");
  const [queryUrl, setQueryUrl] = useState("");
  const [queryParams, setQueryParams] = useState<
    { key: string; value: string }[]
  >([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleParseUrl = useCallback(() => {
    const params = parseQueryParams(queryUrl);
    setQueryParams(params);
  }, [queryUrl]);

  const handleCopy = useCallback(
    async (text: string, field: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    },
    []
  );

  const handleAddParam = useCallback(() => {
    setQueryParams((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const handleRemoveParam = useCallback((index: number) => {
    setQueryParams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleParamChange = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setQueryParams((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
      );
    },
    []
  );

  const builtQuery = buildQueryString(queryParams);

  // リアルタイムエンコード
  const handleInputChange = (value: string) => {
    setInputText(value);
    setEncodedText(urlEncode(value, mode));
  };

  const [error, setError] = useState<string | null>(null);

  const handleEncodedChange = (value: string) => {
    setEncodedText(value);
    setError(null);
    const { result, error: decodeError } = urlDecode(value);
    if (decodeError) {
      setError(t("error.decodeFailed"));
      return;
    }
    setInputText(result);
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

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* エンコードモード */}
        <div className="space-y-2">
          <Label>{t("mode")}</Label>
          <div className="flex gap-2">
            <Button
              variant={mode === "component" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("component");
                if (inputText) setEncodedText(urlEncode(inputText, "component"));
              }}
            >
              {t("modeComponent")}
            </Button>
            <Button
              variant={mode === "uri" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("uri");
                if (inputText) setEncodedText(urlEncode(inputText, "uri"));
              }}
            >
              {t("modeUri")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "component" ? t("modeComponentDesc") : t("modeUriDesc")}
          </p>
        </div>

        {/* エンコード/デコード */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("inputText")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(inputText, "input")}
              >
                {copiedField === "input" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span className="ml-1">
                  {copiedField === "input"
                    ? tCommon("copied")
                    : tCommon("copy")}
                </span>
              </Button>
            </div>
            <Textarea
              placeholder={t("inputPlaceholder")}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("encodedText")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(encodedText, "encoded")}
              >
                {copiedField === "encoded" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span className="ml-1">
                  {copiedField === "encoded"
                    ? tCommon("copied")
                    : tCommon("copy")}
                </span>
              </Button>
            </div>
            <Textarea
              placeholder={t("encodedPlaceholder")}
              value={encodedText}
              onChange={(e) => handleEncodedChange(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        {/* クエリパラメータパーサー */}
        <div className="space-y-4 border rounded-lg p-4">
          <h2 className="text-lg font-semibold">{t("queryParams")}</h2>
          <div className="flex gap-2">
            <Input
              placeholder={t("queryParamsUrlPlaceholder")}
              value={queryUrl}
              onChange={(e) => setQueryUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleParseUrl} variant="outline">
              {t("decode")}
            </Button>
          </div>

          {/* パラメータ一覧 */}
          {queryParams.length > 0 ? (
            <div className="space-y-2">
              {queryParams.map((param, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder={t("key")}
                    value={param.key}
                    onChange={(e) =>
                      handleParamChange(index, "key", e.target.value)
                    }
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">=</span>
                  <Input
                    placeholder={t("value")}
                    value={param.value}
                    onChange={(e) =>
                      handleParamChange(index, "value", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveParam(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noParams")}</p>
          )}

          <Button variant="outline" size="sm" onClick={handleAddParam}>
            <Plus className="size-4 mr-1" />
            {t("addParam")}
          </Button>

          {builtQuery && (
            <div className="space-y-1">
              <Label>{t("buildUrl")}</Label>
              <div className="flex gap-2">
                <Input value={`?${builtQuery}`} readOnly className="flex-1 font-mono text-sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(`?${builtQuery}`, "query")}
                >
                  {copiedField === "query" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
