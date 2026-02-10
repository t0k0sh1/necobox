"use client";

import type { SchemeColor, ColorGroup, PalettePreset, GrayscalePreset } from "@/lib/utils/color-scheme-designer";
import { generateId } from "@/lib/utils/color-scheme-designer";
import { useTranslations } from "next-intl";
import { ColorGroupSection } from "./ColorGroupSection";
import { GrayscaleGroupSection } from "./GrayscaleGroupSection";

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
