"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolMode } from "@/lib/utils/domain-modeling";
import {
  MousePointer2,
  Plus,
  Square,
  Layers,
  ArrowRight,
  MessageCircleWarning,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: () => void;
}

const TOOL_ITEMS: {
  mode: ToolMode;
  icon: React.ComponentType<{ className?: string }>;
  i18nKey: string;
}[] = [
  { mode: "select", icon: MousePointer2, i18nKey: "select" },
  { mode: "addFlow", icon: Plus, i18nKey: "addFlow" },
  { mode: "addContext", icon: Square, i18nKey: "addContext" },
  { mode: "addDomain", icon: Layers, i18nKey: "addDomain" },
  { mode: "addConnection", icon: ArrowRight, i18nKey: "addConnection" },
  { mode: "addHotspot", icon: MessageCircleWarning, i18nKey: "addHotspot" },
];

export function Toolbar({
  toolMode,
  onToolModeChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onImport,
}: ToolbarProps) {
  const t = useTranslations("domainModeling.toolbar");

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
        {/* ツールモード */}
        {TOOL_ITEMS.map(({ mode, icon: Icon, i18nKey }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={toolMode === mode ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolModeChange(mode)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t(i18nKey)}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* ズーム */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("zoomOut")}</p></TooltipContent>
        </Tooltip>

        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("zoomIn")}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("resetView")}</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("undo")}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("redo")}</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* エクスポート/インポート */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("export")}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImport}>
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>{t("import")}</p></TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
