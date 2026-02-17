"use client";

import { Plus, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type {
  StoryMappingTask,
  StoryMappingRelease,
  StoryMappingNote,
  StoryPoint,
} from "@/lib/utils/domain-modeling";
import {
  STORY_MAPPING_COLORS,
  DEFAULT_TASK_COLUMN_WIDTH,
  MIN_TASK_COLUMN_WIDTH,
  MAX_TASK_COLUMN_WIDTH,
} from "@/lib/utils/domain-modeling";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoryMappingStickyNote } from "./StoryMappingStickyNote";
import { StoryMappingReleaseLine } from "./StoryMappingReleaseLine";

interface StoryMappingTaskColumnProps {
  task: StoryMappingTask;
  releases: StoryMappingRelease[];
  width?: number;
  onEditTask: (domRect: DOMRect) => void;
  onDeleteTask: () => void;
  onAddStory: (releaseId: string) => void;
  onEditStory: (storyId: string, domRect: DOMRect) => void;
  onDeleteStory: (storyId: string) => void;
  onEditRelease: (releaseId: string, domRect: DOMRect) => void;
  onDeleteRelease: (releaseId: string) => void;
  onDragStartStory: (storyId: string) => void;
  onDragOverStory: (e: React.DragEvent, storyId: string) => void;
  onDropOnTask: () => void;
  onDragEnd: () => void;
  dragOverStoryId: string | null;
  autoEditId: string | null;
  onEditTaskMemo?: (domRect: DOMRect) => void;
  onEditStoryMemo?: (storyId: string, domRect: DOMRect) => void;
  onStoryPointChange?: (storyId: string, value: StoryPoint | undefined) => void;
  onWidthChange?: (width: number, committed: boolean) => void;
}

