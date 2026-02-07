"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  hashText,
  hashFile,
  compareHash,
  HASH_ALGORITHMS,
  type HashAlgorithm,
} from "@/lib/utils/hash-generator";
import { formatFileSize } from "@/lib/utils/base64-converter";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import {
  Copy,
  Check,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useRef } from "react";

type Tab = "text" | "file";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function HashGeneratorPage() {
  const t = useTranslations("hashGenerator");
  const tCommon = useTranslations("common");

  const [tab, setTab] = useState<Tab>("text");
  const [inputText, setInputText] = useState("");
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string>>(
    {} as Record<HashAlgorithm, string>
  );
  const [isUppercase, setIsUppercase] = useState(false);
  const [compareValue, setCompareValue] = useState("");
  const { copy, isCopied } = useCopyToClipboard();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const computeTextHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({} as Record<HashAlgorithm, string>);
      return;
    }

    const results: Record<string, string> = {};
    await Promise.all(
      HASH_ALGORITHMS.map(async (algo) => {
        results[algo] = await hashText(text, algo);
      })
    );
    setHashes(results as Record<HashAlgorithm, string>);
  }, []);

  const handleTextChange = useCallback(
    (value: string) => {
      setInputText(value);
      computeTextHashes(value);
    },
    [computeTextHashes]
  );

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);

      if (file.size > MAX_FILE_SIZE) {
        setError(t("error.fileTooLarge"));
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setIsLoading(true);

      try {
        const results: Record<string, string> = {};
        await Promise.all(
          HASH_ALGORITHMS.map(async (algo) => {
            results[algo] = await hashFile(file, algo);
          })
        );
        setHashes(results as Record<HashAlgorithm, string>);
      } catch {
        setError(t("error.hashFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const handleCopy = useCallback(async (text: string, field: string) => {
    copy(text, field);
  }, [copy]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  const formatHash = (hash: string) =>
    isUppercase ? hash.toUpperCase() : hash;

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
          <div className="space-y-2">
            <Label>{t("inputText")}</Label>
            <Textarea
              placeholder={t("inputPlaceholder")}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
            />
          </div>
        ) : (
          <div className="space-y-4">
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
          </div>
        )}

        {/* オプション */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isUppercase}
              onChange={(e) => setIsUppercase(e.target.checked)}
            />
            {t("uppercase")}
          </label>
        </div>

        {/* ハッシュ結果 */}
        {Object.keys(hashes).length > 0 && !isLoading && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{t("results")}</h2>
            <div className="space-y-2">
              {HASH_ALGORITHMS.map((algo) => (
                <div
                  key={algo}
                  className="border rounded-md p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{algo}</span>
                      {algo === "MD5" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {t("md5Warning")}
                        </span>
                      )}
                      {algo === "SHA-1" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {t("sha1Warning")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(formatHash(hashes[algo] || ""), algo)
                      }
                    >
                      {isCopied(algo) ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      <span className="ml-1">
                        {isCopied(algo)
                          ? tCommon("copied")
                          : tCommon("copy")}
                      </span>
                    </Button>
                  </div>
                  <p className="font-mono text-xs break-all text-muted-foreground select-all">
                    {formatHash(hashes[algo] || "")}
                  </p>

                  {/* 比較表示 */}
                  {compareValue && hashes[algo] && (
                    <div className="flex items-center gap-1 mt-1">
                      {compareHash(hashes[algo], compareValue) ? (
                        <>
                          <CheckCircle2 className="size-4 text-green-600" />
                          <span className="text-xs text-green-600">
                            {t("match")}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-4 text-red-600" />
                          <span className="text-xs text-red-600">
                            {t("noMatch")}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        )}

        {/* ハッシュ比較 */}
        <div className="space-y-2">
          <Label>{t("compareHash")}</Label>
          <Input
            placeholder={t("comparePlaceholder")}
            value={compareValue}
            onChange={(e) => setCompareValue(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
