"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { BmcBoard, BmcBlockType } from "@/lib/utils/domain-modeling";
import { BMC_BLOCK_ORDER, createBmcNote } from "@/lib/utils/domain-modeling";
import { BmcBlock } from "./BmcBlock";
import { NoteEditor } from "./NoteEditor";

/** CSS Grid の配置定義 */
const GRID_PLACEMENT: Record<BmcBlockType, string> = {
  keyPartners:           "md:col-start-1 md:col-end-3 md:row-start-1 md:row-end-3",
  keyActivities:         "md:col-start-3 md:col-end-5 md:row-start-1 md:row-end-2",
  keyResources:          "md:col-start-3 md:col-end-5 md:row-start-2 md:row-end-3",
  valuePropositions:     "md:col-start-5 md:col-end-7 md:row-start-1 md:row-end-3",
  customerRelationships: "md:col-start-7 md:col-end-9 md:row-start-1 md:row-end-2",
  channels:              "md:col-start-7 md:col-end-9 md:row-start-2 md:row-end-3",
  customerSegments:      "md:col-start-9 md:col-end-11 md:row-start-1 md:row-end-3",
  costStructure:         "md:col-start-1 md:col-end-6 md:row-start-3 md:row-end-4",
  revenueStreams:        "md:col-start-6 md:col-end-11 md:row-start-3 md:row-end-4",
};

interface BusinessModelCanvasProps {
  bmc: BmcBoard;
  onBmcChange: (bmc: BmcBoard) => void;
}

interface EditingState {
  blockType: BmcBlockType;
  noteId: string;
  text: string;
  position: { x: number; y: number; width: number; height: number };
}

interface DragState {
  sourceBlock: BmcBlockType;
  noteId: string;
}

