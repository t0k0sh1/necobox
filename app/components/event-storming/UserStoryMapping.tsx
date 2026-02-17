"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, HelpCircle, Plus } from "lucide-react";

import type { StoryMappingBoard } from "@/lib/utils/event-storming";
import {
  STORY_MAPPING_COLORS,
  createStoryMappingActivity,
  createStoryMappingTask,
  createStoryMappingNote,
  createStoryMappingRelease,
} from "@/lib/utils/event-storming";
import { StoryMappingActivityColumn } from "./StoryMappingActivityColumn";
import { NoteEditor } from "./NoteEditor";

interface UserStoryMappingProps {
  board: StoryMappingBoard;
  onBoardChange: (board: StoryMappingBoard) => void;
}

/** 編集対象の種別 */
type EditTarget =
  | { type: "activity"; activityId: string }
  | { type: "task"; activityId: string; taskId: string }
  | { type: "story"; activityId: string; taskId: string; storyId: string }
  | { type: "release"; releaseId: string };

interface EditingState {
  target: EditTarget;
  text: string;
  position: { x: number; y: number; width: number; height: number };
}

/** ドラッグ元の情報 */
interface StoryDragState {
  storyId: string;
  sourceActivityId: string;
  sourceTaskId: string;
}

/** ユーザーストーリーマッピングメインコンポーネント */
export function UserStoryMapping({ board, onBoardChange }: UserStoryMappingProps) {
  const t = useTranslations("storyMapping");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [autoEditId, setAutoEditId] = useState<string | null>(null);
  const [dragOverStoryId, setDragOverStoryId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const dragRef = useRef<StoryDragState | null>(null);

  // --- アクティビティ ---
  const handleAddActivity = useCallback(() => {
    const activity = createStoryMappingActivity();
    onBoardChange({ ...board, activities: [...board.activities, activity] });
    setAutoEditId(activity.id);
  }, [board, onBoardChange]);

  const handleEditActivity = useCallback(
    (activityId: string, domRect: DOMRect) => {
      const activity = board.activities.find((a) => a.id === activityId);
      if (!activity) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "activity", activityId },
        text: activity.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.activities]
  );

  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      onBoardChange({
        ...board,
        activities: board.activities.filter((a) => a.id !== activityId),
      });
    },
    [board, onBoardChange]
  );

  // --- タスク ---
  const handleAddTask = useCallback(
    (activityId: string) => {
      const task = createStoryMappingTask();
      const activities = board.activities.map((a) =>
        a.id === activityId ? { ...a, tasks: [...a.tasks, task] } : a
      );
      onBoardChange({ ...board, activities });
      setAutoEditId(task.id);
    },
    [board, onBoardChange]
  );

  const handleEditTask = useCallback(
    (activityId: string, taskId: string, domRect: DOMRect) => {
      const activity = board.activities.find((a) => a.id === activityId);
      const task = activity?.tasks.find((t) => t.id === taskId);
      if (!task) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "task", activityId, taskId },
        text: task.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.activities]
  );

  const handleDeleteTask = useCallback(
    (activityId: string, taskId: string) => {
      const activities = board.activities.map((a) =>
        a.id === activityId
          ? { ...a, tasks: a.tasks.filter((t) => t.id !== taskId) }
          : a
      );
      onBoardChange({ ...board, activities });
    },
    [board, onBoardChange]
  );

  // --- ストーリー ---
  const handleAddStory = useCallback(
    (activityId: string, taskId: string, releaseId: string) => {
      const note = createStoryMappingNote("", releaseId);
      const activities = board.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              tasks: a.tasks.map((t) =>
                t.id === taskId ? { ...t, stories: [...t.stories, note] } : t
              ),
            }
          : a
      );
      onBoardChange({ ...board, activities });
      setAutoEditId(note.id);
    },
    [board, onBoardChange]
  );

  const handleEditStory = useCallback(
    (activityId: string, taskId: string, storyId: string, domRect: DOMRect) => {
      const activity = board.activities.find((a) => a.id === activityId);
      const task = activity?.tasks.find((t) => t.id === taskId);
      const story = task?.stories.find((s) => s.id === storyId);
      if (!story) return;
      setAutoEditId(null);
      setEditing({
        target: { type: "story", activityId, taskId, storyId },
        text: story.text,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.activities]
  );

  const handleDeleteStory = useCallback(
    (activityId: string, taskId: string, storyId: string) => {
      const activities = board.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              tasks: a.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, stories: t.stories.filter((s) => s.id !== storyId) }
                  : t
              ),
            }
          : a
      );
      onBoardChange({ ...board, activities });
    },
    [board, onBoardChange]
  );

  // --- リリース ---
  const handleAddRelease = useCallback(() => {
    const name = `Release ${board.releases.length + 1}`;
    const release = createStoryMappingRelease(name);
    onBoardChange({ ...board, releases: [...board.releases, release] });
  }, [board, onBoardChange]);

  const handleEditRelease = useCallback(
    (releaseId: string, domRect: DOMRect) => {
      const release = board.releases.find((r) => r.id === releaseId);
      if (!release) return;
      setEditing({
        target: { type: "release", releaseId },
        text: release.name,
        position: { x: domRect.left, y: domRect.top, width: domRect.width, height: domRect.height },
      });
    },
    [board.releases]
  );

  const handleDeleteRelease = useCallback(
    (releaseId: string) => {
      // リリースに所属するストーリーのreleaseIdをクリア
      const activities = board.activities.map((a) => ({
        ...a,
        tasks: a.tasks.map((t) => ({
          ...t,
          stories: t.stories.map((s) =>
            s.releaseId === releaseId ? { ...s, releaseId: "" } : s
          ),
        })),
      }));
      onBoardChange({
        ...board,
        activities,
        releases: board.releases.filter((r) => r.id !== releaseId),
      });
    },
    [board, onBoardChange]
  );

  // --- 編集コミット ---
  const handleEditCommit = useCallback(
    (text: string) => {
      if (!editing) return;
      const { target } = editing;

      if (target.type === "activity") {
        const activities = board.activities.map((a) =>
          a.id === target.activityId ? { ...a, text } : a
        );
        onBoardChange({ ...board, activities });
      } else if (target.type === "task") {
        const activities = board.activities.map((a) =>
          a.id === target.activityId
            ? {
                ...a,
                tasks: a.tasks.map((t) =>
                  t.id === target.taskId ? { ...t, text } : t
                ),
              }
            : a
        );
        onBoardChange({ ...board, activities });
      } else if (target.type === "story") {
        const activities = board.activities.map((a) =>
          a.id === target.activityId
            ? {
                ...a,
                tasks: a.tasks.map((t) =>
                  t.id === target.taskId
                    ? {
                        ...t,
                        stories: t.stories.map((s) =>
                          s.id === target.storyId ? { ...s, text } : s
                        ),
                      }
                    : t
                ),
              }
            : a
        );
        onBoardChange({ ...board, activities });
      } else if (target.type === "release") {
        const releases = board.releases.map((r) =>
          r.id === target.releaseId ? { ...r, name: text } : r
        );
        onBoardChange({ ...board, releases });
      }

      setEditing(null);
    },
    [editing, board, onBoardChange]
  );

  const handleEditCancel = useCallback(() => {
    setEditing(null);
  }, []);

  // --- ストーリーのドラッグ&ドロップ ---
  const handleDragStartStory = useCallback(
    (activityId: string, taskId: string, storyId: string) => {
      dragRef.current = { storyId, sourceActivityId: activityId, sourceTaskId: taskId };
    },
    []
  );

  const handleDragOverStory = useCallback(
    (_e: React.DragEvent, storyId: string, taskId: string) => {
      setDragOverStoryId(storyId);
      setDragOverTaskId(taskId);
    },
    []
  );

  const handleDropOnTask = useCallback(
    (targetActivityId: string, targetTaskId: string) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { storyId, sourceActivityId, sourceTaskId } = drag;

      // ソースからストーリーを見つける
      let sourceNote: typeof board.activities[0]["tasks"][0]["stories"][0] | undefined;
      for (const a of board.activities) {
        if (a.id === sourceActivityId) {
          for (const t of a.tasks) {
            if (t.id === sourceTaskId) {
              sourceNote = t.stories.find((s) => s.id === storyId);
              break;
            }
          }
          break;
        }
      }
      if (!sourceNote) return;

      let newActivities = [...board.activities];

      if (sourceActivityId === targetActivityId && sourceTaskId === targetTaskId) {
        // 同一タスク内の並び替え
        if (dragOverStoryId && dragOverStoryId !== storyId) {
          newActivities = newActivities.map((a) => {
            if (a.id !== sourceActivityId) return a;
            return {
              ...a,
              tasks: a.tasks.map((t) => {
                if (t.id !== sourceTaskId) return t;
                const list = [...t.stories];
                const fromIdx = list.findIndex((s) => s.id === storyId);
                const toIdx = list.findIndex((s) => s.id === dragOverStoryId);
                if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                  list.splice(fromIdx, 1);
                  list.splice(toIdx, 0, sourceNote!);
                }
                return { ...t, stories: list };
              }),
            };
          });
        }
      } else {
        // 別のタスクへ移動
        newActivities = newActivities.map((a) => ({
          ...a,
          tasks: a.tasks.map((t) => {
            if (t.id === sourceTaskId && a.id === sourceActivityId) {
              return { ...t, stories: t.stories.filter((s) => s.id !== storyId) };
            }
            if (t.id === targetTaskId && a.id === targetActivityId) {
              const targetList = [...t.stories];
              if (dragOverStoryId) {
                const toIdx = targetList.findIndex((s) => s.id === dragOverStoryId);
                if (toIdx !== -1) {
                  targetList.splice(toIdx, 0, sourceNote!);
                } else {
                  targetList.push(sourceNote!);
                }
              } else {
                targetList.push(sourceNote!);
              }
              return { ...t, stories: targetList };
            }
            return t;
          }),
        }));
      }

      onBoardChange({ ...board, activities: newActivities });
      dragRef.current = null;
      setDragOverStoryId(null);
      setDragOverTaskId(null);
    },
    [board, onBoardChange, dragOverStoryId]
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDragOverStoryId(null);
    setDragOverTaskId(null);
  }, []);

  // ウィンドウ外でドラッグがキャンセルされた場合のクリーンアップ
  useEffect(() => {
    const cleanup = () => {
      dragRef.current = null;
      setDragOverStoryId(null);
      setDragOverTaskId(null);
    };
    window.addEventListener("dragend", cleanup);
    return () => window.removeEventListener("dragend", cleanup);
  }, []);

  // autoEdit対応（追加直後にエディタを開く）
  useEffect(() => {
    if (!autoEditId) return;

    // アクティビティかタスクのautoEdit
    const activity = board.activities.find((a) => a.id === autoEditId);
    if (activity) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-activity-id="${autoEditId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          setAutoEditId(null);
          setEditing({
            target: { type: "activity", activityId: autoEditId },
            text: activity.text,
            position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          });
        }
      });
      return;
    }

    for (const a of board.activities) {
      const task = a.tasks.find((t) => t.id === autoEditId);
      if (task) {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-task-id="${autoEditId}"]`);
          if (el) {
            const rect = el.getBoundingClientRect();
            setAutoEditId(null);
            setEditing({
              target: { type: "task", activityId: a.id, taskId: autoEditId },
              text: task.text,
              position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            });
          }
        });
        return;
      }
    }

    // ストーリーのautoEditはBmcStickyNoteのautoEditプロパティで処理
  }, [autoEditId, board.activities]);

  const isEmpty = board.activities.length === 0;
  const [guideOpen, setGuideOpen] = useState(false);

  const GUIDE_AREAS = [
    {
      color: STORY_MAPPING_COLORS.activity.header,
      titleKey: "guide.activityTitle" as const,
      descKey: "guide.activityDesc" as const,
    },
    {
      color: STORY_MAPPING_COLORS.task.header,
      titleKey: "guide.taskTitle" as const,
      descKey: "guide.taskDesc" as const,
    },
    {
      color: STORY_MAPPING_COLORS.story.bg,
      titleKey: "guide.storyTitle" as const,
      descKey: "guide.storyDesc" as const,
      textColor: STORY_MAPPING_COLORS.story.text,
    },
    {
      color: STORY_MAPPING_COLORS.release.border,
      titleKey: "guide.releaseTitle" as const,
      descKey: "guide.releaseDesc" as const,
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-auto">
      {/* ツールバー */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: STORY_MAPPING_COLORS.activity.header }}
          onClick={handleAddActivity}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("addActivity")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: STORY_MAPPING_COLORS.release.border }}
          onClick={handleAddRelease}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("addRelease")}
        </button>

        {/* ガイド開閉ボタン */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ml-auto"
          onClick={() => setGuideOpen(!guideOpen)}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {t("guide.toggle")}
          {guideOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* 使い方ガイド（インライン折りたたみ） */}
      {guideOpen && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm shrink-0">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
            {t("guide.overviewText")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GUIDE_AREAS.map(({ color, titleKey, descKey, textColor }) => (
              <div key={titleKey} className="flex gap-2.5">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 mt-0.5"
                  style={{
                    backgroundColor: color,
                    border: textColor ? "1px solid rgba(0,0,0,0.15)" : undefined,
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {t(titleKey)}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                    {t(descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状態 */}
      {isEmpty && !guideOpen && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground space-y-2">
            <p className="text-lg font-semibold">{t("emptyHint.title")}</p>
            <p className="text-sm">{t("emptyHint.description")}</p>
          </div>
        </div>
      )}

      {/* アクティビティ列群（水平スクロール） */}
      {!isEmpty && (
        <div className="flex flex-row gap-3 overflow-x-auto pb-2 flex-1 min-h-0">
          {board.activities.map((activity) => (
            <StoryMappingActivityColumn
              key={activity.id}
              activity={activity}
              releases={board.releases}
              onEditActivity={(rect) => handleEditActivity(activity.id, rect)}
              onDeleteActivity={() => handleDeleteActivity(activity.id)}
              onAddTask={() => handleAddTask(activity.id)}
              onEditTask={(taskId, rect) => handleEditTask(activity.id, taskId, rect)}
              onDeleteTask={(taskId) => handleDeleteTask(activity.id, taskId)}
              onAddStory={(taskId, releaseId) => handleAddStory(activity.id, taskId, releaseId)}
              onEditStory={(taskId, storyId, rect) => handleEditStory(activity.id, taskId, storyId, rect)}
              onDeleteStory={(taskId, storyId) => handleDeleteStory(activity.id, taskId, storyId)}
              onEditRelease={handleEditRelease}
              onDeleteRelease={handleDeleteRelease}
              onDragStartStory={(taskId, storyId) => handleDragStartStory(activity.id, taskId, storyId)}
              onDragOverStory={(e, storyId, taskId) => handleDragOverStory(e, storyId, taskId)}
              onDropOnTask={(taskId) => handleDropOnTask(activity.id, taskId)}
              onDragEnd={handleDragEnd}
              dragOverStoryId={dragOverStoryId}
              dragOverTaskId={dragOverTaskId}
              autoEditId={autoEditId}
            />
          ))}
        </div>
      )}

      {/* ノートエディタ */}
      {editing && (
        <NoteEditor
          initialText={editing.text}
          position={editing.position}
          onCommit={handleEditCommit}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
