"use client";

import {
  type EventFlow,
  type SlotType,
  SLOT_ORDER,
  SLOT_COLORS,
  CELL_SIZE,
} from "@/lib/utils/event-storming";
import { FlowSlotCell, SlotAddButton } from "./FlowSlotCell";
import { Plus } from "lucide-react";

interface EventFlowProps {
  flow: EventFlow;
  isSelected: boolean;
  isConnectionSource: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onClick: () => void;
  onNoteDoubleClick: (
    slotType: SlotType,
    noteId: string,
    domRect: DOMRect
  ) => void;
  onNoteContextMenu: (
    slotType: SlotType,
    noteId: string,
    e: React.MouseEvent
  ) => void;
  onAddNote: (slotType: SlotType) => void;
}

/** スロット種別の日本語ラベル */
const SLOT_LABELS: Record<SlotType, string> = {
  views: "ビュー",
  actors: "アクター",
  commands: "コマンド",
  aggregates: "集約",
  events: "イベント",
  externalSystems: "外部システム",
  policies: "ポリシー",
};

export function EventFlowComponent({
  flow,
  isSelected,
  isConnectionSource,
  onDragStart,
  onClick,
  onNoteDoubleClick,
  onNoteContextMenu,
  onAddNote,
}: EventFlowProps) {
  return (
    <div
      className="absolute group"
      style={{
        left: `${flow.position.x}px`,
        top: `${flow.position.y}px`,
      }}
      onPointerDown={(e) => {
        if (e.button === 0) {
          e.stopPropagation();
          onDragStart(e);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* 選択/接続ソース枠 */}
      {(isSelected || isConnectionSource) && (
        <div
          className="absolute -inset-1.5 rounded border-2 pointer-events-none"
          style={{
            borderColor: isConnectionSource ? "#FF8C00" : "#3B82F6",
          }}
        />
      )}

      {/* メインフロー: 横一列 */}
      <div className="flex items-start">
        {SLOT_ORDER.map((slotType) => {
          const notes = flow.slots[slotType];
          const hasNotes = notes.length > 0;

          // ノートが無いスロットはスペースを取らない
          if (!hasNotes) return null;

          return (
            <div key={slotType} className="flex flex-col">
              {/* スロットのノート群（縦スタック） */}
              {notes.map((note) => (
                <FlowSlotCell
                  key={note.id}
                  slotType={slotType}
                  noteId={note.id}
                  text={note.text}
                  onDoubleClick={(domRect) =>
                    onNoteDoubleClick(slotType, note.id, domRect)
                  }
                  onContextMenu={(e) =>
                    onNoteContextMenu(slotType, note.id, e)
                  }
                />
              ))}

              {/* 同じスロットにもう1つ追加するボタン（ホバー時表示） */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <SlotAddButton
                  slotType={slotType}
                  onAdd={() => onAddNote(slotType)}
                />
              </div>
            </div>
          );
        })}

        {/* 空スロット追加メニュー（ホバー時にコンパクト表示） */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start">
          {SLOT_ORDER.filter((s) => flow.slots[s].length === 0).map(
            (slotType) => (
              <button
                key={slotType}
                type="button"
                className="flex flex-col items-center justify-center gap-0.5 border border-dashed border-black/15 hover:border-black/40 transition-colors rounded"
                style={{
                  width: "36px",
                  height: `${CELL_SIZE.height}px`,
                  backgroundColor: `${SLOT_COLORS[slotType].bg}44`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNote(slotType);
                }}
                title={`${SLOT_LABELS[slotType]}を追加`}
              >
                <Plus className="w-3 h-3 opacity-50" />
                <span
                  className="text-[8px] leading-tight opacity-60"
                  style={{ writingMode: "vertical-rl" }}
                >
                  {SLOT_LABELS[slotType]}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* ポリシー（イベントの右下に表示） */}
      {flow.slots.policies.length > 0 && (
        <div
          className="flex flex-col"
          style={{
            marginLeft: `${calculatePolicyOffset(flow)}px`,
            marginTop: "2px",
          }}
        >
          {flow.slots.policies.map((note) => (
            <FlowSlotCell
              key={note.id}
              slotType="policies"
              noteId={note.id}
              text={note.text}
              onDoubleClick={(domRect) =>
                onNoteDoubleClick("policies", note.id, domRect)
              }
              onContextMenu={(e) =>
                onNoteContextMenu("policies", note.id, e)
              }
            />
          ))}
        </div>
      )}

      {/* ポリシー追加ボタン */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="flex items-center justify-center border border-dashed border-black/15 hover:border-black/30 transition-colors text-[10px] opacity-60 hover:opacity-100 mt-0.5"
          style={{
            width: `${CELL_SIZE.width}px`,
            height: "28px",
            backgroundColor: `${SLOT_COLORS.policies.bg}33`,
            marginLeft: `${calculatePolicyOffset(flow)}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAddNote("policies");
          }}
        >
          ポリシー
        </button>
      </div>
    </div>
  );
}

/** ポリシーの水平オフセットを計算（eventsスロットの位置に合わせる） */
function calculatePolicyOffset(flow: EventFlow): number {
  let offset = 0;
  for (const slot of SLOT_ORDER) {
    if (slot === "events") break;
    if (flow.slots[slot].length > 0) {
      offset += CELL_SIZE.width;
    }
  }
  return offset;
}
