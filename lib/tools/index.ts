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
  | "CalendarClock"
  | "CheckSquare"
  | "Clock"
  | "Code"
  | "Dices"
  | "Edit"
  | "FileCode"
  | "FileSpreadsheet"
  | "FileText"
  | "Fingerprint"
  | "GitCompare"
  | "Globe"
  | "Hash"
  | "Image"
  | "Key"
  | "Lightbulb"
  | "Link"
  | "Lock"
  | "Palette"
  | "Search"
  | "Shield"
  | "Sparkles"
  | "TextCursorInput"
  | "Paintbrush"
  | "Timer"
  | "Type"
  | "Map"
  | "Workflow";

export interface ToolDefinition {
  id: string;
  path: string;
  icon: IconName;
  category: ToolCategory;
  i18nKey: string;
}

export type ToolCategory =
  | "generators"
  | "encoding"
  | "converters"
  | "editors"
  | "devtools"
  | "tasks"
  | "network"
  | "references";

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { icon: IconName; i18nKey: string }
> = {
  generators: { icon: "Sparkles", i18nKey: "sectionGenerators" },
  encoding: { icon: "FileCode", i18nKey: "sectionEncoding" },
  converters: { icon: "ArrowRightLeft", i18nKey: "sectionConverters" },
  editors: { icon: "Edit", i18nKey: "sectionEditors" },
  devtools: { icon: "Code", i18nKey: "sectionDevtools" },
  tasks: { icon: "CheckSquare", i18nKey: "sectionTasks" },
  network: { icon: "Globe", i18nKey: "sectionNetwork" },
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
  {
    id: "uuid-generator",
    path: "/uuid-generator",
    icon: "Fingerprint",
    category: "generators",
    i18nKey: "uuidGenerator",
  },
  // Encoding（エンコード・デコード）
  {
    id: "url-encoder",
    path: "/url-encoder",
    icon: "Link",
    category: "encoding",
    i18nKey: "urlEncoder",
  },
  {
    id: "base64-converter",
    path: "/base64-converter",
    icon: "FileCode",
    category: "encoding",
    i18nKey: "base64Converter",
  },
  {
    id: "jwt-decoder",
    path: "/jwt-decoder",
    icon: "Key",
    category: "encoding",
    i18nKey: "jwtDecoder",
  },
  {
    id: "hash-generator",
    path: "/hash-generator",
    icon: "Hash",
    category: "encoding",
    i18nKey: "hashGenerator",
  },
  // Converters（変換・計算）
  {
    id: "unix-timestamp",
    path: "/unix-timestamp",
    icon: "Timer",
    category: "converters",
    i18nKey: "unixTimestamp",
  },
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
    id: "cron-tester",
    path: "/cron-tester",
    icon: "CalendarClock",
    category: "editors",
    i18nKey: "cronTester",
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
  {
    id: "text-processor",
    path: "/text-processor",
    icon: "TextCursorInput",
    category: "editors",
    i18nKey: "textProcessor",
  },
  // DevTools（開発ツール）
  {
    id: "event-storming",
    path: "/event-storming",
    icon: "Workflow",
    category: "devtools",
    i18nKey: "eventStorming",
  },
  {
    id: "color-scheme-designer",
    path: "/color-scheme-designer",
    icon: "Paintbrush",
    category: "devtools",
    i18nKey: "colorSchemeDesigner",
  },
  {
    id: "diff-viewer",
    path: "/diff-viewer",
    icon: "GitCompare",
    category: "devtools",
    i18nKey: "diffViewer",
  },
  {
    id: "text-viewer",
    path: "/text-viewer",
    icon: "FileText",
    category: "devtools",
    i18nKey: "textViewer",
  },
  {
    id: "story-mapping",
    path: "/story-mapping",
    icon: "Map",
    category: "devtools",
    i18nKey: "storyMapping",
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
  // References（リファレンス）
  {
    id: "cheatsheets",
    path: "/cheatsheets",
    icon: "BookOpen",
    category: "references",
    i18nKey: "cheatsheets",
  },
  {
    id: "knowledge-hub",
    path: "/knowledge-hub",
    icon: "Lightbulb",
    category: "references",
    i18nKey: "knowledgeHub",
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
    encoding: [],
    converters: [],
    editors: [],
    devtools: [],
    tasks: [],
    network: [],
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
  "encoding",
  "converters",
  "editors",
  "devtools",
  "tasks",
  "network",
  "references",
];

/**
 * カテゴリごとのカラークラス定義
 * Tailwind JIT が正しくクラスを検出できるよう、完全なクラス文字列リテラルで記述
 */
export const CATEGORY_COLOR_CLASSES: Record<
  ToolCategory,
  {
    sectionTitle: string;
    cardBg: string;
    cardBorder: string;
    cardBorderHover: string;
    cardIcon: string;
  }
> = {
  generators: {
    sectionTitle: "text-purple-600 dark:text-purple-400",
    cardBg: "bg-purple-50/50 dark:bg-gray-950",
    cardBorder: "border-purple-300 dark:border-purple-800/60",
    cardBorderHover:
      "hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-950",
    cardIcon: "text-purple-600 dark:text-purple-400",
  },
  encoding: {
    sectionTitle: "text-amber-600 dark:text-amber-400",
    cardBg: "bg-amber-50/50 dark:bg-gray-950",
    cardBorder: "border-amber-300 dark:border-amber-800/60",
    cardBorderHover:
      "hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-gray-950",
    cardIcon: "text-amber-600 dark:text-amber-400",
  },
  converters: {
    sectionTitle: "text-blue-600 dark:text-blue-400",
    cardBg: "bg-blue-50/50 dark:bg-gray-950",
    cardBorder: "border-blue-300 dark:border-blue-800/60",
    cardBorderHover:
      "hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-950",
    cardIcon: "text-blue-600 dark:text-blue-400",
  },
  editors: {
    sectionTitle: "text-emerald-600 dark:text-emerald-400",
    cardBg: "bg-emerald-50/50 dark:bg-gray-950",
    cardBorder: "border-emerald-300 dark:border-emerald-800/60",
    cardBorderHover:
      "hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-gray-950",
    cardIcon: "text-emerald-600 dark:text-emerald-400",
  },
  devtools: {
    sectionTitle: "text-rose-600 dark:text-rose-400",
    cardBg: "bg-rose-50/50 dark:bg-gray-950",
    cardBorder: "border-rose-300 dark:border-rose-800/60",
    cardBorderHover:
      "hover:border-rose-400 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-gray-950",
    cardIcon: "text-rose-600 dark:text-rose-400",
  },
  tasks: {
    sectionTitle: "text-orange-600 dark:text-orange-400",
    cardBg: "bg-orange-50/50 dark:bg-gray-950",
    cardBorder: "border-orange-300 dark:border-orange-800/60",
    cardBorderHover:
      "hover:border-orange-400 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-gray-950",
    cardIcon: "text-orange-600 dark:text-orange-400",
  },
  network: {
    sectionTitle: "text-cyan-600 dark:text-cyan-400",
    cardBg: "bg-cyan-50/50 dark:bg-gray-950",
    cardBorder: "border-cyan-300 dark:border-cyan-800/60",
    cardBorderHover:
      "hover:border-cyan-400 dark:hover:border-cyan-700 hover:bg-cyan-50 dark:hover:bg-gray-950",
    cardIcon: "text-cyan-600 dark:text-cyan-400",
  },
  references: {
    sectionTitle: "text-slate-600 dark:text-slate-400",
    cardBg: "bg-slate-50/50 dark:bg-gray-950",
    cardBorder: "border-slate-300 dark:border-slate-800/60",
    cardBorderHover:
      "hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-950",
    cardIcon: "text-slate-600 dark:text-slate-400",
  },
};
