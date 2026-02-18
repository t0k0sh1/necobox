"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCanvasInteraction } from "@/lib/hooks/useCanvasInteraction";
import type { BmcBoard, BmcBlockType } from "@/lib/utils/domain-modeling";
import {
  BMC_BLOCK_ORDER,
  BMC_BLOCK_COLORS,
  BMC_NOTE_MIN_SIZE,
  BMC_LAYOUT_BASE_WIDTH,
  BMC_LAYOUT_BASE_HEIGHT,
  BMC_LAYOUT_SCALE_MIN,
  BMC_LAYOUT_SCALE_MAX,
  createBmcNote,
  detectBmcBlock,
} from "@/lib/utils/domain-modeling";
import { BmcBlock } from "./BmcBlock";
import { BmcCanvasNote } from "./BmcCanvasNote";
import { NoteEditor } from "./NoteEditor";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface BusinessModelCanvasProps {
  bmc: BmcBoard;
  onBmcChange: (bmc: BmcBoard) => void;
  onBmcSet: (bmc: BmcBoard) => void;
}

interface EditingState {
  noteId: string;
  text: string;
  position: { x: number; y: number; width: number; height: number };
}

/** BMCメインコンポーネント（フリーキャンバス） */
export function BusinessModelCanvas({ bmc, onBmcChange, onBmcSet }: BusinessModelCanvasProps) {
  const t = useTranslations("domainModeling.bmc");
  const uniqueId = useId();
  const dotGridId = `bmc-dot-grid-${uniqueId}`;
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [autoEditNoteId, setAutoEditNoteId] = useState<string | null>(null);

  const layoutScale = bmc.layoutScale ?? 1;

  // 安定したコールバック用ref
  const bmcRef = useRef(bmc);
  const onBmcChangeRef = useRef(onBmcChange);
  const onBmcSetRef = useRef(onBmcSet);
  useEffect(() => {
    bmcRef.current = bmc;
    onBmcChangeRef.current = onBmcChange;
    onBmcSetRef.current = onBmcSet;
  }, [bmc, onBmcChange, onBmcSet]);

  const {
    viewport,
    isPanning,
    containerRef,
    handlePointerDown: canvasPointerDown,
    handlePointerMove: canvasPointerMove,
    handlePointerUp: canvasPointerUp,
    handleWheel,
    handleKeyDown,
    handleKeyUp,
    zoomIn,
    zoomOut,
    resetView,
  } = useCanvasInteraction({
    initialViewport: { x: 50, y: 30, zoom: 0.8 },
  });

  // 付箋ドラッグ用ref
  const dragRef = useRef<{
    noteId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // 付箋リサイズ用ref
  const resizeRef = useRef<{
    noteId: string;
    startX: number;
    startY: number;
    origWidth: number;
    origHeight: number;
  } | null>(null);

  // レイアウトリサイズ用ref
  const layoutResizeRef = useRef<{
    startX: number;
    startY: number;
    origScale: number;
  } | null>(null);

  // ドラッグ／リサイズ操作のクリーンアップ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        dragRef.current = null;
        resizeRef.current = null;
        layoutResizeRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      dragRef.current = null;
      resizeRef.current = null;
      layoutResizeRef.current = null;
    };
  }, []);

  // rAF制御用ref（ポインタ移動のスロットリング）
  const rafRef = useRef<number | null>(null);

  // 付箋追加
  const handleAddNote = useCallback(
    (blockType: BmcBlockType) => {
      const scale = bmcRef.current.layoutScale ?? 1;
      const note = createBmcNote(blockType, bmc.notes, "", scale);
      const newBmc: BmcBoard = { ...bmc, notes: [...bmc.notes, note] };
      onBmcChange(newBmc);
      setAutoEditNoteId(note.id);
    },
    [bmc, onBmcChange]
  );

  // 自動編集の処理
  useEffect(() => {
    if (!autoEditNoteId) return;
    const timer = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-note-id="${autoEditNoteId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const note = bmcRef.current.notes.find((n) => n.id === autoEditNoteId);
        if (note) {
          setEditing({
            noteId: autoEditNoteId,
            text: note.text,
            position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          });
        }
      }
      setAutoEditNoteId(null);
    });
    return () => cancelAnimationFrame(timer);
  }, [autoEditNoteId]);

  // 付箋ドラッグ開始
  const handleNoteDragStart = useCallback(
    (noteId: string, e: React.PointerEvent) => {
      const note = bmc.notes.find((n) => n.id === noteId);
      if (!note) return;
      containerRef.current?.setPointerCapture(e.pointerId);
      dragRef.current = {
        noteId,
        startX: e.clientX,
        startY: e.clientY,
        origX: note.position.x,
        origY: note.position.y,
      };
    },
    [bmc.notes, containerRef]
  );

  // 付箋リサイズ開始
  const handleNoteResizeStart = useCallback(
    (noteId: string, e: React.PointerEvent) => {
      const note = bmc.notes.find((n) => n.id === noteId);
      if (!note) return;
      containerRef.current?.setPointerCapture(e.pointerId);
      resizeRef.current = {
        noteId,
        startX: e.clientX,
        startY: e.clientY,
        origWidth: note.size.width,
        origHeight: note.size.height,
      };
    },
    [bmc.notes, containerRef]
  );

  // レイアウトリサイズ開始
  const handleLayoutResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      containerRef.current?.setPointerCapture(e.pointerId);
      layoutResizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origScale: bmcRef.current.layoutScale ?? 1,
      };
    },
    [containerRef]
  );

  // 付箋ダブルクリック → 編集開始
  const handleNoteDoubleClick = useCallback(
    (noteId: string, domRect: DOMRect) => {
      const note = bmc.notes.find((n) => n.id === noteId);
      if (!note) return;
      setEditing({
        noteId,
        text: note.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [bmc.notes]
  );

  // 付箋削除
  const handleNoteDelete = useCallback(
    (noteId: string) => {
      onBmcChange({ ...bmc, notes: bmc.notes.filter((n) => n.id !== noteId) });
    },
    [bmc, onBmcChange]
  );

  // 編集確定
  const handleEditCommit = useCallback(
    (text: string) => {
      if (!editing) return;
      onBmcChange({
        ...bmc,
        notes: bmc.notes.map((n) =>
          n.id === editing.noteId ? { ...n, text } : n
        ),
      });
      setEditing(null);
    },
    [editing, bmc, onBmcChange]
  );

  const handleEditCancel = useCallback(() => {
    setEditing(null);
  }, []);

  // ポインタ移動の統合ハンドラ（rAFでスロットリング）
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // インタラクション中でなければパン処理にデリゲート
      if (!layoutResizeRef.current && !dragRef.current && !resizeRef.current) {
        canvasPointerMove(e);
        return;
      }

      // rAFで1フレーム1回に制限
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        // レイアウトリサイズ中
        if (layoutResizeRef.current) {
          const dx = (clientX - layoutResizeRef.current.startX) / viewport.zoom;
          const dy = (clientY - layoutResizeRef.current.startY) / viewport.zoom;
          const diagonal = (dx + dy) / 2;
          const baseDiagonal = Math.hypot(BMC_LAYOUT_BASE_WIDTH, BMC_LAYOUT_BASE_HEIGHT);
          const scaleDelta = diagonal / baseDiagonal;
          const newScale = Math.min(
            BMC_LAYOUT_SCALE_MAX,
            Math.max(BMC_LAYOUT_SCALE_MIN, layoutResizeRef.current.origScale + scaleDelta)
          );
          onBmcSetRef.current({ ...bmcRef.current, layoutScale: newScale });
          return;
        }

        // 付箋ドラッグ中
        if (dragRef.current) {
          const dx = (clientX - dragRef.current.startX) / viewport.zoom;
          const dy = (clientY - dragRef.current.startY) / viewport.zoom;
          onBmcSetRef.current({
            ...bmcRef.current,
            notes: bmcRef.current.notes.map((n) =>
              n.id === dragRef.current!.noteId
                ? { ...n, position: { x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy } }
                : n
            ),
          });
          return;
        }

        // 付箋リサイズ中
        if (resizeRef.current) {
          const dx = (clientX - resizeRef.current.startX) / viewport.zoom;
          const dy = (clientY - resizeRef.current.startY) / viewport.zoom;
          const newWidth = Math.max(BMC_NOTE_MIN_SIZE.width, resizeRef.current.origWidth + dx);
          const newHeight = Math.max(BMC_NOTE_MIN_SIZE.height, resizeRef.current.origHeight + dy);
          onBmcSetRef.current({
            ...bmcRef.current,
            notes: bmcRef.current.notes.map((n) =>
              n.id === resizeRef.current!.noteId
                ? { ...n, size: { width: newWidth, height: newHeight } }
                : n
            ),
          });
        }
      });
    },
    [viewport.zoom, canvasPointerMove]
  );

  // ポインタアップの統合ハンドラ
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // 保留中のrAFをキャンセル
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // pointer captureの解放
      if (dragRef.current || resizeRef.current || layoutResizeRef.current) {
        containerRef.current?.releasePointerCapture(e.pointerId);
      }

      // レイアウトリサイズ終了 → 確定
      if (layoutResizeRef.current) {
        onBmcChangeRef.current({ ...bmcRef.current });
        layoutResizeRef.current = null;
        return;
      }

      // ドラッグ終了 → ブロック再判定 → 確定
      if (dragRef.current) {
        const currentBmc = bmcRef.current;
        const scale = currentBmc.layoutScale ?? 1;
        const note = currentBmc.notes.find((n) => n.id === dragRef.current!.noteId);
        if (note) {
          const centerX = note.position.x + note.size.width / 2;
          const centerY = note.position.y + note.size.height / 2;
          const newBlockType = detectBmcBlock(centerX, centerY, scale);
          onBmcChangeRef.current({
            ...currentBmc,
            notes: currentBmc.notes.map((n) =>
              n.id === dragRef.current!.noteId
                ? { ...n, blockType: newBlockType }
                : n
            ),
          });
        }
        dragRef.current = null;
        return;
      }

      // リサイズ終了 → 確定
      if (resizeRef.current) {
        onBmcChangeRef.current({ ...bmcRef.current });
        resizeRef.current = null;
        return;
      }

      canvasPointerUp(e);
    },
    [canvasPointerUp, containerRef]
  );

  // ポインタダウンの統合ハンドラ
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      canvasPointerDown(e);
    },
    [canvasPointerDown]
  );

  // キャンバスクリック
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning || dragRef.current || resizeRef.current || layoutResizeRef.current) return;
      if (e.target !== e.currentTarget) return;
    },
    [isPanning]
  );

  const cursorClass = isPanning ? "cursor-grabbing" : "cursor-default";

  // スケール済みレイアウトの全体サイズ
  const totalW = BMC_LAYOUT_BASE_WIDTH * layoutScale;
  const totalH = BMC_LAYOUT_BASE_HEIGHT * layoutScale;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden bg-gray-50 dark:bg-gray-950 ${cursorClass} outline-none`}
      tabIndex={0}
      role="application"
      aria-label="Business Model Canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={handleCanvasClick}
    >
      {/* ドットグリッド背景 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern
            id={dotGridId}
            x={viewport.x % (20 * viewport.zoom)}
            y={viewport.y % (20 * viewport.zoom)}
            width={20 * viewport.zoom}
            height={20 * viewport.zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={1}
              cy={1}
              r={1}
              className="fill-gray-300 dark:fill-gray-700"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${dotGridId})`} />
      </svg>

      {/* キャンバスコンテンツ */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* BMCブロック背景 × 9 */}
        {BMC_BLOCK_ORDER.map((blockType) => (
          <BmcBlock
            key={blockType}
            blockType={blockType}
            label={t(`blocks.${blockType}`)}
            scale={layoutScale}
            onAddNote={() => handleAddNote(blockType)}
          />
        ))}

        {/* レイアウト全体のリサイズハンドル（右下角） */}
        <div
          role="separator"
          aria-label="レイアウトをリサイズ"
          className="absolute pointer-events-auto cursor-se-resize group"
          style={{
            left: `${totalW - 6}px`,
            top: `${totalH - 6}px`,
            width: "16px",
            height: "16px",
          }}
          onPointerDown={handleLayoutResizeStart}
        >
          {/* 三角形のリサイズグリップ */}
          <svg width="16" height="16" className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
            <path d="M14 2 L14 14 L2 14 Z" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* 付箋 × N */}
        {bmc.notes.map((note) => (
          <div key={note.id} data-note-id={note.id}>
            <BmcCanvasNote
              note={note}
              bgColor={BMC_BLOCK_COLORS[note.blockType].bg}
              onDragStart={handleNoteDragStart}
              onResizeStart={handleNoteResizeStart}
              onDoubleClick={handleNoteDoubleClick}
              onDelete={handleNoteDelete}
            />
          </div>
        ))}
      </div>

      {/* ズームコントロール（右下固定） */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-1 py-0.5">
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={zoomOut}
          aria-label="ズームアウト"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono w-10 text-center select-none text-gray-600 dark:text-gray-400">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={zoomIn}
          aria-label="ズームイン"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5" />
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={resetView}
          aria-label="ビューをリセット"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ノートエディタ（固定位置オーバーレイ） */}
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
