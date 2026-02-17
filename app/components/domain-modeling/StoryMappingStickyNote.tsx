"use client";

import { StickyNote } from "lucide-react";

import type { StoryPoint } from "@/lib/utils/domain-modeling";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BmcStickyNote } from "./BmcStickyNote";
import { StoryPointSelector } from "./StoryPointSelector";

interface StoryMappingStickyNoteProps {
  noteId: string;
  text: string;
  bgColor: string;
  memo?: string;
  storyPoints?: StoryPoint;
  onDoubleClick: (domRect: DOMRect) => void;
  onDelete: () => void;
  onDragStart: (noteId: string) => void;
  onDragOver: (e: React.DragEvent, noteId: string) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  autoEdit?: boolean;
  onEditMemo: (domRect: DOMRect) => void;
  onStoryPointChange: (value: StoryPoint | undefined) => void;
}

/** ストーリーマッピング専用の付箋コンポーネント（BmcStickyNote + メモ + SP） */
export function StoryMappingStickyNote({
  noteId,
  text,
  bgColor,
  memo,
  storyPoints,
  onDoubleClick,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
  autoEdit,
  onEditMemo,
  onStoryPointChange,
}: StoryMappingStickyNoteProps) {
  return (
    <div className="relative group">
      <BmcStickyNote
        noteId={noteId}
        text={text}
        bgColor={bgColor}
        onDoubleClick={onDoubleClick}
        onDelete={onDelete}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        isDragOver={isDragOver}
        autoEdit={autoEdit}
      />

      {/* メモアイコン（左下） */}
      {memo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="absolute bottom-0.5 left-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEditMemo(e.currentTarget.getBoundingClientRect());
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <StickyNote className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-xs whitespace-pre-wrap">
            {memo}
          </TooltipContent>
        </Tooltip>
      ) : (
        <button
          type="button"
          className="absolute bottom-0.5 left-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-gray-400 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onEditMemo(e.currentTarget.getBoundingClientRect());
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <StickyNote className="w-3 h-3" />
        </button>
      )}

      {/* ストーリーポイントバッジ（右下：右上は削除ボタンと重なるため） */}
      <div className={`absolute bottom-0.5 right-0.5 z-10 ${storyPoints ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}>
        <StoryPointSelector value={storyPoints} onChange={onStoryPointChange} />
      </div>
    </div>
  );
}
