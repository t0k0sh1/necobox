"use client";

import type { BmcBlockType, BmcNote } from "@/lib/utils/event-storming";
import { BMC_BLOCK_COLORS } from "@/lib/utils/event-storming";
import { BmcStickyNote } from "./BmcStickyNote";
import { Plus } from "lucide-react";

interface BmcBlockProps {
  blockType: BmcBlockType;
  label: string;
  notes: BmcNote[];
  onAddNote: () => void;
  onEditNote: (noteId: string, domRect: DOMRect) => void;
  onDeleteNote: (noteId: string) => void;
  onDragStart: (blockType: BmcBlockType, noteId: string) => void;
  onDragOverNote: (e: React.DragEvent, blockType: BmcBlockType, noteId: string) => void;
  onDropOnBlock: (blockType: BmcBlockType) => void;
  onDragEnd: () => void;
  dragOverNoteId: string | null;
  isDropTarget: boolean;
  autoEditNoteId: string | null;
}

/** BMC個別ブロックコンポーネント */
export function BmcBlock({
  blockType,
  label,
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onDragStart,
  onDragOverNote,
  onDropOnBlock,
  onDragEnd,
  dragOverNoteId,
  isDropTarget,
  autoEditNoteId,
}: BmcBlockProps) {
  const colors = BMC_BLOCK_COLORS[blockType];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDropOnBlock(blockType);
  };

  return (
    <div
      className={`flex flex-col h-full border rounded-md overflow-hidden transition-shadow ${
        isDropTarget ? "ring-2 ring-blue-400/50" : ""
      }`}
      style={{ backgroundColor: `${colors.bg}40`, borderColor: `${colors.header}30` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ヘッダー */}
      <div
        className="px-2 py-1.5 text-xs font-semibold text-white shrink-0 flex items-center justify-between"
        style={{ backgroundColor: colors.header }}
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
      {/* 付箋リスト */}
      <div className="flex-1 p-1.5 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <BmcStickyNote
              key={note.id}
              noteId={note.id}
              text={note.text}
              bgColor={colors.bg}
              onDoubleClick={(rect) => onEditNote(note.id, rect)}
              onDelete={() => onDeleteNote(note.id)}
              onDragStart={(nid) => onDragStart(blockType, nid)}
              onDragOver={(e, nid) => onDragOverNote(e, blockType, nid)}
              onDragEnd={onDragEnd}
              isDragOver={dragOverNoteId === note.id}
              autoEdit={autoEditNoteId === note.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
