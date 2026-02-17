"use client";

import { Plus, StickyNote, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  StoryMappingActivity,
  StoryMappingRelease,
  StoryPoint,
} from "@/lib/utils/domain-modeling";
import { STORY_MAPPING_COLORS } from "@/lib/utils/domain-modeling";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoryMappingTaskColumn } from "./StoryMappingTaskColumn";

interface StoryMappingActivityColumnProps {
  activity: StoryMappingActivity;
  releases: StoryMappingRelease[];
  taskColumnWidths?: Record<string, number>;
  onEditActivity: (domRect: DOMRect) => void;
  onDeleteActivity: () => void;
  onAddTask: () => void;
  onEditTask: (taskId: string, domRect: DOMRect) => void;
  onDeleteTask: (taskId: string) => void;
  onAddStory: (taskId: string, releaseId: string) => void;
  onEditStory: (taskId: string, storyId: string, domRect: DOMRect) => void;
  onDeleteStory: (taskId: string, storyId: string) => void;
  onEditRelease: (releaseId: string, domRect: DOMRect) => void;
  onDeleteRelease: (releaseId: string) => void;
  onDragStartStory: (taskId: string, storyId: string) => void;
  onDragOverStory: (e: React.DragEvent, storyId: string, taskId: string) => void;
  onDropOnTask: (taskId: string) => void;
  onDragEnd: () => void;
  dragOverStoryId: string | null;
  dragOverTaskId: string | null;
  autoEditId: string | null;
  onEditActivityMemo?: (domRect: DOMRect) => void;
  onEditTaskMemo?: (taskId: string, domRect: DOMRect) => void;
  onEditStoryMemo?: (taskId: string, storyId: string, domRect: DOMRect) => void;
  onStoryPointChange?: (taskId: string, storyId: string, value: StoryPoint | undefined) => void;
  onTaskColumnResize?: (taskId: string, width: number, committed: boolean) => void;
}

/** アクティビティ列コンポーネント（紫ヘッダー + 子タスク列群） */
export function StoryMappingActivityColumn({
  activity,
  releases,
  taskColumnWidths,
  onEditActivity,
  onDeleteActivity,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAddStory,
  onEditStory,
  onDeleteStory,
  onEditRelease,
  onDeleteRelease,
  onDragStartStory,
  onDragOverStory,
  onDropOnTask,
  onDragEnd,
  dragOverStoryId,
  dragOverTaskId,
  autoEditId,
  onEditActivityMemo,
  onEditTaskMemo,
  onEditStoryMemo,
  onStoryPointChange,
  onTaskColumnResize,
}: StoryMappingActivityColumnProps) {
  const t = useTranslations("storyMapping");
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col shrink-0 pt-2">
      {/* アクティビティヘッダー */}
      <div
        className="relative rounded-t px-3 py-2 text-sm font-bold text-white cursor-pointer select-none"
        style={{ backgroundColor: STORY_MAPPING_COLORS.activity.header }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEditActivity(e.currentTarget.getBoundingClientRect());
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-activity-id={activity.id}
      >
        <span className="line-clamp-2">{activity.text || t("activityPlaceholder")}</span>
        {hovered && (
          <>
            <button
              type="button"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm z-10"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteActivity();
              }}
              aria-label={t("deleteActivity")}
            >
              <X className="w-2.5 h-2.5" />
            </button>
            {/* メモアイコン */}
            {onEditActivityMemo && (
              activity.memo ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/90 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditActivityMemo(e.currentTarget.getBoundingClientRect());
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <StickyNote className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-xs whitespace-pre-wrap">
                    {activity.memo}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/40 hover:text-white/90 hover:bg-white/20 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditActivityMemo(e.currentTarget.getBoundingClientRect());
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  <StickyNote className="w-3 h-3" />
                </button>
              )
            )}
          </>
        )}
        {/* メモあり時は常時表示（hover外でも） */}
        {!hovered && activity.memo && onEditActivityMemo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/70 hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditActivityMemo(e.currentTarget.getBoundingClientRect());
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <StickyNote className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-xs whitespace-pre-wrap">
              {activity.memo}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* タスク列群 */}
      <div
        className="flex flex-row gap-2 rounded-b border border-t-0 p-2"
        style={{
          borderColor: `${STORY_MAPPING_COLORS.activity.header}30`,
          backgroundColor: `${STORY_MAPPING_COLORS.activity.bg}40`,
        }}
      >
        {activity.tasks.map((task) => (
          <StoryMappingTaskColumn
            key={task.id}
            task={task}
            releases={releases}
            width={taskColumnWidths?.[task.id]}
            onEditTask={(rect) => onEditTask(task.id, rect)}
            onDeleteTask={() => onDeleteTask(task.id)}
            onAddStory={(releaseId) => onAddStory(task.id, releaseId)}
            onEditStory={(storyId, rect) => onEditStory(task.id, storyId, rect)}
            onDeleteStory={(storyId) => onDeleteStory(task.id, storyId)}
            onEditRelease={onEditRelease}
            onDeleteRelease={onDeleteRelease}
            onDragStartStory={(storyId) => onDragStartStory(task.id, storyId)}
            onDragOverStory={(e, storyId) => onDragOverStory(e, storyId, task.id)}
            onDropOnTask={() => onDropOnTask(task.id)}
            onDragEnd={onDragEnd}
            dragOverStoryId={dragOverTaskId === task.id ? dragOverStoryId : null}
            autoEditId={autoEditId}
            onEditTaskMemo={onEditTaskMemo ? (rect) => onEditTaskMemo(task.id, rect) : undefined}
            onEditStoryMemo={onEditStoryMemo ? (storyId, rect) => onEditStoryMemo(task.id, storyId, rect) : undefined}
            onStoryPointChange={onStoryPointChange ? (storyId, v) => onStoryPointChange(task.id, storyId, v) : undefined}
            onWidthChange={onTaskColumnResize ? (w, committed) => onTaskColumnResize(task.id, w, committed) : undefined}
          />
        ))}

        {/* タスク追加ボタン */}
        <button
          type="button"
          className="min-w-[48px] h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors shrink-0 self-start"
          style={{ borderColor: `${STORY_MAPPING_COLORS.task.header}40` }}
          onClick={onAddTask}
          aria-label={t("addTask")}
        >
          <Plus className="w-5 h-5" style={{ color: STORY_MAPPING_COLORS.task.header }} />
        </button>
      </div>
    </div>
  );
}
