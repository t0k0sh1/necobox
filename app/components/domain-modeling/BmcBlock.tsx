"use client";

import type { BmcBlockType } from "@/lib/utils/domain-modeling";
import { BMC_BLOCK_COLORS, BMC_BLOCK_HEADER_HEIGHT, getScaledBlockLayout } from "@/lib/utils/domain-modeling";
import { Plus } from "lucide-react";

interface BmcBlockProps {
  blockType: BmcBlockType;
  label: string;
  scale: number;
  onAddNote: () => void;
}

/** BMCブロック背景ガイドコンポーネント */
export function BmcBlock({ blockType, label, scale, onAddNote }: BmcBlockProps) {
  const colors = BMC_BLOCK_COLORS[blockType];
  const layout = getScaledBlockLayout(blockType, scale);
  const headerH = BMC_BLOCK_HEADER_HEIGHT * scale;

  return (
    <div
      className="absolute border rounded-md overflow-hidden pointer-events-none"
      style={{
        left: `${layout.x}px`,
        top: `${layout.y}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        backgroundColor: `${colors.bg}40`,
        borderColor: `${colors.header}30`,
      }}
    >
      {/* ヘッダー（ポインターイベント有効） */}
      <div
        className="flex items-center justify-between px-2 font-semibold text-white shrink-0 pointer-events-auto"
        style={{
          backgroundColor: colors.header,
          height: `${headerH}px`,
          fontSize: `${Math.max(10, 12 * scale)}px`,
        }}
      >
        <span className="truncate">{label}</span>
        <button
          type="button"
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
          onClick={onAddNote}
          aria-label={`${label}にノートを追加`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
