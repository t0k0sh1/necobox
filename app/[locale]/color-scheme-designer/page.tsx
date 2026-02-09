"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PropertyPanel } from "@/app/components/color-scheme/PropertyPanel";
import { BlocksPreview } from "@/app/components/color-scheme/BlocksPreview";
import { BlogPreview } from "@/app/components/color-scheme/BlogPreview";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import {
  type SchemeColor,
  type ColorScheme,
  type WorkingScheme,
  DEFAULT_SCHEME_NAME,
  generateId,
} from "@/lib/utils/color-scheme-designer";
import type { GrayscalePreset, PalettePreset } from "@/app/components/color-scheme/PaletteEditor";
import { useColorSchemeStorage } from "@/lib/hooks/useColorSchemeStorage";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

type PendingAction =
  | { type: "load"; schemeId: string }
  | { type: "new" }
  | null;

export default function ColorSchemeDesignerPage() {
  const t = useTranslations("colorSchemeDesigner");

  const [schemeName, setSchemeName] = useState(DEFAULT_SCHEME_NAME);
  const [colors, setColors] = useState<SchemeColor[]>([]);
  const [colorMappings, setColorMappings] = useState<Record<string, string>>(
    {}
  );
  const [linkingColorId, setLinkingColorId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [previewDark, setPreviewDark] = useState(false);

  const storage = useColorSchemeStorage();

  // ワーキングスキームを構築
  const workingScheme = useMemo<WorkingScheme>(
    () => ({ name: schemeName, colors, colorMappings }),
    [schemeName, colors, colorMappings]
  );

  const scheme = useMemo<ColorScheme>(
    () => ({ name: schemeName, colors }),
    [schemeName, colors]
  );

  const isDirty = storage.checkDirty(workingScheme);
  const restoredRef = useRef(false);

  // 初回ロード: ドラフト → lastActiveScheme の順で復元
  useEffect(() => {
    if (!storage.isInitialized || restoredRef.current) return;
    restoredRef.current = true;

    // ドラフトがあればそれを優先復元（未保存の編集中状態）
    const draft = storage.loadDraftState();
    if (draft) {
      setSchemeName(draft.scheme.name);
      setColors(draft.scheme.colors);
      setColorMappings(draft.scheme.colorMappings);
      if (draft.activeSchemeId) {
        storage.setActiveSchemeId(draft.activeSchemeId);
      }
      if (draft.activeSchemeId) {
        const saved = storage.loadScheme(draft.activeSchemeId);
        if (saved) {
          storage.markAsSaved(saved);
        }
      }
      return;
    }
    // ドラフトがなければ lastActiveScheme を復元
    const last = storage.getLastActiveScheme();
    if (last) {
      setSchemeName(last.name);
      setColors(last.colors);
      setColorMappings(last.colorMappings);
      storage.markAsSaved(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage.isInitialized]);

  // ワーキングステートを自動保存（復元完了後のみ）
  const { saveDraftState } = storage;
  useEffect(() => {
    if (!restoredRef.current) return;
    saveDraftState(workingScheme);
  }, [workingScheme, saveDraftState]);

  // ダッシュボード風レイアウト: ビューポートに制約しページスクロールを防止
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = body.querySelector("main");
    html.style.overflow = "hidden";
    body.style.maxHeight = "100vh";
    body.style.overflow = "hidden";
    // main の min-height: auto がコンテンツサイズを強制するため 0 に上書き
    if (main) main.style.minHeight = "0";
    return () => {
      html.style.overflow = "";
      body.style.maxHeight = "";
      body.style.overflow = "";
      if (main) main.style.minHeight = "";
    };
  }, []);

  // スキームをUIに適用するヘルパー
  const applyScheme = useCallback(
    (ws: WorkingScheme) => {
      setSchemeName(ws.name);
      setColors(ws.colors);
      setColorMappings(ws.colorMappings);
      storage.markAsSaved(ws);
    },
    [storage]
  );

  // リンクモード開始/解除（トグル）
  const handleStartLinking = useCallback((colorId: string) => {
    setLinkingColorId((prev) => (prev === colorId ? null : colorId));
  }, []);

  // プレビュー要素クリック時の紐付け処理
  const handleElementClick = useCallback(
    (elementId: string) => {
      if (!linkingColorId) return;
      setColorMappings((prev) => ({
        ...prev,
        [elementId]: linkingColorId,
      }));
      setLinkingColorId(null);
    },
    [linkingColorId]
  );

  // マッピング解除ハンドラー
  const handleRemoveMapping = useCallback((elementId: string) => {
    setColorMappings((prev) => {
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  // パレット自動生成ハンドラー
  const handleAutoGeneratePalette = useCallback(
    (preset: PalettePreset) => {
      const newPaletteColors: SchemeColor[] = preset.colors.map((c) => ({
        id: generateId(),
        hex: c.hex,
        name: c.name,
        group: "palette" as const,
      }));

      const oldPaletteIds = new Set(
        colors.filter((c) => c.group === "palette").map((c) => c.id)
      );

      setColors((prev) => [
        ...newPaletteColors,
        ...prev.filter((c) => c.group !== "palette"),
      ]);

      setColorMappings((prev) => {
        const next: Record<string, string> = {};
        for (const [elementId, colorId] of Object.entries(prev)) {
          if (!oldPaletteIds.has(colorId)) {
            next[elementId] = colorId;
          }
        }
        for (const [elementId, colorIndex] of Object.entries(preset.mappings)) {
          next[elementId] = newPaletteColors[colorIndex].id;
        }
        return next;
      });
    },
    [colors]
  );

  // グレースケール自動生成ハンドラー
  const handleAutoGenerateGrayscale = useCallback(
    (preset: GrayscalePreset) => {
      // プリセットから新しい SchemeColor を生成
      const newGrayscaleColors: SchemeColor[] = preset.colors.map((c) => ({
        id: generateId(),
        hex: c.hex,
        hex2: c.hex2,
        name: c.name,
        group: "grayscale" as const,
      }));

      // 旧グレースケール色 ID を記録（マッピング削除用）
      const oldGrayscaleIds = new Set(
        colors.filter((c) => c.group === "grayscale").map((c) => c.id)
      );

      // グレースケール色を差し替え
      setColors((prev) => [
        ...prev.filter((c) => c.group !== "grayscale"),
        ...newGrayscaleColors,
      ]);

      // マッピングを更新: 旧グレースケール参照を除去し、プリセットの割り当てを追加
      setColorMappings((prev) => {
        const next: Record<string, string> = {};
        for (const [elementId, colorId] of Object.entries(prev)) {
          if (!oldGrayscaleIds.has(colorId)) {
            next[elementId] = colorId;
          }
        }
        for (const [elementId, colorIndex] of Object.entries(preset.mappings)) {
          // パレット色で既に割り当て済みの要素は上書きする
          next[elementId] = newGrayscaleColors[colorIndex].id;
        }
        return next;
      });
    },
    [colors]
  );

  // --- スキーム管理ハンドラー ---

  const handleSave = useCallback(() => {
    storage.saveScheme(workingScheme);
    storage.clearDraftState();
  }, [storage, workingScheme]);

  const handleSaveAsNew = useCallback(() => {
    storage.saveAsNewScheme(workingScheme);
    storage.clearDraftState();
  }, [storage, workingScheme]);

  const handleNew = useCallback(() => {
    if (isDirty) {
      setPendingAction({ type: "new" });
      return;
    }
    storage.setActiveSchemeId(null);
    setSchemeName(DEFAULT_SCHEME_NAME);
    setColors([]);
    setColorMappings({});
    storage.markAsSaved({ name: DEFAULT_SCHEME_NAME, colors: [], colorMappings: {} });
  }, [isDirty, storage]);

  const handleLoad = useCallback(
    (schemeId: string) => {
      if (isDirty) {
        setPendingAction({ type: "load", schemeId });
        return;
      }
      const loaded = storage.loadScheme(schemeId);
      if (loaded) {
        applyScheme(loaded);
        storage.setActiveSchemeId(schemeId);
      }
    },
    [isDirty, storage, applyScheme]
  );

  const handleDelete = useCallback(() => {
    if (!storage.activeSchemeId) return;
    storage.deleteScheme(storage.activeSchemeId);
    setSchemeName(DEFAULT_SCHEME_NAME);
    setColors([]);
    setColorMappings({});
    storage.markAsSaved({ name: DEFAULT_SCHEME_NAME, colors: [], colorMappings: {} });
  }, [storage]);

  // --- 未保存変更確認ダイアログ ---

  const executePendingAction = useCallback(
    (action: PendingAction) => {
      if (!action) return;
      if (action.type === "new") {
        storage.setActiveSchemeId(null);
        setSchemeName(DEFAULT_SCHEME_NAME);
        setColors([]);
        setColorMappings({});
        storage.markAsSaved({ name: DEFAULT_SCHEME_NAME, colors: [], colorMappings: {} });
      } else if (action.type === "load") {
        const loaded = storage.loadScheme(action.schemeId);
        if (loaded) {
          applyScheme(loaded);
          storage.setActiveSchemeId(action.schemeId);
        }
      }
    },
    [storage, applyScheme]
  );

  const handleDialogDiscard = useCallback(() => {
    executePendingAction(pendingAction);
    setPendingAction(null);
  }, [executePendingAction, pendingAction]);

  const handleDialogSaveAndSwitch = useCallback(() => {
    storage.saveScheme(workingScheme);
    executePendingAction(pendingAction);
    setPendingAction(null);
  }, [storage, workingScheme, executePendingAction, pendingAction]);

  const handleDialogCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="mt-4 mb-2">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* メインコンテンツ: 左プレビュー + 右プロパティパネル */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* プレビュー領域 */}
        <div className="hidden lg:flex lg:flex-col flex-1 min-w-0 pb-36">
          <div className="flex justify-end mb-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setPreviewDark((v) => !v)}
            >
              {previewDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              {previewDark ? t("previewLight") : t("previewDark")}
            </Button>
          </div>
          <div className={`flex-1 min-h-0 flex flex-col ${previewDark ? "dark" : ""}`}>
            <BlogPreview
              colors={colors}
              colorMappings={colorMappings}
              linkingColorId={linkingColorId}
              onElementClick={handleElementClick}
              previewDark={previewDark}
            />
          </div>
        </div>

        {/* プロパティパネル */}
        <div className="w-full lg:w-[400px] flex-1 lg:flex-none lg:shrink-0 overflow-y-auto min-h-0 pb-40">
          <PropertyPanel
            schemeName={schemeName}
            onSchemeNameChange={setSchemeName}
            colors={colors}
            onColorsChange={setColors}
            scheme={scheme}
            linkingColorId={linkingColorId}
            onStartLinking={handleStartLinking}
            colorMappings={colorMappings}
            onRemoveMapping={handleRemoveMapping}
            onAutoGeneratePalette={handleAutoGeneratePalette}
            onAutoGenerateGrayscale={handleAutoGenerateGrayscale}
            savedSchemes={storage.savedSchemes}
            activeSchemeId={storage.activeSchemeId}
            isDirty={isDirty}
            onSave={handleSave}
            onSaveAsNew={handleSaveAsNew}
            onNew={handleNew}
            onLoad={handleLoad}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* 画面下部固定カラーバー */}
      <BlocksPreview colors={colors} />

      {/* 未保存変更確認ダイアログ */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("unsavedChanges.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedChanges.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              {t("unsavedChanges.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDialogDiscard}>
              {t("unsavedChanges.discard")}
            </Button>
            <Button onClick={handleDialogSaveAndSwitch}>
              {t("unsavedChanges.saveAndSwitch")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
