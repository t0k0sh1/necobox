"use client";

import {
  type SlotType,
  SLOT_COLORS,
  CELL_SIZE,
} from "@/lib/utils/domain-modeling";
import { Plus } from "lucide-react";

interface FlowSlotCellProps {
  slotType: SlotType;
  noteId: string;
  text: string;
  label: string;
  onDoubleClick: (domRect: DOMRect) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FlowSlotCell({
  slotType,
  noteId,
  text,
  label,
  onDoubleClick,
  onContextMenu,
}: FlowSlotCellProps) {
  const colors = SLOT_COLORS[slotType];

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onDoubleClick(rect);
  };

  return (
    <div
      data-note-id={noteId}
      className="flex items-center justify-center border border-black/10 select-none"
      style={{
        width: `${CELL_SIZE.width}px`,
        height: `${CELL_SIZE.height}px`,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e);
      }}
      role="button"
      aria-label={`${label}: ${text || label}`}
    >
      <span className="text-xs font-medium text-center px-1.5 leading-tight line-clamp-4 break-all">
        {text || label}
      </span>
    </div>
  );
}

/** スロット追加ボタン */
interface SlotAddButtonProps {
  slotType: SlotType;
  onAdd: () => void;
  title?: string;
}

export function SlotAddButton({ slotType, onAdd, title }: SlotAddButtonProps) {
  const colors = SLOT_COLORS[slotType];

  return (
    <button
      type="button"
      className="flex items-center justify-center border border-dashed border-black/20 hover:border-black/40 transition-colors"
      style={{
        width: `${CELL_SIZE.width}px`,
        height: `${Math.min(32, CELL_SIZE.height * 0.4)}px`,
        backgroundColor: `${colors.bg}66`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
      title={title}
    >
      <Plus className="w-3 h-3 opacity-50" />
    </button>
  );
}
