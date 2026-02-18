"use client";

import {
  type FlowConnection,
  type EventFlow,
  type ContextMappingPattern,
  CONTEXT_MAPPING_PATTERN_TO_CATEGORY,
  CONTEXT_MAPPING_PATTERN_ABBR,
  CONTEXT_MAPPING_CATEGORY_COLORS,
  getConnectionDirection,
  getFlowExitPoint,
  getFlowEntryPoint,
  buildManhattanPath,
  getMidpointOfPath,
} from "@/lib/utils/domain-modeling";

interface FlowConnectionArrowProps {
  connection: FlowConnection;
  flows: EventFlow[];
  isSelected: boolean;
  onClick: () => void;
  arrowheadIdPrefix: string;
}

export function FlowConnectionArrow({
  connection,
  flows,
  isSelected,
  onClick,
  arrowheadIdPrefix,
}: FlowConnectionArrowProps) {
  const fromFlow = flows.find((f) => f.id === connection.fromFlowId);
  const toFlow = flows.find((f) => f.id === connection.toFlowId);
  if (!fromFlow || !toFlow) return null;

  const direction = getConnectionDirection(fromFlow, toFlow);
  const exit = getFlowExitPoint(fromFlow, direction);
  const entry = getFlowEntryPoint(toFlow, direction);
  const path = buildManhattanPath(exit, entry, direction);
  const mid = getMidpointOfPath(exit, entry);

  const pattern: ContextMappingPattern | undefined = connection.pattern;
  const category = pattern ? CONTEXT_MAPPING_PATTERN_TO_CATEGORY[pattern] : undefined;
  const categoryColor = category ? CONTEXT_MAPPING_CATEGORY_COLORS[category] : undefined;

  // マーカーsuffixの決定
  const markerSuffix = isSelected
    ? "selected"
    : category
      ? category
      : "default";
  const markerEnd = `url(#${arrowheadIdPrefix}-${markerSuffix})`;

  // 線色の決定
  const strokeColor = isSelected
    ? "#3b82f6"
    : categoryColor
      ? categoryColor
      : undefined;

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
        stroke={strokeColor}
        className={
          strokeColor ? undefined : "stroke-gray-500 dark:stroke-gray-400"
        }
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={isSelected || pattern ? undefined : "6 3"}
        markerEnd={markerEnd}
      />
      {/* パターンバッジ */}
      {pattern && (
        <g>
          <rect
            x={mid.x - 16}
            y={mid.y - 9}
            width={32}
            height={18}
            rx={4}
            fill={categoryColor}
            opacity={0.9}
          />
          <text
            x={mid.x}
            y={mid.y + 4}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="white"
          >
            {CONTEXT_MAPPING_PATTERN_ABBR[pattern]}
          </text>
        </g>
      )}
      {/* ラベル */}
      {connection.label && (
        <text
          x={mid.x}
          y={mid.y - (pattern ? 14 : 8)}
          textAnchor="middle"
          className="text-[10px] fill-gray-600 dark:fill-gray-400"
        >
          {connection.label}
        </text>
      )}
    </g>
  );
}
