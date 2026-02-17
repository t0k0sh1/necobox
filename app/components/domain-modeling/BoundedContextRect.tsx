"use client";

import type { BoundedContext } from "@/lib/utils/domain-modeling";
import { useRef } from "react";

interface BoundedContextRectProps {
  context: BoundedContext;
  isSelected: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (edge: string, e: React.PointerEvent) => void;
  onDoubleClick: (domRect: DOMRect) => void;
}

const RESIZE_HANDLE_SIZE = 8;

export function BoundedContextRect({
  context,
  isSelected,
  onDragStart,
  onResizeStart,
  onDoubleClick,
}: BoundedContextRectProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = labelRef.current?.getBoundingClientRect();
    if (rect) onDoubleClick(rect);
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${context.position.x}px`,
        top: `${context.position.y}px`,
        width: `${context.size.width}px`,
        height: `${context.size.height}px`,
      }}
    >
      {/* 背景矩形 */}
      <div
        className="w-full h-full rounded-lg border-2 border-dashed"
        style={{
          borderColor: isSelected ? "#3B82F6" : "#3B82F680",
          backgroundColor: "#3B82F60A",
        }}
        onPointerDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onDragStart(e);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
      >
        {/* ラベル */}
        <div
          ref={labelRef}
          className="absolute -top-3 left-3 px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
        >
          {context.name || "Bounded Context"}
        </div>
      </div>

      {/* リサイズハンドル（選択時のみ） */}
      {isSelected && (
        <>
          {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((edge) => (
            <div
              key={edge}
              className="absolute bg-blue-500 rounded-sm"
              style={{
                width: `${RESIZE_HANDLE_SIZE}px`,
                height: `${RESIZE_HANDLE_SIZE}px`,
                cursor: getResizeCursor(edge),
                ...getHandlePosition(edge, context.size.width, context.size.height),
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeStart(edge, e);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function getResizeCursor(edge: string): string {
  const cursors: Record<string, string> = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
  };
  return cursors[edge] ?? "default";
}

function getHandlePosition(
  edge: string,
  width: number,
  height: number
): React.CSSProperties {
  const half = RESIZE_HANDLE_SIZE / 2;
  const positions: Record<string, React.CSSProperties> = {
    n: { left: `${width / 2 - half}px`, top: `${-half}px` },
    s: { left: `${width / 2 - half}px`, top: `${height - half}px` },
    e: { left: `${width - half}px`, top: `${height / 2 - half}px` },
    w: { left: `${-half}px`, top: `${height / 2 - half}px` },
    ne: { left: `${width - half}px`, top: `${-half}px` },
    nw: { left: `${-half}px`, top: `${-half}px` },
    se: { left: `${width - half}px`, top: `${height - half}px` },
    sw: { left: `${-half}px`, top: `${height - half}px` },
  };
  return positions[edge] ?? {};
}
