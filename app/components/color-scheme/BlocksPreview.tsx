"use client";

import type { SchemeColor } from "@/lib/utils/color-scheme-designer";
import { getOptimalTextColor } from "@/lib/utils/color-scheme-designer";
import { useTranslations } from "next-intl";

interface BlocksPreviewProps {
  colors: SchemeColor[];
}

function PaletteStrip({ colors, label }: { colors: SchemeColor[]; label: string }) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
        {label}
      </span>
      <div className="flex h-20 overflow-hidden rounded">
        {colors.map((color) => {
          const textColor = getOptimalTextColor(color.hex);
          return (
            <div
              key={color.id}
              className="flex-1 min-w-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: color.hex, color: textColor }}
            >
              <span className="text-[10px] font-bold truncate px-1">
                {color.name}
              </span>
              <span className="text-[9px] font-mono opacity-80">
                {color.hex}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrayscaleStrip({ colors, label }: { colors: SchemeColor[]; label: string }) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
        {label}
      </span>
      <div className="flex h-20 overflow-hidden rounded">
        {colors.map((color) => {
          if (color.hex2) {
            return (
              <div key={color.id} className="flex-1 min-w-0 flex flex-col">
                <div
                  className="flex-1 flex flex-col items-center justify-center"
                  style={{ backgroundColor: color.hex, color: getOptimalTextColor(color.hex) }}
                >
                  <span className="text-[8px] opacity-60">Light</span>
                  <span className="text-[9px] font-mono truncate px-0.5">
                    {color.hex}
                  </span>
                </div>
                <div
                  className="flex-1 flex flex-col items-center justify-center"
                  style={{ backgroundColor: color.hex2, color: getOptimalTextColor(color.hex2) }}
                >
                  <span className="text-[8px] opacity-60">Dark</span>
                  <span className="text-[9px] font-mono truncate px-0.5">
                    {color.hex2}
                  </span>
                </div>
              </div>
            );
          }
          const textColor = getOptimalTextColor(color.hex);
          return (
            <div
              key={color.id}
              className="flex-1 min-w-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: color.hex, color: textColor }}
            >
              <span className="text-[10px] font-bold truncate px-1">
                {color.name}
              </span>
              <span className="text-[9px] font-mono opacity-80">
                {color.hex}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BlocksPreview({ colors }: BlocksPreviewProps) {
  const t = useTranslations("colorSchemeDesigner");

  const paletteColors = colors.filter((c) => c.group === "palette");
  const grayscaleColors = colors.filter((c) => c.group === "grayscale");
  const hasColors = colors.length > 0;

  return (
    <div className="fixed bottom-[57px] left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-t px-4 py-2">
      {hasColors ? (
        <div className="flex gap-4 max-w-screen-xl mx-auto">
          <div className="flex-1 min-w-0">
            <PaletteStrip
              colors={paletteColors}
              label={t("blocksPreview.schemeColors")}
            />
          </div>
          {grayscaleColors.length > 0 && (
            <div className="flex-1 min-w-0">
              <GrayscaleStrip
                colors={grayscaleColors}
                label={t("blocksPreview.grayscale")}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[10px] invisible px-1">&nbsp;</span>
          <div className="flex h-20 items-center justify-center rounded">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("addColor")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
