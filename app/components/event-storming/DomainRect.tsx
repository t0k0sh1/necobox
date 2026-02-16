"use client";

import {
  type Domain,
  type DomainType,
  DOMAIN_TYPE_COLORS,
} from "@/lib/utils/event-storming";
import { useRef } from "react";

interface DomainRectProps {
  domain: Domain;
  isSelected: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (edge: string, e: React.PointerEvent) => void;
  onDoubleClick: (domRect: DOMRect) => void;
}

const RESIZE_HANDLE_SIZE = 8;

const DOMAIN_TYPE_LABELS: Record<DomainType, string> = {
  core: "Core",
  supporting: "Supporting",
  generic: "Generic",
};

export function DomainRect({
  domain,
  isSelected,
  onDragStart,
  onResizeStart,
  onDoubleClick,
}: DomainRectProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const borderColor = DOMAIN_TYPE_COLORS[domain.type];

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = labelRef.current?.getBoundingClientRect();
    if (rect) onDoubleClick(rect);
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${domain.position.x}px`,
        top: `${domain.position.y}px`,
        width: `${domain.size.width}px`,
        height: `${domain.size.height}px`,
      }}
    >
      {/* 背景矩形 */}
      <div
        className="w-full h-full rounded-xl border-2"
        style={{
          borderColor: isSelected ? "#8B5CF6" : `${borderColor}80`,
          backgroundColor: `${borderColor}08`,
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
          className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
          style={{
            backgroundColor: borderColor,
            color: "#FFFFFF",
          }}
        >
          <span>{DOMAIN_TYPE_LABELS[domain.type]}</span>
          {domain.name && (
            <>
              <span className="opacity-60">|</span>
              <span>{domain.name}</span>
            </>
          )}
        </div>
      </div>

      {/* リサイズハンドル（選択時のみ） */}
      {isSelected && (
        <>
          {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((edge) => (
            <div
              key={edge}
              className="absolute rounded-sm"
              style={{
                width: `${RESIZE_HANDLE_SIZE}px`,
                height: `${RESIZE_HANDLE_SIZE}px`,
                backgroundColor: borderColor,
                cursor: getResizeCursor(edge),
                ...getHandlePosition(edge, domain.size.width, domain.size.height),
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
