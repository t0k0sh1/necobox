"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ColorScheme } from "@/lib/utils/color-scheme-designer";
import {
  exportAsText,
  exportAsCssVariables,
  exportAsTailwindConfig,
  renderSchemeToCanvas,
  downloadCanvasAsPng,
} from "@/lib/utils/color-scheme-designer";
import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

interface ExportSectionProps {
  scheme: ColorScheme;
}

export function ExportSection({ scheme }: ExportSectionProps) {
  const t = useTranslations("colorSchemeDesigner");
  const tCommon = useTranslations("common");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCopy = useCallback(
    async (text: string, tab: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    },
    []
  );

  const handleDownloadPng = useCallback(() => {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    renderSchemeToCanvas(scheme, canvas);
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    downloadCanvasAsPng(canvas, `${scheme.name || "color-scheme"}_${ts}.png`);
  }, [scheme]);

  const textExport = exportAsText(scheme);
  const cssExport = exportAsCssVariables(scheme);
  const tailwindExport = exportAsTailwindConfig(scheme);

  return (
    <div className="space-y-2">
      <Tabs defaultValue="text">
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="text" className="text-xs">
            {t("exportText")}
          </TabsTrigger>
          <TabsTrigger value="css" className="text-xs">
            CSS
          </TabsTrigger>
          <TabsTrigger value="tailwind" className="text-xs">
            TW
          </TabsTrigger>
          <TabsTrigger value="png" className="text-xs">
            PNG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-2">
          <div className="relative">
            <pre className="text-[10px] bg-gray-50 dark:bg-gray-900 rounded-md p-3 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
              {textExport}
            </pre>
            <CopyBtn
              copied={copiedTab === "text"}
              onClick={() => handleCopy(textExport, "text")}
              tCommon={tCommon}
            />
          </div>
        </TabsContent>

        <TabsContent value="css" className="mt-2">
          <div className="relative">
            <pre className="text-[10px] bg-gray-50 dark:bg-gray-900 rounded-md p-3 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
              {cssExport}
            </pre>
            <CopyBtn
              copied={copiedTab === "css"}
              onClick={() => handleCopy(cssExport, "css")}
              tCommon={tCommon}
            />
          </div>
        </TabsContent>

        <TabsContent value="tailwind" className="mt-2">
          <div className="relative">
            <pre className="text-[10px] bg-gray-50 dark:bg-gray-900 rounded-md p-3 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
              {tailwindExport}
            </pre>
            <CopyBtn
              copied={copiedTab === "tailwind"}
              onClick={() => handleCopy(tailwindExport, "tailwind")}
              tCommon={tCommon}
            />
          </div>
        </TabsContent>

        <TabsContent value="png" className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="w-full text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {t("download")} (1200×630)
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CopyBtn({
  copied,
  onClick,
  tCommon,
}: {
  copied: boolean;
  onClick: () => void;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-1 right-1 h-6 w-6"
      onClick={onClick}
      aria-label={copied ? tCommon("copied") : tCommon("copy")}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </Button>
  );
}
