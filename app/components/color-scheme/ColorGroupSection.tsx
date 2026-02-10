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
import type { SchemeColor, PalettePreset } from "@/lib/utils/color-scheme-designer";
import { PALETTE_PRESETS } from "@/lib/utils/color-scheme-presets";
import { ChevronDown, ChevronUp, Crosshair, Plus, Trash2, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { ColorMappingsList } from "./ColorMappingsList";

interface ColorGroupSectionProps {
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
}

export function ColorGroupSection({
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
}: ColorGroupSectionProps) {
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