/** BMCメインコンポーネント */
export function BusinessModelCanvas({ bmc, onBmcChange }: BusinessModelCanvasProps) {
  const t = useTranslations("domainModeling.bmc");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [autoEditNoteId, setAutoEditNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [dragOverBlock, setDragOverBlock] = useState<BmcBlockType | null>(null);
  const [dragSourceBlock, setDragSourceBlock] = useState<BmcBlockType | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const handleAddNote = useCallback(
    (blockType: BmcBlockType) => {
      const note = createBmcNote();
      const newBlocks = { ...bmc.blocks };
      newBlocks[blockType] = [...newBlocks[blockType], note];
      onBmcChange({ blocks: newBlocks });
      setAutoEditNoteId(note.id);
    },
    [bmc, onBmcChange]
  );

  const handleEditNote = useCallback(
    (blockType: BmcBlockType, noteId: string, domRect: DOMRect) => {
      const note = bmc.blocks[blockType].find((n) => n.id === noteId);
      if (!note) return;
      setAutoEditNoteId(null);
      setEditing({
        blockType,
        noteId,
        text: note.text,
        position: {
          x: domRect.left,
          y: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      });
    },
    [bmc]
  );

  const handleDeleteNote = useCallback(
    (blockType: BmcBlockType, noteId: string) => {
      const newBlocks = { ...bmc.blocks };
      newBlocks[blockType] = newBlocks[blockType].filter((n) => n.id !== noteId);
      onBmcChange({ blocks: newBlocks });
    },
    [bmc, onBmcChange]
  );

  const handleEditCommit = useCallback(
    (text: string) => {
      if (!editing) return;
      const { blockType, noteId } = editing;
      const newBlocks = { ...bmc.blocks };
      newBlocks[blockType] = newBlocks[blockType].map((n) =>
        n.id === noteId ? { ...n, text } : n
      );
      onBmcChange({ blocks: newBlocks });
      setEditing(null);
    },
    [editing, bmc, onBmcChange]
  );

  const handleEditCancel = useCallback(() => {
    setEditing(null);
  }, []);

  // ドラッグ&ドロップハンドラ
  const handleDragStart = useCallback(
    (blockType: BmcBlockType, noteId: string) => {
      dragRef.current = { sourceBlock: blockType, noteId };
      setDragSourceBlock(blockType);
    },
    []
  );

  const handleDragOverNote = useCallback(
    (_e: React.DragEvent, blockType: BmcBlockType, noteId: string) => {
      // _e は BmcBlock → BmcStickyNote のイベント伝搬シグネチャに必要
      setDragOverNoteId(noteId);
      setDragOverBlock(blockType);
    },
    []
  );

  const handleDropOnBlock = useCallback(
    (targetBlock: BmcBlockType) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { sourceBlock, noteId } = drag;
      const sourceNote = bmc.blocks[sourceBlock].find((n) => n.id === noteId);
      if (!sourceNote) return;

      const newBlocks = { ...bmc.blocks };

      if (sourceBlock === targetBlock) {
        // 同一ブロック内の並び替え
        if (dragOverNoteId && dragOverNoteId !== noteId) {
          const list = [...newBlocks[sourceBlock]];
          const fromIdx = list.findIndex((n) => n.id === noteId);
          const toIdx = list.findIndex((n) => n.id === dragOverNoteId);
          if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            list.splice(fromIdx, 1);
            list.splice(toIdx, 0, sourceNote);
            newBlocks[sourceBlock] = list;
          }
        }
      } else {
        // 別ブロックへ移動
        newBlocks[sourceBlock] = newBlocks[sourceBlock].filter((n) => n.id !== noteId);
        const targetList = [...newBlocks[targetBlock]];
        if (dragOverNoteId) {
          const toIdx = targetList.findIndex((n) => n.id === dragOverNoteId);
          if (toIdx !== -1) {
            targetList.splice(toIdx, 0, sourceNote);
          } else {
            targetList.push(sourceNote);
          }
        } else {
          targetList.push(sourceNote);
        }
        newBlocks[targetBlock] = targetList;
      }

      onBmcChange({ blocks: newBlocks });
      dragRef.current = null;
      setDragOverNoteId(null);
      setDragOverBlock(null);
      setDragSourceBlock(null);
    },
    [bmc, onBmcChange, dragOverNoteId]
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDragOverNoteId(null);
    setDragOverBlock(null);
    setDragSourceBlock(null);
  }, []);

  // ウィンドウ外でドラッグがキャンセルされた場合のクリーンアップ
  useEffect(() => {
    const cleanup = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setDragOverNoteId(null);
        setDragOverBlock(null);
        setDragSourceBlock(null);
      }
    };
    window.addEventListener("dragend", cleanup);
    return () => window.removeEventListener("dragend", cleanup);
  }, []);

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-10 md:grid-rows-3 gap-2 flex-1 min-h-0 md:min-h-[500px]">
        {BMC_BLOCK_ORDER.map((blockType) => (
          <div
            key={blockType}
            className={`min-h-[120px] ${GRID_PLACEMENT[blockType]}`}
          >
            <BmcBlock
              blockType={blockType}
              label={t(`blocks.${blockType}`)}
              notes={bmc.blocks[blockType]}
              onAddNote={() => handleAddNote(blockType)}
              onEditNote={(noteId, rect) => handleEditNote(blockType, noteId, rect)}
              onDeleteNote={(noteId) => handleDeleteNote(blockType, noteId)}
              onDragStart={handleDragStart}
              onDragOverNote={handleDragOverNote}
              onDropOnBlock={handleDropOnBlock}
              onDragEnd={handleDragEnd}
              dragOverNoteId={dragOverBlock === blockType ? dragOverNoteId : null}
              isDropTarget={dragOverBlock === blockType && dragSourceBlock !== null && dragSourceBlock !== blockType}
              autoEditNoteId={autoEditNoteId}
            />
          </div>
        ))}
      </div>

      {/* ノートエディタ（再利用） */}
      {editing && (
        <NoteEditor
          initialText={editing.text}
          position={editing.position}
          onCommit={handleEditCommit}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
