/**
 * マトリックスToDo ビジネスロジック
 */

// タスク型定義
export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string | null; // ISO 8601 日付文字列
  gridX: number; // グリッド座標（動的サイズ）
  gridY: number; // グリッド座標（動的サイズ）
  createdAt: string;
}

// プリセット型
export type PresetType = "eisenhower" | "effectDifficulty" | "importanceUrgency" | "importanceDifficulty" | "custom";

// マトリックス設定型
export interface MatrixConfig {
  preset: PresetType;
  xAxisLabel: string;
  yAxisLabel: string;
  quadrantNames: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

// LocalStorage に保存するデータ構造
export interface MatrixData {
  tasks: Task[];
  config: MatrixConfig;
  taskOrder?: string[]; // タスクIDの表示順（省略時はcreatedAt順）
}

const STORAGE_KEY = "necobox-matrix-todo";

// セルの固定サイズ（px）
export const CELL_SIZE_PX = 16;
// タスクカードの横幅（セル数）
export const CARD_WIDTH_CELLS = 10;

/**
 * カテゴリ名からHSL色を生成
 * 同じカテゴリ名には常に同じ色を返す
 */
export function getCategoryColor(category: string): string {
  if (!category) return "hsl(0, 0%, 60%)";
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // 32bit整数に変換
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

/**
 * 期限の相対表示を返す
 */
export function getDeadlineDisplay(
  deadline: string | null,
  translations: {
    noDeadline: string;
    overdue: string;
    today: string;
    tomorrow: string;
    daysLater: (days: number) => string;
  }
): string {
  if (!deadline) return translations.noDeadline;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return translations.overdue;
  if (diffDays === 0) return translations.today;
  if (diffDays === 1) return translations.tomorrow;
  return translations.daysLater(diffDays);
}

/**
 * 期限バッジの色クラスを返す
 */
export function getDeadlineBadgeClass(deadline: string | null): string {
  if (!deadline) return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
  if (diffDays <= 1) return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
  if (diffDays <= 3) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
}

/**
 * 一意なIDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * LocalStorage からデータを読み込む
 */
export function loadMatrixData(): MatrixData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MatrixData;
  } catch {
    return null;
  }
}

/**
 * LocalStorage にデータを保存
 */
export function saveMatrixData(data: MatrixData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ストレージ容量超過の場合は無視
  }
}

/**
 * プリセットのデフォルト設定を返す
 */
export function getPresetConfig(
  preset: PresetType,
  translations: {
    eisenhower: { xAxis: string; yAxis: string; topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
    effectDifficulty: { xAxis: string; yAxis: string; topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
    importanceUrgency: { xAxis: string; yAxis: string; topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
    importanceDifficulty: { xAxis: string; yAxis: string; topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
    axis: { xAxis: string; yAxis: string };
    quadrant: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
  }
): MatrixConfig {
  switch (preset) {
    case "eisenhower":
      return {
        preset,
        xAxisLabel: translations.eisenhower.xAxis,
        yAxisLabel: translations.eisenhower.yAxis,
        quadrantNames: {
          topLeft: translations.eisenhower.topLeft,
          topRight: translations.eisenhower.topRight,
          bottomLeft: translations.eisenhower.bottomLeft,
          bottomRight: translations.eisenhower.bottomRight,
        },
      };
    case "effectDifficulty":
      return {
        preset,
        xAxisLabel: translations.effectDifficulty.xAxis,
        yAxisLabel: translations.effectDifficulty.yAxis,
        quadrantNames: {
          topLeft: translations.effectDifficulty.topLeft,
          topRight: translations.effectDifficulty.topRight,
          bottomLeft: translations.effectDifficulty.bottomLeft,
          bottomRight: translations.effectDifficulty.bottomRight,
        },
      };
    case "importanceUrgency":
      return {
        preset,
        xAxisLabel: translations.importanceUrgency.xAxis,
        yAxisLabel: translations.importanceUrgency.yAxis,
        quadrantNames: {
          topLeft: translations.importanceUrgency.topLeft,
          topRight: translations.importanceUrgency.topRight,
          bottomLeft: translations.importanceUrgency.bottomLeft,
          bottomRight: translations.importanceUrgency.bottomRight,
        },
      };
    case "importanceDifficulty":
      return {
        preset,
        xAxisLabel: translations.importanceDifficulty.xAxis,
        yAxisLabel: translations.importanceDifficulty.yAxis,
        quadrantNames: {
          topLeft: translations.importanceDifficulty.topLeft,
          topRight: translations.importanceDifficulty.topRight,
          bottomLeft: translations.importanceDifficulty.bottomLeft,
          bottomRight: translations.importanceDifficulty.bottomRight,
        },
      };
    case "custom":
    default:
      return {
        preset: "custom",
        xAxisLabel: translations.axis.xAxis,
        yAxisLabel: translations.axis.yAxis,
        quadrantNames: {
          topLeft: translations.quadrant.topLeft,
          topRight: translations.quadrant.topRight,
          bottomLeft: translations.quadrant.bottomLeft,
          bottomRight: translations.quadrant.bottomRight,
        },
      };
  }
}
