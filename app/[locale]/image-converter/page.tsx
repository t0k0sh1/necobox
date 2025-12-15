"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Image as ImageIcon, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

interface ConvertedFile {
  name: string;
  blob: Blob;
  url: string;
}

export default function ImageConverterPage() {
  const t = useTranslations("imageConverter");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<"pngToJpeg" | "jpegToPng">(
    "pngToJpeg"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const toFormat = activeTab === "pngToJpeg" ? "jpeg" : "png";
  const acceptedTypes =
    activeTab === "pngToJpeg" ? "image/png" : "image/jpeg,image/jpg";

  // Sanitize file name to prevent DOM XSS attacks
  const sanitizeFileName = (fileName: string): string => {
    // Remove dangerous characters
    let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
    // Remove consecutive dots
    sanitized = sanitized.replace(/\.{2,}/g, "");
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, "");
    // Use default name if empty
    return sanitized || "download";
  };

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const fileArray = Array.from(selectedFiles);
      const validFiles = fileArray.filter((file) => {
        if (activeTab === "pngToJpeg") {
          return (
            file.type === "image/png" ||
            file.name.toLowerCase().endsWith(".png")
          );
        } else {
          return (
            file.type === "image/jpeg" ||
            file.type === "image/jpg" ||
            file.name.toLowerCase().match(/\.(jpg|jpeg)$/i)
          );
        }
      });

      if (validFiles.length === 0) {
        setError(t("error.invalidFormat"));
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);
      setError(null);

      // Create preview URLs
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setPreviewUrls((prev) => [...prev, url]);
      });
    },
    [activeTab, t]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    // Revoke preview URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setConvertedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError(t("error.noFiles"));
      return;
    }

    setIsConverting(true);
    setError(null);
    setConvertedFiles([]);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("toFormat", toFormat);
      formData.append("convertOnly", "true"); // Convert only, return JSON

      const response = await fetch("/api/v1/image-converter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("error.conversionFailed"));
      }

      const data = await response.json();
      if (!data.success || !data.files) {
        throw new Error(t("error.conversionFailed"));
      }

      // Convert base64 to blobs
      const converted: ConvertedFile[] = data.files.map(
        (fileData: { name: string; data: string; mimeType: string }) => {
          const byteCharacters = atob(fileData.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.mimeType });
          const url = URL.createObjectURL(blob);

          return {
            name: fileData.name,
            blob,
            url,
          };
        }
      );

      setConvertedFiles(converted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("error.conversionFailed")
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) {
      setError(t("error.noFiles"));
      return;
    }

    try {
      if (convertedFiles.length === 1) {
        // Single file download
        const file = convertedFiles[0];
        const a = document.createElement("a");
        a.href = file.url;
        a.download = sanitizeFileName(file.name);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Multiple files - download as ZIP
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("toFormat", toFormat);
        formData.append("asZip", "true");

        const response = await fetch("/api/v1/image-converter", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(t("error.downloadFailed"));
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted-images.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.downloadFailed"));
    }
  };

  const handleDownloadIndividual = (index: number) => {
    const file = convertedFiles[index];
    if (!file) return;

    const a = document.createElement("a");
    a.href = file.url;
    a.download = sanitizeFileName(file.name);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClear = () => {
    // Revoke all preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    // Revoke all converted file URLs
    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setFiles([]);
    setPreviewUrls([]);
    setConvertedFiles([]);
    setError(null);
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "pngToJpeg" | "jpegToPng");
              handleClear();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pngToJpeg">{t("tabs.pngToJpeg")}</TabsTrigger>
              <TabsTrigger value="jpegToPng">{t("tabs.jpegToPng")}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  {t("upload.title")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t("upload.description")}
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {t("upload.selectFiles")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {t("upload.dragDrop")}
                  </p>
                </div>
              </div>

              {/* Selected Files with Preview */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">
                      {t("filesSelected", { count: files.length })}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleClear}>
                      {tCommon("clear")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map((file, index) => {
                      const convertedFile = convertedFiles[index];
                      return (
                        <div
                          key={index}
                          className="relative border rounded-lg p-2 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="aspect-square flex items-center justify-center mb-2 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                            {convertedFile?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={convertedFile.url}
                                alt={convertedFile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : previewUrls[index] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrls[index]}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          {convertedFile && (
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {t("converted")}
                              </span>
                              <Button
                                onClick={() => handleDownloadIndividual(index)}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            aria-label="Remove file"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Convert Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleConvert}
                  disabled={files.length === 0 || isConverting}
                  className="flex-1"
                >
                  {isConverting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {tCommon("converting")}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {t("convert")}
                    </>
                  )}
                </Button>
              </div>

              {/* Download All Button */}
              {convertedFiles.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadAll}
                    className="flex-1"
                    variant="default"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("downloadAll")}
                    {convertedFiles.length > 1 && ` (${convertedFiles.length})`}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
