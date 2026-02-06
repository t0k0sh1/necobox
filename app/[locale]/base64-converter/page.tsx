"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  encodeBase64,
  decodeBase64,
  fileToBase64,
  toDataUri,
  formatFileSize,
} from "@/lib/utils/base64-converter";
import { Copy, Check, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useRef } from "react";

type Tab = "text" | "file";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Base64ConverterPage() {
  const t = useTranslations("base64Converter");
  const tCommon = useTranslations("common");

  const [tab, setTab] = useState<Tab>("text");
  const [inputText, setInputText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [includeDataUri, setIncludeDataUri] = useState(false);
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    setInputText(value);
    setError(null);
    setEncodedText(encodeBase64(value));
  };

  const handleEncodedChange = (value: string) => {
    setEncodedText(value);
    setError(null);
    const { result, error: decodeError } = decodeBase64(value);
    if (decodeError) {
      setError(t("error.invalidBase64"));
      return;
    }
    setInputText(result);
  };

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);

      if (file.size > MAX_FILE_SIZE) {
        setError(t("error.fileTooLarge"));
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setFileBase64(base64);
        setFileName(file.name);
        setFileSize(file.size);
        setMimeType(file.type || "application/octet-stream");
      } catch {
        setError(t("error.encodeFailed"));
      }
    },
    [t]
  );

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  const fileOutput = fileBase64
    ? includeDataUri
      ? toDataUri(fileBase64, mimeType)
      : fileBase64
    : "";

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
        <div className="flex gap-2">
          <Button
            variant={tab === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("text")}
          >
            {t("tabs.text")}
          </Button>
          <Button
            variant={tab === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("file")}
          >
            {t("tabs.file")}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {tab === "text" ? (
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
                rows={8}
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
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ファイルアップロード */}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{t("fileUpload")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("fileUploadDescription")}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </div>

            {fileName && (
              <p className="text-sm text-muted-foreground">
                {t("fileSelected", {
                  name: fileName,
                  size: formatFileSize(fileSize),
                })}
              </p>
            )}

            {/* Data URI オプション */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeDataUri}
                  onChange={(e) => setIncludeDataUri(e.target.checked)}
                />
                {t("dataUriInclude")}
              </label>
              {includeDataUri && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">{t("mimeType")}</Label>
                  <Input
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                    className="w-60"
                  />
                </div>
              )}
            </div>

            {/* Base64出力 */}
            {fileOutput && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("encodedText")}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(fileOutput, "file")}
                  >
                    {copiedField === "file" ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    <span className="ml-1">
                      {copiedField === "file"
                        ? tCommon("copied")
                        : tCommon("copy")}
                    </span>
                  </Button>
                </div>
                <Textarea
                  value={fileOutput}
                  readOnly
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
