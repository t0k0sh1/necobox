"use client";

import { TaskFormPopover } from "@/app/components/TaskFormPopover";
import type { Task } from "@/lib/utils/matrix-todo";
import {
  getCategoryColor,
  getDeadlineBadgeClass,
  getDeadlineDisplay,
} from "@/lib/utils/matrix-todo";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

interface TaskSidebarProps {
  tasks: Task[];
  taskOrder: string[];
  existingCategories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskOrderChange: (newOrder: string[]) => void;
  onUpdateTask: (taskId: string, data: { title: string; description: string | null; category: string; deadline: string | null }) => void;
  onDeleteTask: (taskId: string) => void;
}

interface SortableTaskItemProps {
  task: Task;
  existingCategories: string[];
  onUpdate: (taskId: string, data: { title: string; description: string | null; category: string; deadline: string | null }) => void;
  onDelete: (taskId: string) => void;
}

function SortableTaskItem({ task, existingCategories, onUpdate, onDelete }: SortableTaskItemProps) {
  const t = useTranslations("matrixTodo.task");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: popoverOpen,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const itemContent = (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start gap-1.5 p-2 rounded-md border bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer select-none"
    >
      {/* ドラッグハンドル */}
      <button
        type="button"
        className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* タスク情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {task.category && (
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
          )}
          <span className="text-sm truncate">{task.title}</span>
        </div>
        {task.deadline && (
          <span
            className={`inline-block text-xs mt-1 px-1.5 py-0.5 rounded-full ${deadlineBadgeClass}`}
          >
            {deadlineDisplay}
          </span>
        )}
      </div>
      {/* 説明ツールチップ（ホバー時表示、ドラッグ中は非表示） */}
      {task.description && !isDragging && (
        <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 w-full">
          <div className="rounded-md border bg-popover px-2 py-1.5 shadow-md">
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
      trigger={itemContent}
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      onSave={(data) => onUpdate(task.id, data)}
      onDelete={() => onDelete(task.id)}
    />
  );
}

export function TaskSidebar({
  tasks,
  taskOrder,
  existingCategories,
  open,
  onOpenChange,
  onTaskOrderChange,
  onUpdateTask,
  onDeleteTask,
}: TaskSidebarProps) {
  const t = useTranslations("matrixTodo");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = taskOrder.indexOf(active.id as string);
      const newIndex = taskOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      onTaskOrderChange(arrayMove(taskOrder, oldIndex, newIndex));
    },
    [taskOrder, onTaskOrderChange]
  );

  // taskOrder に基づいてタスクを並び替え
  const orderedTasks = taskOrder
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => t != null);

  if (!open) {
    return (
      <div className="shrink-0 border-r flex flex-col items-center py-2">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title={t("sidebar.title")}
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 border-r flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("sidebar.title")}
        </h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {orderedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("sidebar.empty")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={taskOrder}
              strategy={verticalListSortingStrategy}
            >
              {orderedTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  existingCategories={existingCategories}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
