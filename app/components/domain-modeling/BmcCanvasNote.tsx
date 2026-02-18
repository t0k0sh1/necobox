"use client";

import type { BmcNote } from "@/lib/utils/domain-modeling";
import { BMC_NOTE_MIN_SIZE } from "@/lib/utils/domain-modeling";
import { GripVertical, X } from "lucide-react";
import { useCallback, useState } from "react";

interface BmcCanvasNoteProps {
  note: BmcNote;
  bgColor: string;
  onDragStart: (noteId: string, e: React.PointerEvent) => void;
  onResizeStart: (noteId: string, e: React.PointerEvent) => void;
  onDoubleClick: (noteId: string, domRect: DOMRect) => void;
  onDelete: (noteId: string) => void;
}

/** BMCキャンバス専用の付箋コンポーネント */
export function BmcCanvasNote({
  note,
  bgColor,
  onDragStart,
  onResizeStart,
  onDoubleClick,
  onDelete,
}: BmcCanvasNoteProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onDragStart(note.id, e);
    },
    [note.id, onDragStart]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onResizeStart(note.id, e);
    },
    [note.id, onResizeStart]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      onDoubleClick(note.id, rect);
    },
    [note.id, onDoubleClick]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete(note.id);
    },
    [note.id, onDelete]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(note.id);
    },
    [note.id, onDelete]
  );

  return (
    <div
      role="button"
      aria-label={note.text || "空のノート"}
      className="absolute rounded shadow-sm border border-black/10 select-none cursor-grab active:cursor-grabbing"
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        width: `${Math.max(note.size.width, BMC_NOTE_MIN_SIZE.width)}px`,
        height: `${Math.max(note.size.height, BMC_NOTE_MIN_SIZE.height)}px`,
        backgroundColor: bgColor,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* グリップアイコン */}
      <div className="absolute top-1 left-1 text-black/30">
        <GripVertical className="w-3 h-3" />
      </div>

      {/* テキスト */}
      <div className="px-4 py-2 text-[11px] leading-tight text-gray-800 overflow-hidden h-full">
        <span className="line-clamp-4">{note.text || ""}</span>
      </div>

      {/* 削除ボタン */}
      {isHovered && (
        <button
          type="button"
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition-colors"
          onClick={handleDeleteClick}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="ノートを削除"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}

      {/* リサイズハンドル（右下） */}
      <div
        role="separator"
        aria-label="ノートをリサイズ"
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        onPointerDown={handleResizePointerDown}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          background: isHovered
            ? "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3) 50%)"
            : "transparent",
        }}
      />
    </div>
  );
}
