"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  SchemeColor,
  ColorScheme,
  SavedColorScheme,
} from "@/lib/utils/color-scheme-designer";
import type { GrayscalePreset, PalettePreset } from "@/lib/utils/color-scheme-designer";
import { PaletteEditor } from "./PaletteEditor";
import { AccessibilityInfo } from "./AccessibilityInfo";
import { ExportSection } from "./ExportSection";
import { SchemeSelector } from "./SchemeSelector";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, Undo2, Redo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PropertyPanelProps {
  schemeName: string;
  onSchemeNameChange: (name: string) => void;
  colors: SchemeColor[];
  onColorsChange: (colors: SchemeColor[]) => void;
  scheme: ColorScheme;
  linkingColorId: string | null;
  onStartLinking: (colorId: string) => void;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  onAutoGeneratePalette: (preset: PalettePreset) => void;
  onAutoGenerateGrayscale: (preset: GrayscalePreset) => void;
  // スキーム管理
  savedSchemes: SavedColorScheme[];
  activeSchemeId: string | null;
  isDirty: boolean;
  onSave: () => void;
  onSaveAsNew: () => void;
  onNew: () => void;
  onLoad: (schemeId: string) => void;
  onDelete: () => void;
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function PropertyPanel({
  schemeName,
  onSchemeNameChange,
  colors,
  onColorsChange,
  scheme,
  linkingColorId,
  onStartLinking,
  colorMappings,
  onRemoveMapping,
  onAutoGeneratePalette,
  onAutoGenerateGrayscale,
  savedSchemes,
  activeSchemeId,
  isDirty,
  onSave,
  onSaveAsNew,
  onNew,
  onLoad,
  onDelete,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: PropertyPanelProps) {
  const t = useTranslations("colorSchemeDesigner");

  return (
    <div className="space-y-1 bg-white dark:bg-black rounded-lg border p-4">
      {/* Undo/Redo ボタン + スキーム管理 */}
      <div className="pb-3 border-b">
        <div className="flex items-center justify-end gap-1 mb-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label={t("undo")}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{canUndo ? t("undo") : t("noUndo")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label={t("redo")}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{canRedo ? t("redo") : t("noRedo")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <SchemeSelector
          savedSchemes={savedSchemes}
          activeSchemeId={activeSchemeId}
          isDirty={isDirty}
          onSave={onSave}
          onSaveAsNew={onSaveAsNew}
          onNew={onNew}
          onLoad={onLoad}
          onDelete={onDelete}
        />
      </div>

      {/* スキーム名 */}
      <div className="space-y-1.5 pb-3 border-b">
        <Label className="text-xs">{t("schemeName")}</Label>
        <Input
          value={schemeName}
          onChange={(e) => onSchemeNameChange(e.target.value)}
          placeholder={t("schemeNamePlaceholder")}
          className="h-8 text-sm"
        />
      </div>

      {/* パレット */}
      <div className="pt-1">
        <PaletteEditor
          colors={colors}
          onChange={onColorsChange}
          linkingColorId={linkingColorId}
          onStartLinking={onStartLinking}
          colorMappings={colorMappings}
          onRemoveMapping={onRemoveMapping}
          onAutoGeneratePalette={onAutoGeneratePalette}
          onAutoGenerateGrayscale={onAutoGenerateGrayscale}
        />
      </div>

      <div className="border-t" />

      {/* アクセシビリティ */}
      <Section title={t("accessibility")} defaultOpen={false}>
        <AccessibilityInfo colors={colors} />
      </Section>

      <div className="border-t" />

      {/* エクスポート */}
      <Section title={t("export")} defaultOpen={false}>
        <ExportSection scheme={scheme} />
      </Section>
    </div>
  );
}
