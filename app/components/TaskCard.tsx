"use client";

import { TaskFormPopover } from "@/app/components/TaskFormPopover";
import type { Task } from "@/lib/utils/matrix-todo";
import {
  CARD_WIDTH_CELLS,
  getCategoryColor,
  getDeadlineBadgeClass,
  getDeadlineDisplay,
} from "@/lib/utils/matrix-todo";
import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

interface TaskCardProps {
  task: Task;
  cellSize: number;
  existingCategories: string[];
  onUpdate: (taskId: string, data: { title: string; description: string | null; category: string; deadline: string | null }) => void;
  onDelete: (taskId: string) => void;
  onPopoverOpenChange?: (open: boolean) => void;
}

export function TaskCard({
  task,
  cellSize,
  existingCategories,
  onUpdate,
  onDelete,
  onPopoverOpenChange,
}: TaskCardProps) {
  const t = useTranslations("matrixTodo.task");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setPopoverOpen(open);
    onPopoverOpenChange?.(open);
  }, [onPopoverOpenChange]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: popoverOpen,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: task.gridX * cellSize,
    top: task.gridY * cellSize,
    width: CARD_WIDTH_CELLS * cellSize,
    minHeight: cellSize * 2,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  const categoryColor = getCategoryColor(task.category);
  const deadlineDisplay = getDeadlineDisplay(task.deadline, {
    noDeadline: t("noDeadline"),
    overdue: t("overdue"),
    today: t("today"),
    tomorrow: t("tomorrow"),
    daysLater: (days: number) => t("daysLater", { days }),
  });
  const deadlineBadgeClass = getDeadlineBadgeClass(task.deadline);

  const cardContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if ((e.key === "Delete" || e.key === "Backspace") && !popoverOpen) {
          e.preventDefault();
          onDelete(task.id);
        }
      }}
      className="group rounded-md border bg-white dark:bg-gray-900 shadow-sm overflow-visible select-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={task.title}
      aria-describedby={task.description ? `task-desc-${task.id}` : undefined}
    >
      {/* ヘッダー: カテゴリ + 期限 */}
      <div className="flex items-center justify-between px-2 py-1.5 gap-1">
        {task.category ? (
          <span
            className="text-xs font-medium truncate"
            style={{ color: categoryColor }}
          >
            {task.category}
          </span>
        ) : (
          <span />
        )}
        {task.deadline && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${deadlineBadgeClass}`}
          >
            {deadlineDisplay}
          </span>
        )}
      </div>
      {/* タイトル */}
      <div className="px-2 pb-2">
        <p className="text-sm leading-snug break-words line-clamp-3">
          {task.title}
        </p>
      </div>
      {/* 説明ツールチップ（ホバー時表示、ドラッグ中は非表示） */}
      {task.description && !isDragging && (
        <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-[60] w-full">
          <div id={`task-desc-${task.id}`} role="tooltip" className="rounded-md border bg-popover px-2 py-1.5 shadow-md">
            <p className="text-xs text-popover-foreground whitespace-pre-wrap break-words line-clamp-5">
              {task.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TaskFormPopover
      task={task}
      existingCategories={existingCategories}
      trigger={cardContent}
      open={popoverOpen}
      onOpenChange={handlePopoverOpenChange}
      onSave={(data) => onUpdate(task.id, data)}
      onDelete={() => onDelete(task.id)}
    />
  );
}
