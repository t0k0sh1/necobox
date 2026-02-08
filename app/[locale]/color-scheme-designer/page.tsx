"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PropertyPanel } from "@/app/components/color-scheme/PropertyPanel";
import { BlocksPreview } from "@/app/components/color-scheme/BlocksPreview";
import { LandingPreview } from "@/app/components/color-scheme/LandingPreview";
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
} from "@/lib/utils/color-scheme-designer";
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

  /** bg と border が同一 DOM に配置される要素ペア（bg クリック時に border も同時マッピング） */
  const BG_BORDER_PAIRS: Record<string, string> = useMemo(
    () => ({
      "page-bg": "page-border",
      "nav-bg": "nav-border",
      "feature-card-bg": "feature-card-border",
      "testimonial-card-bg": "testimonial-card-border",
      "footer-bg": "footer-border",
    }),
    []
  );

  // プレビュー要素クリック時の紐付け処理
  const handleElementClick = useCallback(
    (elementId: string) => {
      if (!linkingColorId) return;
      setColorMappings((prev) => {
        const next = { ...prev, [elementId]: linkingColorId };
        // bg と border が同一 DOM の場合、border も同時に紐付ける
        const pairedBorder = BG_BORDER_PAIRS[elementId];
        if (pairedBorder) {
          next[pairedBorder] = linkingColorId;
        }
        return next;
      });
      setLinkingColorId(null);
    },
    [linkingColorId, BG_BORDER_PAIRS]
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
    <div className="flex flex-col h-full">
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
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pb-40 min-h-0">
        {/* プレビュー領域 */}
        <div className="hidden lg:block flex-1 min-w-0 overflow-y-auto">
          <div className="flex justify-end mb-2">
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
          <div className={previewDark ? "dark" : ""}>
            <LandingPreview
              colors={colors}
              colorMappings={colorMappings}
              linkingColorId={linkingColorId}
              onElementClick={handleElementClick}
              previewDark={previewDark}
            />
          </div>
        </div>

        {/* プロパティパネル */}
        <div className="w-full lg:w-[400px] shrink-0 overflow-y-auto">
          <PropertyPanel
            schemeName={schemeName}
            onSchemeNameChange={setSchemeName}
            colors={colors}
            onColorsChange={setColors}
            scheme={scheme}
            linkingColorId={linkingColorId}
            onStartLinking={handleStartLinking}
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
