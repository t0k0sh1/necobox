"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SchemeColor, ColorGroup } from "@/lib/utils/color-scheme-designer";
import { generateId } from "@/lib/utils/color-scheme-designer";
import { hexToRgb, rgbToHex } from "@/lib/utils/color-converter";
import { HexColorPicker } from "react-colorful";
import { ChevronDown, ChevronUp, Crosshair, Moon, Plus, Sun, Trash2, Wand2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ELEMENT_LABELS } from "./BlogPreview";

// --- グレースケールプリセット定義 ---

interface GrayscalePresetColor {
  name: string;
  hex: string;
  hex2: string;
}

export interface GrayscalePreset {
  key: string;
  colors: GrayscalePresetColor[];
  mappings: Record<string, number>;
}

/** 全プリセット共通の要素→色インデックスマッピング */
const GRAYSCALE_ELEMENT_MAPPINGS: Record<string, number> = {
  // 0: BG（背景白）
  "page-bg": 0,
  "header-bg": 0,
  "article-bg": 0,
  "sidebar-bg": 0,
  // 1: Surface（サブ背景）
  "footer-bg": 1,
  "article-blockquote-bg": 1,
  "article-code-bg": 1,
  // 2: Subtle（薄いグレー）
  "article-tag-bg": 2,
  "sidebar-category-bg": 2,
  "sidebar-profile-avatar": 2,
  // 3: Border（ボーダー）
  "page-border": 3,
  "header-border": 3,
  "article-border": 3,
  "sidebar-border": 3,
  "footer-border": 3,
  "footer-divider": 3,
  "article-blockquote-border": 3,
  // 4: Muted（控えめテキスト）
  "article-meta": 4,
  "sidebar-profile-bio": 4,
  "header-nav-link": 4,
  "footer-text": 4,
  "footer-link": 4,
  "sidebar-category-count": 4,
  "article-blockquote-text": 4,
  // 5: Default（本文テキスト）
  "article-body": 5,
  "sidebar-category-text": 5,
  "article-tag-text": 5,
  "article-code-text": 5,
  // 6: Emphasis（見出し・強調）
  "article-title": 6,
  "article-h2": 6,
  "header-logo": 6,
  "header-nav-active": 6,
  "sidebar-heading": 6,
  "sidebar-profile-name": 6,
  "article-link": 6,
};

// --- パレットプリセット定義 ---

export interface PalettePreset {
  key: string;
  colors: Array<{ name: string; hex: string }>;
  mappings: Record<string, number>;
}

