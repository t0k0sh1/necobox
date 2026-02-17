"use client";

import { X, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface BmcStickyNoteProps {
  noteId: string;
  text: string;
  bgColor: string;
  onDoubleClick: (domRect: DOMRect) => void;
  onDelete: () => void;
  onDragStart: (noteId: string) => void;
  onDragOver: (e: React.DragEvent, noteId: string) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  autoEdit?: boolean;
}

/** BMC個別の付箋コンポーネント */
export function BmcStickyNote({
  noteId,
  text,
  bgColor,
  onDoubleClick,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
  autoEdit,
}: BmcStickyNoteProps) {
  const t = useTranslations("domainModeling.bmc");
  const [hovered, setHovered] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoEdit && elRef.current) {
      const rect = elRef.current.getBoundingClientRect();
      onDoubleClick(rect);
    }
    // onDoubleClick は安定したコールバック（useCallback）であり deps に含めると
    // 不要な再発火を招くため、autoEdit の変化時のみ実行する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onDoubleClick(rect);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(e, noteId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      onDoubleClick(rect);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete();
    }
  };

  return (
    <div
      ref={elRef}
      draggable
      tabIndex={0}
      role="button"
      className={`relative px-2 py-1.5 rounded text-xs leading-tight break-all cursor-grab active:cursor-grabbing select-none min-h-[32px] flex items-center gap-1 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isDragOver ? "ring-2 ring-blue-400 ring-offset-1" : ""
      }`}
      style={{ backgroundColor: bgColor, color: "#111827" }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="w-3 h-3 shrink-0 opacity-30" />
      <span className="flex-1 line-clamp-3">{text || "\u00A0"}</span>
      {hovered && (
        <button
          type="button"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t("deleteNote")}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
