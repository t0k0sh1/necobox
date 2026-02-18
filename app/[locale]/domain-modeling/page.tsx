"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DomainModelingCanvas,
  type CanvasHandle,
} from "@/app/components/domain-modeling/DomainModelingCanvas";
import { Toolbar } from "@/app/components/domain-modeling/Toolbar";
import { BusinessModelCanvas } from "@/app/components/domain-modeling/BusinessModelCanvas";
import { ExampleMapping } from "@/app/components/domain-modeling/ExampleMapping";
import { useDomainModelingBoard } from "@/lib/hooks/useDomainModelingBoard";
import type { ToolMode, DomainModelingBoard, BmcBoard, ExampleMappingBoard } from "@/lib/utils/domain-modeling";
import { createEmptyBmcBoard, createEmptyExampleMappingBoard } from "@/lib/utils/domain-modeling";
import { useTranslations } from "next-intl";
import { useState, useCallback, useRef, useEffect } from "react";

/** main 要素の min-height を 0 にしてページ全体のスクロールを抑止する */
function useOverrideMainMinHeight() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.style.minHeight = "0";
    return () => {
      if (main) main.style.minHeight = "";
    };
  }, []);
}

export default function DomainModelingPage() {
  const t = useTranslations("domainModeling");
  useOverrideMainMinHeight();

  const {
    board,
    updateBoard,
    setBoard,
    canUndo,
    canRedo,
    undo,
    redo,
    exportToJson,
    importFromJson,
  } = useDomainModelingBoard();

  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [importDialog, setImportDialog] = useState<{
    board: DomainModelingBoard;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);

  const handleToolModeReset = useCallback(() => {
    setToolMode("select");
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const imported = await importFromJson(file);
      if (imported) {
        setImportDialog({ board: imported });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [importFromJson]
  );

  const handleImportConfirm = useCallback(() => {
    if (importDialog) {
      setBoard(importDialog.board);
      setImportDialog(null);
    }
  }, [importDialog, setBoard]);

  const handleBmcChange = useCallback(
    (bmc: BmcBoard) => {
      updateBoard({ ...board, bmc, updatedAt: new Date().toISOString() });
    },
    [board, updateBoard]
  );

  const handleBmcSet = useCallback(
    (bmc: BmcBoard) => {
      setBoard({ ...board, bmc });
    },
    [board, setBoard]
  );

  const handleExampleMappingChange = useCallback(
    (exampleMapping: ExampleMappingBoard) => {
      updateBoard({ ...board, exampleMapping, updatedAt: new Date().toISOString() });
    },
    [board, updateBoard]
  );

  // キーボードショートカット（Undo/Redo）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />

      <Tabs defaultValue="bmc" className="flex flex-col flex-1 min-h-0">
        {/* タブリスト */}
        <div className="flex items-center justify-center px-4 pt-2">
          <TabsList>
            <TabsTrigger value="bmc">{t("tabs.bmc")}</TabsTrigger>
            <TabsTrigger value="eventStorming">{t("tabs.eventStorming")}</TabsTrigger>
            <TabsTrigger value="exampleMapping">{t("tabs.exampleMapping")}</TabsTrigger>
          </TabsList>
        </div>

        {/* イベントストーミングタブ */}
        <TabsContent
          value="eventStorming"
          forceMount
          className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
        >
          {/* ツールバー */}
          <div className="flex items-center justify-center px-4 py-2">
            <Toolbar
              toolMode={toolMode}
              onToolModeChange={setToolMode}
              onZoomIn={() => canvasRef.current?.zoomIn()}
              onZoomOut={() => canvasRef.current?.zoomOut()}
              onResetView={() => canvasRef.current?.resetView()}
              zoom={board.viewport.zoom}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onExport={exportToJson}
              onImport={handleImportClick}
            />
          </div>

          {/* キャンバス */}
          <div className="flex-1 min-h-0 relative">
            <DomainModelingCanvas
              ref={canvasRef}
              board={board}
              toolMode={toolMode}
              onBoardChange={updateBoard}
              onBoardSet={setBoard}
              onToolModeReset={handleToolModeReset}
            />
          </div>
        </TabsContent>

        {/* BMCタブ */}
        <TabsContent
          value="bmc"
          forceMount
          className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
        >
          <div className="flex-1 min-h-0 relative">
            <BusinessModelCanvas
              bmc={board.bmc ?? createEmptyBmcBoard()}
              onBmcChange={handleBmcChange}
              onBmcSet={handleBmcSet}
            />
          </div>
        </TabsContent>

        {/* 実例マッピングタブ */}
        <TabsContent
          value="exampleMapping"
          forceMount
          className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
        >
          <ExampleMapping
            board={board.exampleMapping ?? createEmptyExampleMappingBoard()}
            onBoardChange={handleExampleMappingChange}
          />
        </TabsContent>

      </Tabs>

      {/* ファイル入力（非表示） */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* インポート確認ダイアログ */}
      <AlertDialog
        open={!!importDialog}
        onOpenChange={(open) => !open && setImportDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("importConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("importConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              {t("importConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
