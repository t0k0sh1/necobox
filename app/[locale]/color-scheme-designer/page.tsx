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
import { Sun, Moon, AlertTriangle, Monitor } from "lucide-react";
import {
  type SchemeColor,
  type ColorScheme,
  type WorkingScheme,
  DEFAULT_SCHEME_NAME,
  generateId,
} from "@/lib/utils/color-scheme-designer";
import type { GrayscalePreset, PalettePreset } from "@/lib/utils/color-scheme-designer";
import { useColorSchemeStorage } from "@/lib/hooks/useColorSchemeStorage";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

/** main 要素の min-height を 0 にしてページ全体のスクロールを抑止する */
function useOverrideMainMinHeight() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.style.minHeight = "0";
    return () => { if (main) main.style.minHeight = ""; };
  }, []);
}

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
  const [showContrastWarnings, setShowContrastWarnings] = useState(false);

  const storage = useColorSchemeStorage();
  const undoRedo = useUndoRedo<WorkingScheme>();
  const [undoRedoVersion, setUndoRedoVersion] = useState(0);
  useOverrideMainMinHeight();

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

  // --- Undo/Redo ---

  // デバウンス付き履歴保存（カラーピッカーの連続操作を1つにまとめる）
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedRef = useRef<WorkingScheme | null>(null);
  const pendingFirstRef = useRef<WorkingScheme | null>(null);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingFirstRef.current = null;
  }, []);

  const pushUndoDebounced = useCallback(
    (ws: WorkingScheme) => {
      // デバウンスウィンドウの最初の値をキャプチャ
      if (!debounceTimerRef.current) {
        pendingFirstRef.current = ws;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const first = pendingFirstRef.current;
        pendingFirstRef.current = null;
        if (!first) return;
        // lastPushedRef と同一ならスキップ（重複防止）
        const last = lastPushedRef.current;
        if (last && last.name === first.name && last.colors === first.colors && last.colorMappings === first.colorMappings) {
          return;
        }
        undoRedo.push(first);
        lastPushedRef.current = first;
        setUndoRedoVersion((v) => v + 1);
      }, 300);
    },
    [undoRedo]
  );

  // アンマウント時にデバウンスタイマーをクリア
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ワーキングスキーム変更時に履歴保存（復元後のみ）
  const prevWorkingRef = useRef<WorkingScheme | null>(null);
  const isUndoRedoingRef = useRef(false);

  useEffect(() => {
    if (!restoredRef.current) return;
    // undo/redo 操作中はスキップ
    if (isUndoRedoingRef.current) {
      isUndoRedoingRef.current = false;
      prevWorkingRef.current = workingScheme;
      return;
    }
    // 前回の状態を push（現在の変更前の状態を保存）
    const prev = prevWorkingRef.current;
    if (prev && (prev.name !== workingScheme.name || prev.colors !== workingScheme.colors || prev.colorMappings !== workingScheme.colorMappings)) {
      pushUndoDebounced(prev);
    }
    prevWorkingRef.current = workingScheme;
  }, [workingScheme, pushUndoDebounced]);

  const handleUndo = useCallback(() => {
    clearDebounceTimer();
    const prev = undoRedo.undo(workingScheme);
    if (!prev) return;
    isUndoRedoingRef.current = true;
    setSchemeName(prev.name);
    setColors(prev.colors);
    setColorMappings(prev.colorMappings);
    lastPushedRef.current = null;
    setUndoRedoVersion((v) => v + 1);
  }, [undoRedo, workingScheme, clearDebounceTimer]);

  const handleRedo = useCallback(() => {
    clearDebounceTimer();
    const next = undoRedo.redo(workingScheme);
    if (!next) return;
    isUndoRedoingRef.current = true;
    setSchemeName(next.name);
    setColors(next.colors);
    setColorMappings(next.colorMappings);
    lastPushedRef.current = null;
    setUndoRedoVersion((v) => v + 1);
  }, [undoRedo, workingScheme, clearDebounceTimer]);

  // キーボードショートカット: Ctrl+Z / Ctrl+Shift+Z (Cmd on Mac)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      // 入力フィールド内ではブラウザのデフォルト undo を優先
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  // canUndo / canRedo の状態（undoRedoVersion で再評価）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canUndo = useMemo(() => undoRedo.canUndo(), [undoRedoVersion]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canRedo = useMemo(() => undoRedo.canRedo(), [undoRedoVersion]);

  // スキームをUIに適用するヘルパー（履歴もクリア）
  const applyScheme = useCallback(
    (ws: WorkingScheme) => {
      clearDebounceTimer();
      isUndoRedoingRef.current = true;
      setSchemeName(ws.name);
      setColors(ws.colors);
      setColorMappings(ws.colorMappings);
      storage.markAsSaved(ws);
      undoRedo.clear();
      lastPushedRef.current = null;
      prevWorkingRef.current = null;
      setUndoRedoVersion((v) => v + 1);
    },
    [storage, undoRedo, clearDebounceTimer]
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
          // パレット色で既に割り当て済みの要素は保持し、未割り当てのみプリセットで埋める
          if (!(elementId in next)) {
            next[elementId] = newGrayscaleColors[colorIndex].id;
          }
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
    clearDebounceTimer();
    isUndoRedoingRef.current = true;
    storage.setActiveSchemeId(null);
    setSchemeName(DEFAULT_SCHEME_NAME);
    setColors([]);
    setColorMappings({});
    storage.markAsSaved({ name: DEFAULT_SCHEME_NAME, colors: [], colorMappings: {} });
    undoRedo.clear();
    lastPushedRef.current = null;
    prevWorkingRef.current = null;
    setUndoRedoVersion((v) => v + 1);
  }, [isDirty, storage, undoRedo, clearDebounceTimer]);

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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden">
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

      {/* モバイル非対応メッセージ（768px未満） */}
      <div className="flex md:hidden flex-1 items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Monitor className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {t("mobileUnsupported")}
          </p>
        </div>
      </div>

      {/* メインコンテンツ: 左プレビュー + 右プロパティパネル（768px以上） */}
      <div className="hidden md:flex flex-1 flex-col md:flex-row gap-4 p-4 min-h-0">
        {/* プレビュー領域 */}
        <div className="hidden md:flex md:flex-col flex-1 min-w-0 pb-36">
          <div className="flex justify-end gap-2 mb-2 shrink-0">
            <Button
              variant={showContrastWarnings ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowContrastWarnings((v) => !v)}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("contrastWarnings")}
            </Button>
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
              showContrastWarnings={showContrastWarnings}
            />
          </div>
        </div>

        {/* プロパティパネル */}
        <div className="w-full md:w-[360px] flex-1 md:flex-none md:shrink-0 overflow-y-auto min-h-0 pb-40">
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
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
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
