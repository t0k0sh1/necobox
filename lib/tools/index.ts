/**
 * ツール定義
 * ホームページやナビゲーションで使用するツール情報を一元管理
 */

// 使用可能なアイコン名（lucide-reactのアイコン名と一致）
export type IconName =
  | "Activity"
  | "ArrowRightLeft"
  | "BookOpen"
  | "Braces"
  | "Cake"
  | "Calendar"
  | "CheckSquare"
  | "Clock"
  | "Dices"
  | "Edit"
  | "Eye"
  | "FileSpreadsheet"
  | "FileText"
  | "GitCompare"
  | "Globe"
  | "Image"
  | "Key"
  | "Lock"
  | "Palette"
  | "Search"
  | "Shield"
  | "Sparkles"
  | "Type";

export interface ToolDefinition {
  id: string;
  path: string;
  icon: IconName;
  category: ToolCategory;
  i18nKey: string;
}

export type ToolCategory =
  | "generators"
  | "converters"
  | "editors"
  | "tasks"
  | "network"
  | "viewers"
  | "references";

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { icon: IconName; i18nKey: string }
> = {
  generators: { icon: "Sparkles", i18nKey: "sectionGenerators" },
  converters: { icon: "ArrowRightLeft", i18nKey: "sectionConverters" },
  editors: { icon: "Edit", i18nKey: "sectionEditors" },
  tasks: { icon: "CheckSquare", i18nKey: "sectionTasks" },
  network: { icon: "Shield", i18nKey: "sectionNetwork" },
  viewers: { icon: "Eye", i18nKey: "sectionViewers" },
  references: { icon: "BookOpen", i18nKey: "sectionReferences" },
};

export const TOOLS: ToolDefinition[] = [
  // Generators（ランダム生成）
  {
    id: "random",
    path: "/random",
    icon: "Lock",
    category: "generators",
    i18nKey: "passwordGenerator",
  },
  {
    id: "random-integer",
    path: "/random-integer",
    icon: "Dices",
    category: "generators",
    i18nKey: "randomIntegerGenerator",
  },
  {
    id: "dummy-text",
    path: "/dummy-text",
    icon: "Type",
    category: "generators",
    i18nKey: "dummyTextGenerator",
  },
  // Converters（変換・計算）
  {
    id: "color-converter",
    path: "/color-converter",
    icon: "Palette",
    category: "converters",
    i18nKey: "colorConverter",
  },
  {
    id: "time-zone-converter",
    path: "/time-zone-converter",
    icon: "Clock",
    category: "converters",
    i18nKey: "timeZoneConverter",
  },
  {
    id: "image-converter",
    path: "/image-converter",
    icon: "Image",
    category: "converters",
    i18nKey: "imageConverter",
  },
  {
    id: "wareki-converter",
    path: "/wareki-converter",
    icon: "Calendar",
    category: "converters",
    i18nKey: "warekiConverter",
  },
  {
    id: "age-calculator",
    path: "/age-calculator",
    icon: "Cake",
    category: "converters",
    i18nKey: "ageCalculator",
  },
  // Editors（データエディタ）
  {
    id: "regex-tester",
    path: "/regex-tester",
    icon: "Search",
    category: "editors",
    i18nKey: "regexTester",
  },
  {
    id: "csv-editor",
    path: "/csv-editor",
    icon: "FileSpreadsheet",
    category: "editors",
    i18nKey: "csvEditor",
  },
  {
    id: "json-editor",
    path: "/json-editor",
    icon: "Braces",
    category: "editors",
    i18nKey: "jsonEditor",
  },
  // Tasks（タスク管理）
  {
    id: "matrix-todo",
    path: "/matrix-todo",
    icon: "CheckSquare",
    category: "tasks",
    i18nKey: "matrixTodo",
  },
  // Network（ネットワーク・セキュリティ）
  {
    id: "show-gip",
    path: "/show-gip",
    icon: "Globe",
    category: "network",
    i18nKey: "showGlobalIP",
  },
  {
    id: "ip-info",
    path: "/ip-info",
    icon: "Search",
    category: "network",
    i18nKey: "ipInfo",
  },
  {
    id: "jwt-decoder",
    path: "/jwt-decoder",
    icon: "Key",
    category: "network",
    i18nKey: "jwtDecoder",
  },
  // Viewers（ビューア）
  {
    id: "diff-viewer",
    path: "/diff-viewer",
    icon: "GitCompare",
    category: "viewers",
    i18nKey: "diffViewer",
  },
  {
    id: "text-viewer",
    path: "/text-viewer",
    icon: "FileText",
    category: "viewers",
    i18nKey: "textViewer",
  },
  // References（リファレンス）
  {
    id: "cheatsheets",
    path: "/cheatsheets",
    icon: "BookOpen",
    category: "references",
    i18nKey: "cheatsheets",
  },
  {
    id: "service-status",
    path: "/service-status",
    icon: "Activity",
    category: "references",
    i18nKey: "serviceStatus",
  },
];

/**
 * カテゴリごとにツールをグループ化
 */
export function getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
  const result: Record<ToolCategory, ToolDefinition[]> = {
    generators: [],
    converters: [],
    editors: [],
    tasks: [],
    network: [],
    viewers: [],
    references: [],
  };

  for (const tool of TOOLS) {
    result[tool.category].push(tool);
  }

  return result;
}

/**
 * カテゴリの表示順序
 */
export const CATEGORY_ORDER: ToolCategory[] = [
  "generators",
  "converters",
  "editors",
  "tasks",
  "network",
  "viewers",
  "references",
];
