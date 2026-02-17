"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { StoryPoint } from "@/lib/utils/domain-modeling";
import { STORY_POINTS } from "@/lib/utils/domain-modeling";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** ストーリーポイントに応じた色を返す */
export function getStoryPointColor(point: StoryPoint): string {
  if (point <= 8) return "#16a34a";
  if (point === 13) return "#d97706";
  return "#dc2626";
}

interface StoryPointSelectorProps {
  value?: StoryPoint;
  onChange: (value: StoryPoint | undefined) => void;
}

/** ストーリーポイント選択Popover */
export function StoryPointSelector({ value, onChange }: StoryPointSelectorProps) {
  const t = useTranslations("storyMapping.storyPoints");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center rounded text-[10px] font-bold leading-none transition-opacity"
          style={
            value
              ? {
                  backgroundColor: getStoryPointColor(value),
                  color: "#fff",
                  minWidth: "20px",
                  height: "16px",
                  padding: "0 3px",
                }
              : {
                  backgroundColor: "rgba(156,163,175,0.3)",
                  color: "rgba(107,114,128,0.8)",
                  minWidth: "20px",
                  height: "16px",
                  padding: "0 3px",
                }
          }
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("select")}
        >
          {value ?? t("unset")}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="top"
        align="end"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          {STORY_POINTS.map((pt) => (
            <button
              key={pt}
              type="button"
              className="w-7 h-7 rounded text-xs font-bold text-white transition-transform hover:scale-110"
              style={{ backgroundColor: getStoryPointColor(pt) }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(pt);
              }}
            >
              {pt}
            </button>
          ))}
          <button
            type="button"
            className="w-7 h-7 rounded text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            aria-label={t("clear")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
