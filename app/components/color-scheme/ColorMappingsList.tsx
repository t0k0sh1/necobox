"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ELEMENT_LABELS } from "./BlogPreview";

interface ColorMappingsListProps {
  colorId: string;
  colorMappings: Record<string, string>;
  onRemoveMapping: (elementId: string) => void;
  t: ReturnType<typeof useTranslations<"colorSchemeDesigner">>;
}

export function ColorMappingsList({
  colorId,
  colorMappings,
  onRemoveMapping,
  t,
}: ColorMappingsListProps) {
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
