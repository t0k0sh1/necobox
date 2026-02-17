"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useState } from "react";
import type {
  StoryMappingTask,
  StoryMappingRelease,
  StoryMappingNote,
} from "@/lib/utils/event-storming";
import { STORY_MAPPING_COLORS } from "@/lib/utils/event-storming";
import { BmcStickyNote } from "./BmcStickyNote";
import { StoryMappingReleaseLine } from "./StoryMappingReleaseLine";

interface StoryMappingTaskColumnProps {
  task: StoryMappingTask;
  releases: StoryMappingRelease[];
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
}

/** タスク列コンポーネント（青ヘッダー + リリース別ストーリー） */
export function StoryMappingTaskColumn({
  task,
  releases,
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
}: StoryMappingTaskColumnProps) {
  const t = useTranslations("storyMapping");
  const [hovered, setHovered] = useState(false);

  /** リリースIDでストーリーをグループ化 */
  const getStoriesForRelease = (releaseId: string): StoryMappingNote[] => {
    return task.stories.filter((s) => s.releaseId === releaseId);
  };

  /** 未割り当てストーリー */
  const unassignedStories = task.stories.filter((s) => !s.releaseId);

  return (
    <div
      className="flex flex-col min-w-[160px] w-[160px] shrink-0"
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
        className="relative rounded-t px-2 py-1.5 text-xs font-semibold text-white cursor-pointer select-none"
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
            {task.stories.map((story) => (
              <BmcStickyNote
                key={story.id}
                noteId={story.id}
                text={story.text}
                bgColor={STORY_MAPPING_COLORS.story.bg}
                onDoubleClick={(rect) => onEditStory(story.id, rect)}
                onDelete={() => onDeleteStory(story.id)}
                onDragStart={(nid) => onDragStartStory(nid)}
                onDragOver={(e, nid) => onDragOverStory(e, nid)}
                onDragEnd={onDragEnd}
                isDragOver={dragOverStoryId === story.id}
                autoEdit={autoEditId === story.id}
              />
            ))}
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
            {unassignedStories.map((story) => (
              <BmcStickyNote
                key={story.id}
                noteId={story.id}
                text={story.text}
                bgColor={STORY_MAPPING_COLORS.story.bg}
                onDoubleClick={(rect) => onEditStory(story.id, rect)}
                onDelete={() => onDeleteStory(story.id)}
                onDragStart={(nid) => onDragStartStory(nid)}
                onDragOver={(e, nid) => onDragOverStory(e, nid)}
                onDragEnd={onDragEnd}
                isDragOver={dragOverStoryId === story.id}
                autoEdit={autoEditId === story.id}
              />
            ))}
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
                      <BmcStickyNote
                        noteId={story.id}
                        text={story.text}
                        bgColor={STORY_MAPPING_COLORS.story.bg}
                        onDoubleClick={(rect) => onEditStory(story.id, rect)}
                        onDelete={() => onDeleteStory(story.id)}
                        onDragStart={(nid) => onDragStartStory(nid)}
                        onDragOver={(e, nid) => onDragOverStory(e, nid)}
                        onDragEnd={onDragEnd}
                        isDragOver={dragOverStoryId === story.id}
                        autoEdit={autoEditId === story.id}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full h-[28px] rounded border-2 border-dashed flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-colors"
                    style={{ borderColor: `${STORY_MAPPING_COLORS.story.text}30` }}
                    onClick={() => onAddStory(release.id)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
