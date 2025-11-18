"use client";

import { CopyButton } from "./CopyButton";

interface GeneratedResultCardProps {
  value: string | number;
  index?: number;
  fontSize?: string;
}

export function GeneratedResultCard({
  value,
  fontSize = "text-lg",
}: GeneratedResultCardProps) {
  const textValue = value.toString();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border gap-2">
      <span className={`font-mono ${fontSize} break-all`}>{textValue}</span>
      <CopyButton text={textValue} className="flex-shrink-0" />
    </div>
  );
}

/**
 * Get font size based on value length
 */
export function getValueFontSize(value: number): string {
  const valueStr = value.toString();
  const length = valueStr.length;

  if (length <= 5) return "text-lg";
  if (length <= 10) return "text-base";
  if (length <= 15) return "text-sm";
  return "text-xs";
}
