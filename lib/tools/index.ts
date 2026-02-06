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
  | "FileSpreadsheet"
  | "FileText"
  | "Globe"
  | "Image"
  | "Key"
  | "Lock"
  | "Search"
  | "Sparkles"
  | "Type";

export interface ToolDefinition {
  id: string;
  path: string;
  icon: IconName;
  category: ToolCategory;
  i18nKey: string;
}

export type ToolCategory = "generators" | "converters" | "editors" | "analyzers";

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { icon: IconName; i18nKey: string }
> = {
  generators: { icon: "Sparkles", i18nKey: "sectionGenerators" },
  converters: { icon: "ArrowRightLeft", i18nKey: "sectionConverters" },
  editors: { icon: "Edit", i18nKey: "sectionEditors" },
  analyzers: { icon: "Search", i18nKey: "sectionAnalyzers" },
};

export const TOOLS: ToolDefinition[] = [
  // Generators
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
  // Converters
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
  // Editors (新カテゴリ)
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
  {
    id: "matrix-todo",
    path: "/matrix-todo",
    icon: "CheckSquare",
    category: "editors",
    i18nKey: "matrixTodo",
  },
  // Analyzers
  {
    id: "jwt-decoder",
    path: "/jwt-decoder",
    icon: "Key",
    category: "analyzers",
    i18nKey: "jwtDecoder",
  },
  {
    id: "show-gip",
    path: "/show-gip",
    icon: "Globe",
    category: "analyzers",
    i18nKey: "showGlobalIP",
  },
  {
    id: "ip-info",
    path: "/ip-info",
    icon: "Search",
    category: "analyzers",
    i18nKey: "ipInfo",
  },
  {
    id: "service-status",
    path: "/service-status",
    icon: "Activity",
    category: "analyzers",
    i18nKey: "serviceStatus",
  },
  {
    id: "text-viewer",
    path: "/text-viewer",
    icon: "FileText",
    category: "analyzers",
    i18nKey: "textViewer",
  },
  {
    id: "cheatsheets",
    path: "/cheatsheets",
    icon: "BookOpen",
    category: "analyzers",
    i18nKey: "cheatsheets",
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
    analyzers: [],
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
  "analyzers",
];
