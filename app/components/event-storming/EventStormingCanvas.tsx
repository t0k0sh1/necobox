"use client";

import { useCanvasInteraction } from "@/lib/hooks/useCanvasInteraction";
import {
  type EventStormingBoard,
  type ToolMode,
  type CanvasViewport,
  type SlotType,
  clientToCanvas,
  createEmptyFlow,
  createBoundedContext,
  createDomain,
  createHotspot,
  createFlowConnection,
  createFlowNote,
} from "@/lib/utils/event-storming";
import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { EventFlowComponent } from "./EventFlow";
import { BoundedContextRect } from "./BoundedContextRect";
import { DomainRect } from "./DomainRect";
import { FlowConnectionArrow } from "./FlowConnectionArrow";
import { HotspotBubble } from "./HotspotBubble";
import { NoteEditor } from "./NoteEditor";
import { Legend } from "./Legend";

/** 親から ref 経由で呼べるズーム操作 */
export interface CanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface EventStormingCanvasProps {
  board: EventStormingBoard;
  toolMode: ToolMode;
  /** 確定的な変更（Undo/Redo スナップショット付き） */
  onBoardChange: (board: EventStormingBoard) => void;
  /** 中間的な変更（ドラッグ中など、Undo スナップショットなし） */
  onBoardSet: (board: EventStormingBoard) => void;
  onToolModeReset: () => void;
}

/** 編集中ノートの情報 */
interface EditingNote {
  flowId: string;
  slotType: SlotType;
  noteId: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

/** 編集中ラベルの情報（コンテキスト・ドメイン・ホットスポット共通） */
interface EditingLabel {
  type: "context" | "domain" | "hotspot";
  id: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

/** ドラッグ中の矩形描画情報 */
interface DrawingRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const EventStormingCanvas = forwardRef<CanvasHandle, EventStormingCanvasProps>(
  function EventStormingCanvas(
    { board, toolMode, onBoardChange, onBoardSet, onToolModeReset },
    ref
  ) {
  const t = useTranslations("eventStorming");
  const uniqueId = useId();
  const dotGridId = `dot-grid-${uniqueId}`;
  const arrowheadId = `arrowhead-${uniqueId}`;

  // 安定したコールバック用 ref（useEffect でレンダー後に同期）
  const boardRef = useRef(board);
  const onBoardChangeRef = useRef(onBoardChange);
  useEffect(() => {
    boardRef.current = board;
    onBoardChangeRef.current = onBoardChange;
  });

  const stableOnViewportChange = useCallback((v: CanvasViewport) => {
    onBoardChangeRef.current({ ...boardRef.current, viewport: v });
  }, []);

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
    initialViewport: board.viewport,
    onViewportChange: stableOnViewportChange,
  });