/** タスク列コンポーネント（青ヘッダー + リリース別ストーリー） */
export function StoryMappingTaskColumn({
  task,
  releases,
  width,
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
  autoEditId,
  onEditTaskMemo,
  onEditStoryMemo,
  onStoryPointChange,
  onWidthChange,
}: StoryMappingTaskColumnProps) {
  const t = useTranslations("storyMapping");
  const [hovered, setHovered] = useState(false);
  const [resizeHover, setResizeHover] = useState(false);
  const resizingRef = useRef(false);

  const colWidth = width ?? DEFAULT_TASK_COLUMN_WIDTH;

  /** リリースIDでストーリーをグループ化 */
  const getStoriesForRelease = (releaseId: string): StoryMappingNote[] => {
    return task.stories.filter((s) => s.releaseId === releaseId);
  };

  /** 未割り当てストーリー */
  const unassignedStories = task.stories.filter((s) => !s.releaseId);

  /** リサイズ開始 */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onWidthChange) return;

      resizingRef.current = true;
      const startX = e.clientX;
      const startWidth = colWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(
          MIN_TASK_COLUMN_WIDTH,
          Math.min(MAX_TASK_COLUMN_WIDTH, startWidth + delta)
        );
        onWidthChange(newWidth, false);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        resizingRef.current = false;
        setResizeHover(false);

        const delta = ev.clientX - startX;
        const newWidth = Math.max(
          MIN_TASK_COLUMN_WIDTH,
          Math.min(MAX_TASK_COLUMN_WIDTH, startWidth + delta)
        );
        onWidthChange(newWidth, true);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [colWidth, onWidthChange]
  );

  /** ストーリーカードを描画するヘルパー */
  const renderStory = (story: StoryMappingNote) => (
    <StoryMappingStickyNote
      key={story.id}
      noteId={story.id}
      text={story.text}
      bgColor={STORY_MAPPING_COLORS.story.bg}
      memo={story.memo}
      storyPoints={story.storyPoints}
      onDoubleClick={(rect) => onEditStory(story.id, rect)}
      onDelete={() => onDeleteStory(story.id)}
      onDragStart={(nid) => onDragStartStory(nid)}
      onDragOver={(e, nid) => onDragOverStory(e, nid)}
      onDragEnd={onDragEnd}
      isDragOver={dragOverStoryId === story.id}
      autoEdit={autoEditId === story.id}
      onEditMemo={(rect) => onEditStoryMemo?.(story.id, rect)}
      onStoryPointChange={(v) => onStoryPointChange?.(story.id, v)}
    />
  );

  return (
    <div
      className="relative flex flex-col shrink-0"
      style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnTask();
      }}
    >
      {/* タスクヘッダー */}
      <div
        className="relative rounded-t px-2 py-1.5 text-xs font-semibold text-white cursor-pointer select-none group/task-header"
        style={{ backgroundColor: STORY_MAPPING_COLORS.task.header }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEditTask(e.currentTarget.getBoundingClientRect());
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-task-id={task.id}
      >
        <span className="line-clamp-2">{task.text || t("taskPlaceholder")}</span>
        {hovered && (
          <>
            <button
              type="button"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm z-10"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask();
              }}
              aria-label={t("deleteTask")}
            >
              <X className="w-2.5 h-2.5" />
            </button>
            {/* メモアイコン */}
            {onEditTaskMemo && (
              task.memo ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/90 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTaskMemo(e.currentTarget.getBoundingClientRect());
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <StickyNote className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-xs whitespace-pre-wrap">
                    {task.memo}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/40 hover:text-white/90 hover:bg-white/20 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTaskMemo(e.currentTarget.getBoundingClientRect());
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
        {!hovered && task.memo && onEditTaskMemo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white/70 hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTaskMemo(e.currentTarget.getBoundingClientRect());
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <StickyNote className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-xs whitespace-pre-wrap">
              {task.memo}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ストーリーエリア */}
      <div
        className="flex-1 rounded-b border border-t-0 p-1.5 space-y-1"
        style={{ borderColor: `${STORY_MAPPING_COLORS.task.header}30`, backgroundColor: `${STORY_MAPPING_COLORS.task.bg}40` }}
      >
        {/* リリースがない場合：全ストーリーを表示 */}
        {releases.length === 0 ? (
          <>
            {task.stories.map(renderStory)}
            <button
              type="button"
              className="w-full h-[28px] rounded border-2 border-dashed flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-colors"
              style={{ borderColor: `${STORY_MAPPING_COLORS.story.text}30` }}
              onClick={() => onAddStory("")}
            >
              <Plus className="w-3 h-3" />
              {t("addStory")}
            </button>
          </>
        ) : (
          <>
            {/* 未割り当てストーリー */}
            {unassignedStories.map(renderStory)}
            <button
              type="button"
              className="w-full h-[28px] rounded border-2 border-dashed flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-colors"
              style={{ borderColor: `${STORY_MAPPING_COLORS.story.text}30` }}
              onClick={() => onAddStory("")}
            >
              <Plus className="w-3 h-3" />
              {t("addStory")}
            </button>

            {/* リリース別ストーリー */}
            {releases.map((release) => {
              const stories = getStoriesForRelease(release.id);
              return (
                <div key={release.id}>
                  <StoryMappingReleaseLine
                    name={release.name}
                    onDoubleClick={(rect) => onEditRelease(release.id, rect)}
                    onDelete={() => onDeleteRelease(release.id)}
                  />
                  {stories.map((story) => (
                    <div key={story.id} className="mb-1">
                      {renderStory(story)}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full h-[28px] rounded border-2 border-dashed flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-colors"
                    style={{ borderColor: `${STORY_MAPPING_COLORS.story.text}30` }}
                    onClick={() => onAddStory(release.id)}
                    aria-label={`${t("addStory")} (${release.name})`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* リサイズハンドル（右端） */}
      {onWidthChange && (
        <div
          className="absolute top-0 right-0 w-[6px] h-full cursor-col-resize z-20 transition-colors"
          style={{ backgroundColor: resizeHover ? "rgba(59,130,246,0.5)" : "transparent" }}
          onMouseEnter={() => setResizeHover(true)}
          onMouseLeave={() => { if (!resizingRef.current) setResizeHover(false); }}
          onMouseDown={handleResizeStart}
          aria-label={t("resize.handle")}
        />
      )}
    </div>
  );
}
