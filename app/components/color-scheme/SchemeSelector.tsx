"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SavedColorScheme } from "@/lib/utils/color-scheme-designer";
import { Save, FilePlus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SchemeSelectorProps {
  savedSchemes: SavedColorScheme[];
  activeSchemeId: string | null;
  isDirty: boolean;
  onSave: () => void;
  onSaveAsNew: () => void;
  onNew: () => void;
  onLoad: (schemeId: string) => void;
  onDelete: () => void;
}

export function SchemeSelector({
  savedSchemes,
  activeSchemeId,
  isDirty,
  onSave,
  onSaveAsNew,
  onNew,
  onLoad,
  onDelete,
}: SchemeSelectorProps) {
  const t = useTranslations("colorSchemeDesigner.schemeSelector");

  const handleValueChange = (value: string) => {
    if (value === "__unsaved__") return;
    onLoad(value);
  };

  return (
    <div className="space-y-2">
      <Select
        value={activeSchemeId ?? "__unsaved__"}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full h-8 text-sm">
          <SelectValue placeholder={t("savedSchemes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unsaved__">
            {t("unsavedScheme")}
            {isDirty && !activeSchemeId && " \u25cf"}
          </SelectItem>
          {savedSchemes.map((scheme) => (
            <SelectItem key={scheme.id} value={scheme.id}>
              {scheme.name}
              {isDirty && activeSchemeId === scheme.id && " \u25cf"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={onSave}
          disabled={!activeSchemeId}
          title={t("save")}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          {t("save")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={onSaveAsNew}
          title={t("saveAsNew")}
        >
          <FilePlus className="w-3.5 h-3.5 mr-1" />
          {t("saveAsNew")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={onNew}
          title={t("new")}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {t("new")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={!activeSchemeId}
          title={t("delete")}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {t("delete")}
        </Button>
      </div>

      {isDirty && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("modified")}
        </p>
      )}
    </div>
  );
}