  // ズーム操作を ref 経由で親に公開
  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, resetView }), [zoomIn, zoomOut, resetView]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<EditingNote | null>(null);
  const [editingLabel, setEditingLabel] = useState<EditingLabel | null>(null);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [connectionFrom, setConnectionFrom] = useState<string | null>(null);

  // ドラッグ移動用
  const dragRef = useRef<{
    type: "flow" | "context" | "domain" | "hotspot";
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // リサイズ用
  const resizeRef = useRef<{
    type: "context" | "domain";
    id: string;
    edge: string;
    startX: number;
    startY: number;
    origPos: { x: number; y: number };
    origSize: { width: number; height: number };
  } | null>(null);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return clientToCanvas(clientX, clientY, viewport, rect);
    },
    [viewport, containerRef]
  );

  // キャンバスクリック: ツールモードに応じた要素追加
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning || dragRef.current || resizeRef.current) return;
      if (e.target !== e.currentTarget && toolMode === "select") return;

      const coords = getCanvasCoords(e.clientX, e.clientY);

      if (toolMode === "addFlow") {
        const flow = createEmptyFlow(coords.x, coords.y);
        onBoardChange({
          ...board,
          flows: [...board.flows, flow],
          updatedAt: new Date().toISOString(),
        });
        onToolModeReset();
      } else if (toolMode === "addHotspot") {
        const hs = createHotspot(coords.x, coords.y);
        onBoardChange({
          ...board,
          hotspots: [...board.hotspots, hs],
          updatedAt: new Date().toISOString(),
        });
        onToolModeReset();
      } else if (toolMode === "select") {
        setSelectedId(null);
        setConnectionFrom(null);
      }
    },
    [isPanning, toolMode, getCanvasCoords, board, onBoardChange, onToolModeReset]
  );

  // コンテキスト/ドメイン矩形描画開始
  const handleCanvasPointerDownForDraw = useCallback(
    (e: React.PointerEvent) => {
      if (toolMode === "addContext" || toolMode === "addDomain") {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setDrawingRect({
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
        });
        return;
      }
    },
    [toolMode, getCanvasCoords]
  );

  // ポインタ移動の統合ハンドラ（ドラッグ/リサイズ中は onBoardSet で中間更新）
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 矩形描画中
      if (drawingRect) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setDrawingRect({ ...drawingRect, currentX: coords.x, currentY: coords.y });
        return;
      }

      // 要素ドラッグ中（中間更新: Undo スナップショットなし）
      if (dragRef.current) {
        const dx = (e.clientX - dragRef.current.startX) / viewport.zoom;
        const dy = (e.clientY - dragRef.current.startY) / viewport.zoom;
        const newX = dragRef.current.origX + dx;
        const newY = dragRef.current.origY + dy;

        const { type, id } = dragRef.current;
        if (type === "flow") {
          onBoardSet({
            ...board,
            flows: board.flows.map((f) =>
              f.id === id ? { ...f, position: { x: newX, y: newY } } : f
            ),
          });
        } else if (type === "context") {
          onBoardSet({
            ...board,
            contexts: board.contexts.map((c) =>
              c.id === id ? { ...c, position: { x: newX, y: newY } } : c
            ),
          });
        } else if (type === "domain") {
          onBoardSet({
            ...board,
            domains: board.domains.map((d) =>
              d.id === id ? { ...d, position: { x: newX, y: newY } } : d
            ),
          });
        } else if (type === "hotspot") {
          onBoardSet({
            ...board,
            hotspots: board.hotspots.map((h) =>
              h.id === id ? { ...h, position: { x: newX, y: newY } } : h
            ),
          });
        }
        return;
      }

      // リサイズ中（中間更新: Undo スナップショットなし）
      if (resizeRef.current) {
        const dx = (e.clientX - resizeRef.current.startX) / viewport.zoom;
        const dy = (e.clientY - resizeRef.current.startY) / viewport.zoom;
        const { type, id, edge, origPos, origSize } = resizeRef.current;

        let newX = origPos.x;
        let newY = origPos.y;
        let newW = origSize.width;
        let newH = origSize.height;

        if (edge.includes("e")) newW = Math.max(200, origSize.width + dx);
        if (edge.includes("s")) newH = Math.max(120, origSize.height + dy);
        if (edge.includes("w")) {
          newW = Math.max(200, origSize.width - dx);
          newX = origPos.x + (origSize.width - newW);
        }
        if (edge.includes("n")) {
          newH = Math.max(120, origSize.height - dy);
          newY = origPos.y + (origSize.height - newH);
        }

        if (type === "context") {
          onBoardSet({
            ...board,
            contexts: board.contexts.map((c) =>
              c.id === id
                ? { ...c, position: { x: newX, y: newY }, size: { width: newW, height: newH } }
                : c
            ),
          });
        } else if (type === "domain") {
          onBoardSet({
            ...board,
            domains: board.domains.map((d) =>
              d.id === id
                ? { ...d, position: { x: newX, y: newY }, size: { width: newW, height: newH } }
                : d
            ),
          });
        }
        return;
      }

      canvasPointerMove(e);
    },
    [
      drawingRect,
      getCanvasCoords,
      viewport.zoom,
      board,
      onBoardSet,
      canvasPointerMove,
    ]
  );

  // ポインタアップの統合ハンドラ
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // 矩形描画完了
      if (drawingRect) {
        const x = Math.min(drawingRect.startX, drawingRect.currentX);
        const y = Math.min(drawingRect.startY, drawingRect.currentY);
        const w = Math.abs(drawingRect.currentX - drawingRect.startX);
        const h = Math.abs(drawingRect.currentY - drawingRect.startY);

        if (w > 30 && h > 30) {
          if (toolMode === "addContext") {
            const ctx = createBoundedContext(x, y, w, h);
            onBoardChange({
              ...board,
              contexts: [...board.contexts, ctx],
              updatedAt: new Date().toISOString(),
            });
          } else if (toolMode === "addDomain") {
            const dom = createDomain(x, y, w, h);
            onBoardChange({
              ...board,
              domains: [...board.domains, dom],
              updatedAt: new Date().toISOString(),
            });
          }
          onToolModeReset();
        }
        setDrawingRect(null);
        return;
      }

      // ドラッグ終了（最終位置を確定的に反映 → Undo スナップショット作成）
      if (dragRef.current) {
        onBoardChange({ ...boardRef.current, updatedAt: new Date().toISOString() });
        dragRef.current = null;
        return;
      }

      // リサイズ終了（最終サイズを確定的に反映 → Undo スナップショット作成）
      if (resizeRef.current) {
        onBoardChange({ ...boardRef.current, updatedAt: new Date().toISOString() });
        resizeRef.current = null;
        return;
      }

      canvasPointerUp(e);
    },
    [drawingRect, toolMode, board, onBoardChange, onToolModeReset, canvasPointerUp]
  );

  // ポインタダウンの統合ハンドラ
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      handleCanvasPointerDownForDraw(e);
      if (toolMode === "addContext" || toolMode === "addDomain") return;
      canvasPointerDown(e);
    },
    [handleCanvasPointerDownForDraw, toolMode, canvasPointerDown]
  );

  // フローのドラッグ開始
  const handleFlowDragStart = useCallback(
    (flowId: string, e: React.PointerEvent) => {
      if (toolMode !== "select") return;
      const flow = board.flows.find((f) => f.id === flowId);
      if (!flow) return;
      setSelectedId(flowId);
      dragRef.current = {
        type: "flow",
        id: flowId,
        startX: e.clientX,
        startY: e.clientY,
        origX: flow.position.x,
        origY: flow.position.y,
      };
    },
    [toolMode, board.flows]
  );

  // コンテキスト/ドメインのドラッグ開始
  const handleRectDragStart = useCallback(
    (type: "context" | "domain", id: string, e: React.PointerEvent) => {
      if (toolMode !== "select") return;
      const item =
        type === "context"
          ? board.contexts.find((c) => c.id === id)
          : board.domains.find((d) => d.id === id);
      if (!item) return;
      setSelectedId(id);
      dragRef.current = {
        type,
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: item.position.x,
        origY: item.position.y,
      };
    },
    [toolMode, board.contexts, board.domains]
  );

  // リサイズ開始
  const handleResizeStart = useCallback(
    (type: "context" | "domain", id: string, edge: string, e: React.PointerEvent) => {
      e.stopPropagation();
      const item =
        type === "context"
          ? board.contexts.find((c) => c.id === id)
          : board.domains.find((d) => d.id === id);
      if (!item) return;
      resizeRef.current = {
        type,
        id,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origPos: { ...item.position },
        origSize: { ...item.size },
      };
    },
    [board.contexts, board.domains]
  );

  // ホットスポットのドラッグ開始
  const handleHotspotDragStart = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (toolMode !== "select") return;
      const hs = board.hotspots.find((h) => h.id === id);
      if (!hs) return;
      setSelectedId(id);
      dragRef.current = {
        type: "hotspot",
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: hs.position.x,
        origY: hs.position.y,
      };
    },
    [toolMode, board.hotspots]
  );

  // フロークリック（接続ツール用）
  const handleFlowClick = useCallback(
    (flowId: string) => {
      if (toolMode === "addConnection") {
        if (!connectionFrom) {
          setConnectionFrom(flowId);
        } else if (connectionFrom !== flowId) {
          const conn = createFlowConnection(connectionFrom, flowId);
          onBoardChange({
            ...board,
            connections: [...board.connections, conn],
            updatedAt: new Date().toISOString(),
          });
          setConnectionFrom(null);
          onToolModeReset();
        }
      } else if (toolMode === "select") {
        setSelectedId(flowId);
      }
    },
    [toolMode, connectionFrom, board, onBoardChange, onToolModeReset]
  );

  // ノート編集開始
  const handleNoteDoubleClick = useCallback(
    (flowId: string, slotType: SlotType, noteId: string, domRect: DOMRect) => {
      const flow = board.flows.find((f) => f.id === flowId);
      if (!flow) return;
      const note = flow.slots[slotType].find((n) => n.id === noteId);
      if (!note) return;
      setEditingNote({
        flowId,
        slotType,
        noteId,
        text: note.text,
        rect: {
          x: domRect.left,
          y: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      });
    },
    [board.flows]
  );

  // ノート編集確定
  const handleNoteEditCommit = useCallback(
    (text: string) => {
      if (!editingNote) return;
      onBoardChange({
        ...board,
        flows: board.flows.map((f) =>
          f.id === editingNote.flowId
            ? {
                ...f,
                slots: {
                  ...f.slots,
                  [editingNote.slotType]: f.slots[editingNote.slotType].map((n) =>
                    n.id === editingNote.noteId ? { ...n, text } : n
                  ),
                },
              }
            : f
        ),
        updatedAt: new Date().toISOString(),
      });
      setEditingNote(null);
    },
    [editingNote, board, onBoardChange]
  );

  // ラベル編集開始
  const handleLabelDoubleClick = useCallback(
    (type: "context" | "domain", id: string, domRect: DOMRect) => {
      const item =
        type === "context"
          ? board.contexts.find((c) => c.id === id)
          : board.domains.find((d) => d.id === id);
      if (!item) return;
      setEditingLabel({
        type,
        id,
        text: item.name,
        rect: {
          x: domRect.left,
          y: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      });
    },
    [board.contexts, board.domains]
  );

  // ラベル編集確定
  const handleLabelEditCommit = useCallback(
    (text: string) => {
      if (!editingLabel) return;
      if (editingLabel.type === "context") {
        onBoardChange({
          ...board,
          contexts: board.contexts.map((c) =>
            c.id === editingLabel.id ? { ...c, name: text } : c
          ),
          updatedAt: new Date().toISOString(),
        });
      } else {
        onBoardChange({
          ...board,
          domains: board.domains.map((d) =>
            d.id === editingLabel.id ? { ...d, name: text } : d
          ),
          updatedAt: new Date().toISOString(),
        });
      }
      setEditingLabel(null);
    },
    [editingLabel, board, onBoardChange]
  );

  // ノート削除（右クリック）
  const handleNoteContextMenu = useCallback(
    (flowId: string, slotType: SlotType, noteId: string, e: React.MouseEvent) => {
      e.preventDefault();
      // events が最後の1つなら削除しない
      const flow = board.flows.find((f) => f.id === flowId);
      if (!flow) return;
      if (slotType === "events" && flow.slots.events.length <= 1) return;

      onBoardChange({
        ...board,
        flows: board.flows.map((f) =>
          f.id === flowId
            ? {
                ...f,
                slots: {
                  ...f.slots,
                  [slotType]: f.slots[slotType].filter((n) => n.id !== noteId),
                },
              }
            : f
        ),
        updatedAt: new Date().toISOString(),
      });
    },
    [board, onBoardChange]
  );

  // 選択要素の削除
  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editingNote || editingLabel) return;
        if (!selectedId) return;

        // フロー削除
        if (board.flows.some((f) => f.id === selectedId)) {
          onBoardChange({
            ...board,
            flows: board.flows.filter((f) => f.id !== selectedId),
            connections: board.connections.filter(
              (c) => c.fromFlowId !== selectedId && c.toFlowId !== selectedId
            ),
            updatedAt: new Date().toISOString(),
          });
          setSelectedId(null);
          return;
        }
        // コンテキスト削除
        if (board.contexts.some((c) => c.id === selectedId)) {
          onBoardChange({
            ...board,
            contexts: board.contexts.filter((c) => c.id !== selectedId),
            updatedAt: new Date().toISOString(),
          });
          setSelectedId(null);
          return;
        }
        // ドメイン削除
        if (board.domains.some((d) => d.id === selectedId)) {
          onBoardChange({
            ...board,
            domains: board.domains.filter((d) => d.id !== selectedId),
            updatedAt: new Date().toISOString(),
          });
          setSelectedId(null);
          return;
        }
        // 接続削除
        if (board.connections.some((c) => c.id === selectedId)) {
          onBoardChange({
            ...board,
            connections: board.connections.filter((c) => c.id !== selectedId),
            updatedAt: new Date().toISOString(),
          });
          setSelectedId(null);
          return;
        }
        // ホットスポット削除
        if (board.hotspots.some((h) => h.id === selectedId)) {
          onBoardChange({
            ...board,
            hotspots: board.hotspots.filter((h) => h.id !== selectedId),
            updatedAt: new Date().toISOString(),
          });
          setSelectedId(null);
          return;
        }
      }
      handleKeyDown(e);
    },
    [
      selectedId,
      editingNote,
      editingLabel,
      board,
      onBoardChange,
      handleKeyDown,
    ]
  );

  // ノート追加
  const handleAddNote = useCallback(
    (flowId: string, slotType: SlotType) => {
      const note = createFlowNote();
      onBoardChange({
        ...board,
        flows: board.flows.map((f) =>
          f.id === flowId
            ? {
                ...f,
                slots: {
                  ...f.slots,
                  [slotType]: [...f.slots[slotType], note],
                },
              }
            : f
        ),
        updatedAt: new Date().toISOString(),
      });
    },
    [board, onBoardChange]
  );

  // ホットスポット編集
  const handleHotspotDoubleClick = useCallback(
    (id: string, domRect: DOMRect) => {
      const hs = board.hotspots.find((h) => h.id === id);
      if (!hs) return;
      setEditingLabel({
        type: "hotspot",
        id,
        text: hs.text,
        rect: {
          x: domRect.left,
          y: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      });
    },
    [board.hotspots]
  );

  // ホットスポット編集確定（ラベル編集コールバックを上書き）
  const handleEditCommit = useCallback(
    (text: string) => {
      if (editingNote) {
        handleNoteEditCommit(text);
        return;
      }
      if (!editingLabel) return;

      // ホットスポット編集
      if (editingLabel.type === "hotspot") {
        onBoardChange({
          ...board,
          hotspots: board.hotspots.map((h) =>
            h.id === editingLabel.id ? { ...h, text } : h
          ),
          updatedAt: new Date().toISOString(),
        });
        setEditingLabel(null);
        return;
      }
      handleLabelEditCommit(text);
    },
    [editingNote, editingLabel, board, onBoardChange, handleNoteEditCommit, handleLabelEditCommit]
  );

  // 接続矢印クリック
  const handleConnectionClick = useCallback(
    (connId: string) => {
      setSelectedId(connId);
    },
    []
  );

  const cursorClass =
    toolMode === "addFlow" || toolMode === "addHotspot"
      ? "cursor-crosshair"
      : toolMode === "addContext" || toolMode === "addDomain"
        ? "cursor-crosshair"
        : toolMode === "addConnection"
          ? "cursor-pointer"
          : isPanning
            ? "cursor-grabbing"
            : "cursor-default";

  const isEmpty =
    board.flows.length === 0 &&
    board.contexts.length === 0 &&
    board.domains.length === 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-950 ${cursorClass} outline-none`}
      tabIndex={0}
      role="application"
      aria-label={t("title")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDownCapture}
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

      {/* 描画中の矩形プレビュー */}
      {drawingRect && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <rect
            x={
              Math.min(drawingRect.startX, drawingRect.currentX) * viewport.zoom +
              viewport.x
            }
            y={
              Math.min(drawingRect.startY, drawingRect.currentY) * viewport.zoom +
              viewport.y
            }
            width={
              Math.abs(drawingRect.currentX - drawingRect.startX) * viewport.zoom
            }
            height={
              Math.abs(drawingRect.currentY - drawingRect.startY) * viewport.zoom
            }
            fill="none"
            stroke={toolMode === "addContext" ? "#3B82F6" : "#8B5CF6"}
            strokeWidth={2}
            strokeDasharray="6 3"
            rx={8}
          />
        </svg>
      )}

      {/* キャンバスコンテンツ */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* ドメイン（最背面） */}
        {board.domains.map((domain) => (
          <DomainRect
            key={domain.id}
            domain={domain}
            isSelected={selectedId === domain.id}
            onDragStart={(e) => handleRectDragStart("domain", domain.id, e)}
            onResizeStart={(edge, e) =>
              handleResizeStart("domain", domain.id, edge, e)
            }
            onDoubleClick={(domRect) =>
              handleLabelDoubleClick("domain", domain.id, domRect)
            }
          />
        ))}

        {/* 境界づけられたコンテキスト */}
        {board.contexts.map((ctx) => (
          <BoundedContextRect
            key={ctx.id}
            context={ctx}
            isSelected={selectedId === ctx.id}
            onDragStart={(e) => handleRectDragStart("context", ctx.id, e)}
            onResizeStart={(edge, e) =>
              handleResizeStart("context", ctx.id, edge, e)
            }
            onDoubleClick={(domRect) =>
              handleLabelDoubleClick("context", ctx.id, domRect)
            }
          />
        ))}

        {/* SVG矢印オーバーレイ */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            <marker
              id={arrowheadId}
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-gray-600 dark:fill-gray-400"
              />
            </marker>
          </defs>
          {board.connections.map((conn) => (
            <FlowConnectionArrow
              key={conn.id}
              connection={conn}
              flows={board.flows}
              isSelected={selectedId === conn.id}
              onClick={() => handleConnectionClick(conn.id)}
              arrowheadId={arrowheadId}
            />
          ))}
        </svg>

        {/* イベントフロー */}
        {board.flows.map((flow) => (
          <EventFlowComponent
            key={flow.id}
            flow={flow}
            isSelected={selectedId === flow.id}
            isConnectionSource={connectionFrom === flow.id}
            onDragStart={(e) => handleFlowDragStart(flow.id, e)}
            onClick={() => handleFlowClick(flow.id)}
            onNoteDoubleClick={(slotType, noteId, domRect) =>
              handleNoteDoubleClick(flow.id, slotType, noteId, domRect)
            }
            onNoteContextMenu={(slotType, noteId, e) =>
              handleNoteContextMenu(flow.id, slotType, noteId, e)
            }
            onAddNote={(slotType) => handleAddNote(flow.id, slotType)}
          />
        ))}

        {/* ホットスポット */}
        {board.hotspots.map((hs) => (
          <HotspotBubble
            key={hs.id}
            hotspot={hs}
            isSelected={selectedId === hs.id}
            onDragStart={(e) => handleHotspotDragStart(hs.id, e)}
            onDoubleClick={(domRect) => handleHotspotDoubleClick(hs.id, domRect)}
          />
        ))}
      </div>

      {/* 空キャンバスのヒント */}
      {isEmpty && toolMode === "select" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-gray-400 dark:text-gray-500 text-lg font-medium">
              {t("emptyHint.title")}
            </p>
            <div className="text-gray-400/80 dark:text-gray-600 text-sm space-y-1">
              <p>
                {t("emptyHint.addFlow", { addFlowLabel: `+ ${t("toolbar.addFlow")}` })}
              </p>
              <p>
                {t("emptyHint.addBoundary", {
                  addContextLabel: `□ ${t("toolbar.addContext")}`,
                  addDomainLabel: `◫ ${t("toolbar.addDomain")}`,
                })}
              </p>
              <p>
                {t("emptyHint.addConnection", { addConnectionLabel: `→ ${t("toolbar.addConnection")}` })}
              </p>
            </div>
            <p className="text-gray-400/60 dark:text-gray-600 text-xs pt-1">
              {t("emptyHint.legendHint")}
            </p>
          </div>
        </div>
      )}

      {/* 凡例・操作ガイド */}
      <Legend />

      {/* テキスト編集ポップオーバー */}
      {(editingNote || editingLabel) && (
        <NoteEditor
          initialText={editingNote?.text ?? editingLabel?.text ?? ""}
          position={
            editingNote?.rect ?? editingLabel?.rect ?? { x: 0, y: 0, width: 100, height: 50 }
          }
          onCommit={handleEditCommit}
          onCancel={() => {
            setEditingNote(null);
            setEditingLabel(null);
          }}
        />
      )}
    </div>
  );
});
