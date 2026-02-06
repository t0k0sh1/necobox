"use client";

import { MatrixGrid } from "@/app/components/MatrixGrid";
import { TaskSidebar } from "@/app/components/TaskSidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  MatrixConfig,
  MatrixData,
  PresetType,
  Task,
} from "@/lib/utils/matrix-todo";
import {
  getPresetConfig,
  loadMatrixData,
  saveMatrixData,
} from "@/lib/utils/matrix-todo";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export default function MatrixTodoPage() {
  const t = useTranslations("matrixTodo");

  const translations = {
    eisenhower: {
      xAxis: t("eisenhower.xAxis"),
      yAxis: t("eisenhower.yAxis"),
      topLeft: t("eisenhower.topLeft"),
      topRight: t("eisenhower.topRight"),
      bottomLeft: t("eisenhower.bottomLeft"),
      bottomRight: t("eisenhower.bottomRight"),
    },
    effectDifficulty: {
      xAxis: t("effectDifficulty.xAxis"),
      yAxis: t("effectDifficulty.yAxis"),
      topLeft: t("effectDifficulty.topLeft"),
      topRight: t("effectDifficulty.topRight"),
      bottomLeft: t("effectDifficulty.bottomLeft"),
      bottomRight: t("effectDifficulty.bottomRight"),
    },
    importanceUrgency: {
      xAxis: t("importanceUrgency.xAxis"),
      yAxis: t("importanceUrgency.yAxis"),
      topLeft: t("importanceUrgency.topLeft"),
      topRight: t("importanceUrgency.topRight"),
      bottomLeft: t("importanceUrgency.bottomLeft"),
      bottomRight: t("importanceUrgency.bottomRight"),
    },
    importanceDifficulty: {
      xAxis: t("importanceDifficulty.xAxis"),
      yAxis: t("importanceDifficulty.yAxis"),
      topLeft: t("importanceDifficulty.topLeft"),
      topRight: t("importanceDifficulty.topRight"),
      bottomLeft: t("importanceDifficulty.bottomLeft"),
      bottomRight: t("importanceDifficulty.bottomRight"),
    },
    axis: {
      xAxis: t("axis.xAxis"),
      yAxis: t("axis.yAxis"),
    },
    quadrant: {
      topLeft: t("quadrant.topLeft"),
      topRight: t("quadrant.topRight"),
      bottomLeft: t("quadrant.bottomLeft"),
      bottomRight: t("quadrant.bottomRight"),
    },
  };

  // 初期設定（アイゼンハワー・マトリックス）
  const defaultConfig = getPresetConfig("eisenhower", translations);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<MatrixConfig>(defaultConfig);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // LocalStorage からデータを読み込み
  useEffect(() => {
    const data = loadMatrixData();
    if (data) {
      setTasks(data.tasks);
      setConfig(data.config);
      // taskOrder があればそれを使い、なければ createdAt 順で生成
      if (data.taskOrder) {
        setTaskOrder(data.taskOrder);
      } else {
        const sorted = [...data.tasks].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setTaskOrder(sorted.map((t) => t.id));
      }
    }
    setLoaded(true);
  }, []);

  // データ変更時に LocalStorage へ保存
  useEffect(() => {
    if (!loaded) return;
    const data: MatrixData = { tasks, config, taskOrder };
    saveMatrixData(data);
  }, [tasks, config, taskOrder, loaded]);

  // プリセット切り替え
  const handlePresetChange = useCallback(
    (preset: string) => {
      const newConfig = getPresetConfig(preset as PresetType, translations);
      setConfig(newConfig);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  // タスク一覧の更新（グリッドからの更新）
  const handleTasksChange = useCallback((newTasks: Task[]) => {
    setTasks((prevTasks) => {
      // 新規追加されたタスクを検出して taskOrder に追加
      const prevIds = new Set(prevTasks.map((t) => t.id));
      const addedTasks = newTasks.filter((t) => !prevIds.has(t.id));
      if (addedTasks.length > 0) {
        setTaskOrder((prev) => [...prev, ...addedTasks.map((t) => t.id)]);
      }

      // 削除されたタスクを検出して taskOrder から除去
      const newIds = new Set(newTasks.map((t) => t.id));
      const removedIds = prevTasks.filter((t) => !newIds.has(t.id)).map((t) => t.id);
      if (removedIds.length > 0) {
        const removedSet = new Set(removedIds);
        setTaskOrder((prev) => prev.filter((id) => !removedSet.has(id)));
      }

      return newTasks;
    });
  }, []);

  // サイドバーからのタスク更新
  const handleUpdateTask = useCallback(
    (taskId: string, data: { title: string; description: string | null; category: string; deadline: string | null }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, title: data.title, description: data.description, category: data.category, deadline: data.deadline }
            : t
        )
      );
    },
    []
  );

  // サイドバーからのタスク削除
  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskOrder((prev) => prev.filter((id) => id !== taskId));
  }, []);

  // サイドバーの並び替え
  const handleTaskOrderChange = useCallback((newOrder: string[]) => {
    setTaskOrder(newOrder);
  }, []);

  // 軸ラベルの変更
  const handleAxisLabelChange = useCallback(
    (axis: "x" | "y", value: string) => {
      setConfig((prev) => ({
        ...prev,
        ...(axis === "x" ? { xAxisLabel: value } : { yAxisLabel: value }),
      }));
    },
    []
  );

  // 象限名の変更
  const handleQuadrantNameChange = useCallback(
    (
      key: "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
      value: string
    ) => {
      setConfig((prev) => ({
        ...prev,
        quadrantNames: { ...prev.quadrantNames, [key]: value },
      }));
    },
    []
  );

  // 全クリア
  const handleClearAll = useCallback(() => {
    setTasks([]);
    setTaskOrder([]);
  }, []);

  // 既存カテゴリ一覧
  const existingCategories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  if (!loaded) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)]">
      {/* ヘッダーバー */}
      <div className="flex items-center justify-between px-4 py-1 border-b shrink-0">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="flex items-center gap-2">
          {/* プリセット選択 */}
          <Select value={config.preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-[260px] h-8 text-sm">
              <SelectValue placeholder={t("preset.label")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eisenhower">
                {t("preset.eisenhower")}
              </SelectItem>
              <SelectItem value="effectDifficulty">
                {t("preset.effectDifficulty")}
              </SelectItem>
              <SelectItem value="importanceUrgency">
                {t("preset.importanceUrgency")}
              </SelectItem>
              <SelectItem value="importanceDifficulty">
                {t("preset.importanceDifficulty")}
              </SelectItem>
              <SelectItem value="custom">{t("preset.custom")}</SelectItem>
            </SelectContent>
          </Select>

          {/* 全クリアボタン */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={tasks.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t("clearAll")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearAllConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("clearAllDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleClearAll}
                >
                  {t("confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* サイドバー + マトリックスグリッド */}
      <div className="flex-1 flex overflow-hidden">
        <TaskSidebar
          tasks={tasks}
          taskOrder={taskOrder}
          existingCategories={existingCategories}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          onTaskOrderChange={handleTaskOrderChange}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
        <MatrixGrid
          tasks={tasks}
          config={config}
          onTasksChange={handleTasksChange}
          onQuadrantNameChange={handleQuadrantNameChange}
          onAxisLabelChange={handleAxisLabelChange}
        />
      </div>
    </div>
  );
}
