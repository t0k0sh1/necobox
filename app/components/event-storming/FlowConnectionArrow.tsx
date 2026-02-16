"use client";

import {
  type FlowConnection,
  type EventFlow,
  getFlowCenter,
  getFlowWidth,
} from "@/lib/utils/event-storming";

interface FlowConnectionArrowProps {
  connection: FlowConnection;
  flows: EventFlow[];
  isSelected: boolean;
  onClick: () => void;
}

export function FlowConnectionArrow({
  connection,
  flows,
  isSelected,
  onClick,
}: FlowConnectionArrowProps) {
  const fromFlow = flows.find((f) => f.id === connection.fromFlowId);
  const toFlow = flows.find((f) => f.id === connection.toFlowId);
  if (!fromFlow || !toFlow) return null;

  // 始点: ソースフローのイベントスロット右端
  const fromCenter = getFlowCenter(fromFlow);
  const fromRight = fromFlow.position.x + getFlowWidth(fromFlow);
  const fromY = fromCenter.y;

  // 終点: ターゲットフローの左端中央
  const toCenter = getFlowCenter(toFlow);
  const toX = toFlow.position.x;
  const toY = toCenter.y;

  // ベジェ曲線の制御点
  const dx = Math.abs(toX - fromRight);
  const cpOffset = Math.max(40, dx * 0.4);

  const path = `M ${fromRight} ${fromY} C ${fromRight + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;

  return (
    <g
      className="cursor-pointer pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* クリック領域（太い透明な線） */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
      />
      {/* 表示する矢印線 */}
      <path
        d={path}
        fill="none"
        className={
          isSelected
            ? "stroke-blue-500"
            : "stroke-gray-500 dark:stroke-gray-400"
        }
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={isSelected ? undefined : "6 3"}
        markerEnd="url(#arrowhead)"
      />
      {/* ラベル */}
      {connection.label && (
        <text
          x={(fromRight + toX) / 2}
          y={(fromY + toY) / 2 - 8}
          textAnchor="middle"
          className="text-[10px] fill-gray-600 dark:fill-gray-400"
        >
          {connection.label}
        </text>
      )}
    </g>
  );
}