/** パレットプリセット共通の要素→色インデックスマッピング */
const PALETTE_ELEMENT_MAPPINGS: Record<string, number> = {
  // 0: Primary（メインアクセント）
  "header-logo": 0,
  "header-nav-active": 0,
  "article-link": 0,
  "article-tag-text": 0,
  // 1: Primary Soft（メインアクセントの薄い背景）
  "article-tag-bg": 1,
  // 2: Secondary（補色）
  "article-blockquote-border": 2,
  "article-h2": 2,
  // 3: Accent（アクセント）
  "article-code-text": 3,
  "footer-link": 3,
  // 4: Accent Soft（アクセントの薄い背景）
  "sidebar-profile-avatar": 4,
};

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    key: "ocean",
    colors: [
      { name: "Primary", hex: "#2563eb" },
      { name: "Primary Soft", hex: "#dbeafe" },
      { name: "Secondary", hex: "#7c3aed" },
      { name: "Accent", hex: "#f59e0b" },
      { name: "Accent Soft", hex: "#fef3c7" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
  {
    key: "forest",
    colors: [
      { name: "Primary", hex: "#059669" },
      { name: "Primary Soft", hex: "#d1fae5" },
      { name: "Secondary", hex: "#0891b2" },
      { name: "Accent", hex: "#e11d48" },
      { name: "Accent Soft", hex: "#ffe4e6" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
  {
    key: "sunset",
    colors: [
      { name: "Primary", hex: "#dc2626" },
      { name: "Primary Soft", hex: "#fee2e2" },
      { name: "Secondary", hex: "#ea580c" },
      { name: "Accent", hex: "#7c3aed" },
      { name: "Accent Soft", hex: "#ede9fe" },
    ],
    mappings: PALETTE_ELEMENT_MAPPINGS,
  },
];

export const GRAYSCALE_PRESETS: GrayscalePreset[] = [
  {
    key: "neutral",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#0a0a0a" },
      { name: "Surface", hex: "#f9fafb", hex2: "#111827" },
      { name: "Subtle", hex: "#f3f4f6", hex2: "#1f2937" },
      { name: "Border", hex: "#e5e7eb", hex2: "#374151" },
      { name: "Muted", hex: "#9ca3af", hex2: "#9ca3af" },
      { name: "Default", hex: "#4b5563", hex2: "#d1d5db" },
      { name: "Emphasis", hex: "#111827", hex2: "#f9fafb" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
  {
    key: "warm",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#0c0a09" },
      { name: "Surface", hex: "#fafaf9", hex2: "#1c1917" },
      { name: "Subtle", hex: "#f5f5f4", hex2: "#292524" },
      { name: "Border", hex: "#e7e5e4", hex2: "#44403c" },
      { name: "Muted", hex: "#a8a29e", hex2: "#a8a29e" },
      { name: "Default", hex: "#57534e", hex2: "#d6d3d1" },
      { name: "Emphasis", hex: "#1c1917", hex2: "#fafaf9" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
  {
    key: "cool",
    colors: [
      { name: "White", hex: "#ffffff", hex2: "#020617" },
      { name: "Surface", hex: "#f8fafc", hex2: "#0f172a" },
      { name: "Subtle", hex: "#f1f5f9", hex2: "#1e293b" },
      { name: "Border", hex: "#e2e8f0", hex2: "#334155" },
      { name: "Muted", hex: "#94a3b8", hex2: "#94a3b8" },
      { name: "Default", hex: "#475569", hex2: "#cbd5e1" },
      { name: "Emphasis", hex: "#0f172a", hex2: "#f8fafc" },
    ],
    mappings: GRAYSCALE_ELEMENT_MAPPINGS,
  },
];

interface PaletteEditorProps {
  colors: SchemeColor[];
  onChange: (colors: SchemeColor[]) => void;
  linkingColorId: string | null;
  onStartLinking: (colorId: string) => void;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  onAutoGeneratePalette: (preset: PalettePreset) => void;
  onAutoGenerateGrayscale: (preset: GrayscalePreset) => void;
}

export function PaletteEditor({ colors, onChange, linkingColorId, onStartLinking, colorMappings, onRemoveMapping, onAutoGeneratePalette, onAutoGenerateGrayscale }: PaletteEditorProps) {
  const t = useTranslations("colorSchemeDesigner");

  const paletteColors = colors.filter((c) => c.group === "palette");
  const grayscaleColors = colors.filter((c) => c.group === "grayscale");

  const updateColor = (id: string, updates: Partial<SchemeColor>) => {
    onChange(colors.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeColor = (id: string) => {
    onChange(colors.filter((c) => c.id !== id));
  };

  // グループ内で色の順番を入れ替える
  const moveColor = (id: string, direction: "up" | "down") => {
    const idx = colors.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const group = colors[idx].group;

    // 同グループ内で隣接するアイテムを探す
    const step = direction === "up" ? -1 : 1;
    let targetIdx = idx + step;
    while (targetIdx >= 0 && targetIdx < colors.length && colors[targetIdx].group !== group) {
      targetIdx += step;
    }
    if (targetIdx < 0 || targetIdx >= colors.length) return;

    const next = [...colors];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    onChange(next);
  };

  const addColor = (group: ColorGroup) => {
    const count =
      group === "palette" ? paletteColors.length : grayscaleColors.length;
    const newColor: SchemeColor =
      group === "grayscale"
        ? {
            id: generateId(),
            hex: "#f5f5f5",
            hex2: "#333333",
            name: `Gray ${count + 1}`,
            group,
          }
        : {
            id: generateId(),
            hex: "#6366f1",
            name: `Color ${count + 1}`,
            group,
          };
    onChange([...colors, newColor]);
  };

  return (
    <div className="space-y-4">
      {/* パレット */}
      <ColorGroupSection
        label={t("palette")}
        colors={paletteColors}
        onUpdate={updateColor}
        onRemove={removeColor}
        onMove={moveColor}
        onAdd={() => addColor("palette")}
        addLabel={t("addColor")}
        linkingColorId={linkingColorId}
        onStartLinking={onStartLinking}
        colorMappings={colorMappings}
        onRemoveMapping={onRemoveMapping}
        onAutoGeneratePalette={onAutoGeneratePalette}
        t={t}
      />

      {/* グレースケール */}
      <GrayscaleGroupSection
        label={t("grayscale")}
        colors={grayscaleColors}
        onUpdate={updateColor}
        onRemove={removeColor}
        onMove={moveColor}
        onAdd={() => addColor("grayscale")}
        addLabel={t("addGrayscale")}
        linkingColorId={linkingColorId}
        onStartLinking={onStartLinking}
        colorMappings={colorMappings}
        onRemoveMapping={onRemoveMapping}
        onAutoGenerateGrayscale={onAutoGenerateGrayscale}
        t={t}
      />
    </div>
  );
}

// --- グループセクション ---

function ColorGroupSection({
  label,
  colors,
  onUpdate,
  onRemove,
  onMove,
  onAdd,
  addLabel,
  linkingColorId,
  onStartLinking,
  colorMappings,
  onRemoveMapping,
  onAutoGeneratePalette,
  t,
}: {
  label: string;
  colors: SchemeColor[];
  onUpdate: (id: string, updates: Partial<SchemeColor>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onAdd: () => void;
  addLabel: string;
  linkingColorId: string | null;
  onStartLinking: (colorId: string) => void;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  onAutoGeneratePalette: (preset: PalettePreset) => void;
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}) {
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [confirmPreset, setConfirmPreset] = useState<PalettePreset | null>(null);

  const presetLabelKey = (key: string) => {
    if (key === "ocean") return t("presetOcean");
    if (key === "forest") return t("presetForest");
    return t("presetSunset");
  };

  const handlePresetSelect = (preset: PalettePreset) => {
    setPresetPopoverOpen(false);
    if (colors.length > 0) {
      setConfirmPreset(preset);
    } else {
      onAutoGeneratePalette(preset);
    }
  };

  const handleConfirm = () => {
    if (confirmPreset) {
      onAutoGeneratePalette(confirmPreset);
      setConfirmPreset(null);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide">
          {label}
        </Label>
        <Popover open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] gap-1 px-2"
            >
              <Wand2 className="w-3 h-3" />
              {t("autoGenerate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-2" align="end">
            <div className="space-y-1">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex gap-0.5 shrink-0">
                    {preset.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-sm border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {presetLabelKey(preset.key)}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {colors.map((color, index) => (
        <div key={color.id}>
          <div className="flex items-center gap-2">
            {/* 上下移動ボタン */}
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default"
                onClick={() => onMove(color.id, "up")}
                disabled={index === 0}
                aria-label={t("moveUp")}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default"
                onClick={() => onMove(color.id, "down")}
                disabled={index === colors.length - 1}
                aria-label={t("moveDown")}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <ColorPickerPopover
              color={color}
              onUpdate={(updates) => onUpdate(color.id, updates)}
            />
            <Input
              value={color.name}
              onChange={(e) => onUpdate(color.id, { name: e.target.value })}
              className="h-8 text-xs flex-1 min-w-0"
              placeholder={t("colorName")}
            />
            <span className="text-xs font-mono text-gray-500 w-16 shrink-0 text-center">
              {color.hex}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 shrink-0 ${linkingColorId === color.id ? "text-blue-500 bg-blue-50 dark:bg-blue-950" : "text-gray-400 hover:text-gray-600"}`}
              onClick={() => onStartLinking(color.id)}
              aria-label={t("linkColor")}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700"
              onClick={() => onRemove(color.id)}
              aria-label={t("delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ColorMappingsList
            colorId={color.id}
            colorMappings={colorMappings}
            onRemoveMapping={onRemoveMapping}
            t={t}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        {addLabel}
      </Button>

      {/* 置換確認ダイアログ */}
      <AlertDialog
        open={confirmPreset !== null}
        onOpenChange={(open) => { if (!open) setConfirmPreset(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("paletteAutoGenerateConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("paletteAutoGenerateConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmPreset(null)}>
              {t("paletteAutoGenerateConfirm.cancel")}
            </Button>
            <Button onClick={handleConfirm}>
              {t("paletteAutoGenerateConfirm.replace")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- グレースケール（2色）セクション ---

function GrayscaleGroupSection({
  label,
  colors,
  onUpdate,
  onRemove,
  onMove,
  onAdd,
  addLabel,
  linkingColorId,
  onStartLinking,
  colorMappings,
  onRemoveMapping,
  onAutoGenerateGrayscale,
  t,
}: {
  label: string;
  colors: SchemeColor[];
  onUpdate: (id: string, updates: Partial<SchemeColor>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onAdd: () => void;
  addLabel: string;
  linkingColorId: string | null;
  onStartLinking: (colorId: string) => void;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  onAutoGenerateGrayscale: (preset: GrayscalePreset) => void;
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}) {
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [confirmPreset, setConfirmPreset] = useState<GrayscalePreset | null>(null);

  const presetLabelKey = (key: string) => {
    if (key === "neutral") return t("presetNeutral");
    if (key === "warm") return t("presetWarm");
    return t("presetCool");
  };

  const handlePresetSelect = (preset: GrayscalePreset) => {
    setPresetPopoverOpen(false);
    if (colors.length > 0) {
      setConfirmPreset(preset);
    } else {
      onAutoGenerateGrayscale(preset);
    }
  };

  const handleConfirm = () => {
    if (confirmPreset) {
      onAutoGenerateGrayscale(confirmPreset);
      setConfirmPreset(null);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide">
          {label}
        </Label>
        <Popover open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] gap-1 px-2"
            >
              <Wand2 className="w-3 h-3" />
              {t("autoGenerate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-2" align="end">
            <div className="space-y-1">
              {GRAYSCALE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className="w-full flex flex-col items-start gap-1 px-2 py-1.5 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {presetLabelKey(preset.key)}
                  </span>
                  <div className="flex gap-0.5">
                    {preset.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-sm border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* ヘッダー行: Sun/Moon アイコンをカラーピッカー列の上に配置 */}
      {colors.length > 0 && (
        <div className="flex items-center gap-2">
          {/* 上下移動ボタン分のスペーサー */}
          <div className="w-5 shrink-0" />
          <div className="w-8 shrink-0 flex justify-center">
            <Sun className="w-3 h-3 text-amber-500" />
          </div>
          <div className="w-8 shrink-0 flex justify-center">
            <Moon className="w-3 h-3 text-indigo-400" />
          </div>
        </div>
      )}
      {colors.map((color, index) => (
        <div key={color.id}>
          <div className="flex items-center gap-2">
            {/* 上下移動ボタン */}
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default"
                onClick={() => onMove(color.id, "up")}
                disabled={index === 0}
                aria-label={t("moveUp")}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default"
                onClick={() => onMove(color.id, "down")}
                disabled={index === colors.length - 1}
                aria-label={t("moveDown")}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* ライトモード色 */}
            <ColorPickerPopover
              color={color}
              onUpdate={(updates) => onUpdate(color.id, updates)}
            />
            {/* ダークモード色 */}
            <ColorPickerPopover
              color={{ ...color, hex: color.hex2 ?? "#333333" }}
              onUpdate={(updates) =>
                onUpdate(color.id, updates.hex ? { hex2: updates.hex } : {})
              }
            />
            <Input
              value={color.name}
              onChange={(e) => onUpdate(color.id, { name: e.target.value })}
              className="h-8 text-xs flex-1 min-w-0"
              placeholder={t("colorName")}
            />
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 shrink-0 ${linkingColorId === color.id ? "text-blue-500 bg-blue-50 dark:bg-blue-950" : "text-gray-400 hover:text-gray-600"}`}
              onClick={() => onStartLinking(color.id)}
              aria-label={t("linkColor")}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700"
              onClick={() => onRemove(color.id)}
              aria-label={t("delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ColorMappingsList
            colorId={color.id}
            colorMappings={colorMappings}
            onRemoveMapping={onRemoveMapping}
            t={t}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        {addLabel}
      </Button>

      {/* 置換確認ダイアログ */}
      <AlertDialog
        open={confirmPreset !== null}
        onOpenChange={(open) => { if (!open) setConfirmPreset(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("autoGenerateConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("autoGenerateConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmPreset(null)}>
              {t("autoGenerateConfirm.cancel")}
            </Button>
            <Button onClick={handleConfirm}>
              {t("autoGenerateConfirm.replace")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Popover カラーピッカー ---

function ColorPickerPopover({
  color,
  onUpdate,
}: {
  color: SchemeColor;
  onUpdate: (updates: Partial<SchemeColor>) => void;
}) {
  const rgb = hexToRgb(color.hex);

  const handleHexInput = (v: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onUpdate({ hex: v.toLowerCase() });
    }
  };

  const handleRgb = (ch: "r" | "g" | "b", value: number) => {
    if (!rgb) return;
    const clamped = Math.max(0, Math.min(255, value));
    onUpdate({ hex: rgbToHex({ ...rgb, [ch]: clamped }) });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-8 h-8 rounded border shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow"
          style={{ backgroundColor: color.hex }}
          aria-label={color.name}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3 space-y-2" align="start">
        <HexColorPicker
          color={color.hex}
          onChange={(hex) => onUpdate({ hex })}
          style={{ width: "100%" }}
        />
        <div>
          <Label className="text-[9px] text-gray-400">HEX</Label>
          <Input
            key={color.hex}
            defaultValue={color.hex}
            onChange={(e) => handleHexInput(e.target.value)}
            className="h-7 text-xs font-mono"
            maxLength={7}
          />
        </div>
        {rgb && (
          <div className="grid grid-cols-3 gap-1.5">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch}>
                <Label className="text-[9px] text-gray-400 uppercase">
                  {ch}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) =>
                    handleRgb(ch, parseInt(e.target.value) || 0)
                  }
                  className="h-7 text-xs font-mono px-1.5"
                />
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// --- マッピング一覧 ---

function ColorMappingsList({
  colorId,
  colorMappings,
  onRemoveMapping,
  t,
}: {
  colorId: string;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}) {
  const [open, setOpen] = useState(false);

  // この色に紐づく要素を抽出
  const mappedElements = Object.entries(colorMappings)
    .filter(([, cId]) => cId === colorId)
    .map(([elementId]) => elementId);

  if (mappedElements.length === 0) return null;

  return (
    <div className="ml-7 mt-0.5 mb-1">
      <button
        type="button"
        className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
        onClick={() => setOpen(!open)}
      >
        {t("mappingCount", { count: mappedElements.length })}{" "}
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {mappedElements.map((elementId) => (
            <div
              key={elementId}
              className="flex items-center justify-between pl-2 pr-1 py-0.5 rounded text-[11px] bg-gray-50 dark:bg-gray-900"
            >
              <span className="text-gray-600 dark:text-gray-400">
                {ELEMENT_LABELS[elementId] ?? elementId}
              </span>
              <button
                type="button"
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
                onClick={() => onRemoveMapping(elementId)}
                aria-label={t("removeMapping", { element: ELEMENT_LABELS[elementId] ?? elementId })}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
