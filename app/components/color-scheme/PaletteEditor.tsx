"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SchemeColor, ColorGroup } from "@/lib/utils/color-scheme-designer";
import { generateId } from "@/lib/utils/color-scheme-designer";
import { hexToRgb, rgbToHex } from "@/lib/utils/color-converter";
import { HexColorPicker } from "react-colorful";
import { ChevronDown, ChevronUp, Crosshair, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaletteEditorProps {
  colors: SchemeColor[];
  onChange: (colors: SchemeColor[]) => void;
  linkingColorId: string | null;
  onStartLinking: (colorId: string) => void;
}

export function PaletteEditor({ colors, onChange, linkingColorId, onStartLinking }: PaletteEditorProps) {
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
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide">
        {label}
      </Label>
      {colors.map((color, index) => (
        <div key={color.id} className="flex items-center gap-2">
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
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide">
        {label}
      </Label>
      {colors.map((color, index) => (
        <div key={color.id} className="flex items-center gap-2">
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
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Sun className="w-3 h-3 text-amber-500" />
            <ColorPickerPopover
              color={color}
              onUpdate={(updates) => onUpdate(color.id, updates)}
            />
          </div>
          {/* ダークモード色 */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Moon className="w-3 h-3 text-indigo-400" />
            <ColorPickerPopover
              color={{ ...color, hex: color.hex2 ?? "#333333" }}
              onUpdate={(updates) =>
                onUpdate(color.id, updates.hex ? { hex2: updates.hex } : {})
              }
            />
          </div>
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
