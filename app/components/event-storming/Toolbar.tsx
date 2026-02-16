"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolMode } from "@/lib/utils/event-storming";
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
  label: string;
}[] = [
  { mode: "select", icon: MousePointer2, label: "選択" },
  { mode: "addFlow", icon: Plus, label: "フロー追加" },
  { mode: "addContext", icon: Square, label: "コンテキスト追加" },
  { mode: "addDomain", icon: Layers, label: "ドメイン追加" },
  { mode: "addConnection", icon: ArrowRight, label: "接続追加" },
  { mode: "addHotspot", icon: MessageCircleWarning, label: "ホットスポット追加" },
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
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
        {/* ツールモード */}
        {TOOL_ITEMS.map(({ mode, icon: Icon, label }) => (
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
              <p>{label}</p>
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
          <TooltipContent side="bottom"><p>ズームアウト</p></TooltipContent>
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
          <TooltipContent side="bottom"><p>ズームイン</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>表示リセット</p></TooltipContent>
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
          <TooltipContent side="bottom"><p>元に戻す</p></TooltipContent>
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
          <TooltipContent side="bottom"><p>やり直す</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* エクスポート/インポート */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>エクスポート</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImport}>
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>インポート</p></TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
