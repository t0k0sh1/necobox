"use client";

import {
  type Hotspot,
  SLOT_COLORS,
} from "@/lib/utils/domain-modeling";
import { useRef } from "react";

interface HotspotBubbleProps {
  hotspot: Hotspot;
  isSelected: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onDoubleClick: (domRect: DOMRect) => void;
}

export function HotspotBubble({
  hotspot,
  isSelected,
  onDragStart,
  onDoubleClick,
}: HotspotBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) onDoubleClick(rect);
  };

  return (
    <div
      ref={bubbleRef}
      className="absolute select-none"
      style={{
        left: `${hotspot.position.x}px`,
        top: `${hotspot.position.y}px`,
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
      {/* 吹き出し本体 */}
      <div
        className="relative min-w-[80px] max-w-[200px] px-3 py-2 rounded-lg shadow-sm"
        style={{
          backgroundColor: SLOT_COLORS.hotspot.bg,
          color: SLOT_COLORS.hotspot.text,
          border: isSelected ? "2px solid #3B82F6" : "none",
        }}
      >
        <span className="text-xs font-medium break-words">
          {hotspot.text || "?"}
        </span>
        {/* 吹き出し三角 */}
        <div
          className="absolute -bottom-2 left-4 w-0 h-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `8px solid ${SLOT_COLORS.hotspot.bg}`,
          }}
        />
      </div>
    </div>
  );
}
