"use client";

import { TaskCard } from "@/app/components/TaskCard";
import { TaskFormPopover } from "@/app/components/TaskFormPopover";
import type { MatrixConfig, Task } from "@/lib/utils/matrix-todo";
import {
  CARD_WIDTH_CELLS,
  CELL_SIZE_PX,
  generateId,
} from "@/lib/utils/matrix-todo";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface MatrixGridProps {
  tasks: Task[];
  config: MatrixConfig;
  onTasksChange: (tasks: Task[]) => void;
  onQuadrantNameChange: (
    key: "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
    value: string
  ) => void;
  onAxisLabelChange: (axis: "x" | "y", value: string) => void;
}

export function MatrixGrid({
  tasks,
  config,
  onTasksChange,
  onQuadrantNameChange,
  onAxisLabelChange,
}: MatrixGridProps) {
  const t = useTranslations("matrixTodo");
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridCols, setGridCols] = useState(0);
  const [gridRows, setGridRows] = useState(0);
  const [newTaskPos, setNewTaskPos] = useState<{ gridX: number; gridY: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingQuadrant, setEditingQuadrant] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingAxis, setEditingAxis] = useState<"x" | "y" | null>(null);
  const [editingAxisValue, setEditingAxisValue] = useState("");
  // ポップオーバーが閉じたタイムスタンプ（直後のクリックで新規ポップオーバーが開くのを防ぐ）
  const popoverClosedAtRef = useRef(0);

  const cellSize = CELL_SIZE_PX;

  // コンテナサイズからグリッドのセル数を算出
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const availableWidth = width - 32; // 縦軸ラベル分
        const availableHeight = height - 32; // 横軸ラベル分

        // 偶数に揃える（中央分割のため）
        let cols = Math.floor(availableWidth / cellSize);
        let rows = Math.floor(availableHeight / cellSize);
        if (cols % 2 !== 0) cols -= 1;
        if (rows % 2 !== 0) rows -= 1;
        cols = Math.max(cols, 4);
        rows = Math.max(rows, 4);

        setGridCols(cols);
        setGridRows(rows);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [cellSize]);

  const halfCols = gridCols / 2;
  const halfRows = gridRows / 2;

  // ドラッグセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const taskId = active.id as string;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const deltaGridX = Math.round(delta.x / cellSize);
      const deltaGridY = Math.round(delta.y / cellSize);

      let newX = task.gridX + deltaGridX;
      let newY = task.gridY + deltaGridY;

      newX = Math.max(0, Math.min(gridCols - CARD_WIDTH_CELLS, newX));
      newY = Math.max(0, Math.min(gridRows - 2, newY));

      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, gridX: newX, gridY: newY } : t
      );
      onTasksChange(updatedTasks);
    },
    [tasks, cellSize, gridCols, gridRows, onTasksChange]
  );

  // ポップオーバー閉じのタイムスタンプを記録
  const markPopoverClosed = useCallback(() => {
    popoverClosedAtRef.current = Date.now();
  }, []);

  // TaskCard のポップオーバー開閉通知
  const handleCardPopoverOpenChange = useCallback((open: boolean) => {
    if (!open) {
      markPopoverClosed();
    }
  }, [markPopoverClosed]);

  // グリッドクリックで新規タスク追加
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // ポップオーバーが閉じた直後（300ms以内）のクリックはスキップ
      if (Date.now() - popoverClosedAtRef.current < 300) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let gridX = Math.floor(x / cellSize);
      let gridY = Math.floor(y / cellSize);

      gridX = Math.max(0, Math.min(gridCols - CARD_WIDTH_CELLS, gridX));
      gridY = Math.max(0, Math.min(gridRows - 2, gridY));

      setNewTaskPos({ gridX, gridY });
      setPopoverOpen(true);
    },
    [cellSize, gridCols, gridRows]
  );

  // 新規タスク作成
  const handleNewTask = useCallback(
    (data: { title: string; description: string | null; category: string; deadline: string | null }) => {
      if (!newTaskPos) return;
      const newTask: Task = {
        id: generateId(),
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: data.deadline,
        gridX: newTaskPos.gridX,
        gridY: newTaskPos.gridY,
        createdAt: new Date().toISOString(),
      };
      onTasksChange([...tasks, newTask]);
      setNewTaskPos(null);
    },
    [newTaskPos, tasks, onTasksChange]
  );

  // タスク更新
  const handleUpdateTask = useCallback(
    (taskId: string, data: { title: string; description: string | null; category: string; deadline: string | null }) => {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? { ...t, title: data.title, description: data.description, category: data.category, deadline: data.deadline }
          : t
      );
      onTasksChange(updatedTasks);
    },
    [tasks, onTasksChange]
  );

  // タスク削除
  const handleDeleteTask = useCallback(
    (taskId: string) => {
      onTasksChange(tasks.filter((t) => t.id !== taskId));
    },
    [tasks, onTasksChange]
  );

  // 既存カテゴリ一覧
  const existingCategories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  const gridWidth = cellSize * gridCols;
  const gridHeight = cellSize * gridRows;

  // 範囲外のタスクをクランプして表示
  const clampedTasks = tasks.map((task) => ({
    ...task,
    gridX: Math.max(0, Math.min(gridCols - CARD_WIDTH_CELLS, task.gridX)),
    gridY: Math.max(0, Math.min(gridRows - 2, task.gridY)),
  }));

  // 象限名の編集
  const handleQuadrantDoubleClick = (
    key: "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
    currentValue: string
  ) => {
    setEditingQuadrant(key);
    setEditingValue(currentValue);
  };

  const handleQuadrantEditFinish = () => {
    if (editingQuadrant) {
      onQuadrantNameChange(
        editingQuadrant as "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
        editingValue
      );
      setEditingQuadrant(null);
      markPopoverClosed();
    }
  };

  // 軸ラベルの編集（カスタムプリセット時のみ）
  const isCustomPreset = config.preset === "custom";

  const handleAxisDoubleClick = (axis: "x" | "y", currentValue: string) => {
    if (!isCustomPreset) return;
    setEditingAxis(axis);
    setEditingAxisValue(currentValue);
  };

  const handleAxisEditFinish = () => {
    if (editingAxis) {
      onAxisLabelChange(editingAxis, editingAxisValue);
      setEditingAxis(null);
      markPopoverClosed();
    }
  };

  // 象限名のレンダリング
  const renderQuadrantName = (
    key: "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
    x: number,
    y: number,
    w: number
  ) => {
    const name = config.quadrantNames[key];
    const isEditing = editingQuadrant === key;

    return (
      <div
        key={key}
        className="absolute flex items-center justify-center pointer-events-auto"
        style={{
          left: x,
          top: y,
          width: w,
          height: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleQuadrantEditFinish}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuadrantEditFinish();
              if (e.key === "Escape") setEditingQuadrant(null);
            }}
            className="text-lg text-center bg-white dark:bg-gray-800 border rounded px-2 w-full max-w-[180px] outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        ) : (
          <span
            className="text-lg font-semibold text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors select-none"
            onDoubleClick={() => handleQuadrantDoubleClick(key, name)}
            title={t("clickToAdd")}
          >
            {name}
          </span>
        )}
      </div>
    );
  };

  const halfW = cellSize * halfCols;
  const halfH = cellSize * halfRows;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      {gridCols > 0 && gridRows > 0 && (
        <div className="absolute inset-0 flex justify-center items-center">
          {/* 縦軸ラベル */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 32, height: gridHeight }}
          >
            {editingAxis === "y" ? (
              <input
                type="text"
                value={editingAxisValue}
                onChange={(e) => setEditingAxisValue(e.target.value)}
                onBlur={handleAxisEditFinish}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAxisEditFinish();
                  if (e.key === "Escape") setEditingAxis(null);
                }}
                className="text-xl text-center bg-white dark:bg-gray-800 border rounded px-1 w-full outline-none focus:ring-1 focus:ring-primary"
                style={{ writingMode: "vertical-rl" }}
                autoFocus
              />
            ) : (
              <span
                className={`text-xl text-muted-foreground font-bold whitespace-nowrap ${isCustomPreset ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                style={{ writingMode: "vertical-rl" }}
                onDoubleClick={() => handleAxisDoubleClick("y", config.yAxisLabel)}
              >
                {config.yAxisLabel}
              </span>
            )}
          </div>

          {/* グリッド + 横軸ラベル */}
          <div className="flex flex-col">
            {/* グリッドエリア */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div
                className="relative bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                style={{
                  width: gridWidth,
                  height: gridHeight,
                  backgroundImage: `
                    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)
                  `,
                  backgroundSize: `${cellSize}px ${cellSize}px`,
                }}
                onClick={handleGridClick}
              >
                {/* 象限背景色 */}
                <div className="absolute bg-green-500/10 dark:bg-green-500/10" style={{ left: 0, top: 0, width: halfW, height: halfH }} />
                <div className="absolute bg-red-500/10 dark:bg-red-500/10" style={{ left: halfW, top: 0, width: halfW, height: halfH }} />
                <div className="absolute bg-gray-500/10 dark:bg-gray-500/10" style={{ left: 0, top: halfH, width: halfW, height: halfH }} />
                <div className="absolute bg-blue-500/10 dark:bg-blue-500/10" style={{ left: halfW, top: halfH, width: halfW, height: halfH }} />

                {/* 中央の十字線 */}
                <div
                  className="absolute bg-gray-400 dark:bg-gray-500"
                  style={{
                    left: halfW - 1,
                    top: 0,
                    width: 2,
                    height: gridHeight,
                  }}
                />
                <div
                  className="absolute bg-gray-400 dark:bg-gray-500"
                  style={{
                    left: 0,
                    top: halfH - 1,
                    width: gridWidth,
                    height: 2,
                  }}
                />

                {/* 象限名 */}
                {renderQuadrantName("topLeft", 0, 12, halfW)}
                {renderQuadrantName("topRight", halfW, 12, halfW)}
                {renderQuadrantName("bottomLeft", 0, halfH + 12, halfW)}
                {renderQuadrantName("bottomRight", halfW, halfH + 12, halfW)}

                {/* タスクカード群 */}
                {clampedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    cellSize={cellSize}
                    existingCategories={existingCategories}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onPopoverOpenChange={handleCardPopoverOpenChange}
                  />
                ))}

                {/* 新規タスク追加用の非表示トリガー */}
                {newTaskPos && (
                  <TaskFormPopover
                    task={null}
                    existingCategories={existingCategories}
                    trigger={
                      <div
                        style={{
                          position: "absolute",
                          left: newTaskPos.gridX * cellSize,
                          top: newTaskPos.gridY * cellSize,
                          width: 1,
                          height: 1,
                        }}
                      />
                    }
                    open={popoverOpen}
                    onOpenChange={(open) => {
                      setPopoverOpen(open);
                      if (!open) {
                        setNewTaskPos(null);
                        markPopoverClosed();
                      }
                    }}
                    onSave={handleNewTask}
                  />
                )}
              </div>
            </DndContext>

            {/* 横軸ラベル */}
            <div
              className="flex items-center justify-center"
              style={{ width: gridWidth }}
            >
              {editingAxis === "x" ? (
                <input
                  type="text"
                  value={editingAxisValue}
                  onChange={(e) => setEditingAxisValue(e.target.value)}
                  onBlur={handleAxisEditFinish}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAxisEditFinish();
                    if (e.key === "Escape") setEditingAxis(null);
                  }}
                  className="text-xl text-center bg-white dark:bg-gray-800 border rounded px-2 max-w-[200px] outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-xl text-muted-foreground font-bold ${isCustomPreset ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                  onDoubleClick={() => handleAxisDoubleClick("x", config.xAxisLabel)}
                >
                  {config.xAxisLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
