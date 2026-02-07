"use client";

import { Link } from "@/i18n/routing";
import { useRecentTools } from "@/lib/hooks/useRecentTools";
import { useToolPins } from "@/lib/hooks/useToolPins";
import {
  CATEGORY_ORDER,
  getToolsByCategory,
  TOOL_CATEGORIES,
  TOOLS,
  type IconName,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tools";
import {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Braces,
  Cake,
  Calendar,
  CalendarClock,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  Image,
  Key,
  Lightbulb,
  Link as LinkIcon,
  Lock,
  Palette,
  Pin,
  PinOff,
  Search,
  Shield,
  Sparkles,
  TextCursorInput,
  Timer,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";

// アイコン名からコンポーネントへのマッピング
const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Braces,
  Cake,
  Calendar,
  CalendarClock,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  Image,
  Key,
  Lightbulb,
  Link: LinkIcon,
  Lock,
  Palette,
  Search,
  Shield,
  Sparkles,
  TextCursorInput,
  Timer,
  Type,
};

// ツールID → ToolDefinition のルックアップ（TOOLS は静的なのでモジュールレベルで生成）
const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.id, tool]));

// カテゴリアイコンのマッピング
const CATEGORY_ICONS: Record<
  ToolCategory,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(
  Object.entries(TOOL_CATEGORIES).map(([category, { icon }]) => [
    category,
    ICONS[icon],
  ])
) as Record<ToolCategory, React.ComponentType<{ className?: string }>>;

interface ToolCardProps {
  tool: ToolDefinition;
  t: ReturnType<typeof useTranslations<"home">>;
  isPinned: boolean;
  onTogglePin: (toolId: string) => void;
  onRecordUsage: (toolId: string) => void;
}

function ToolCard({
  tool,
  t,
  isPinned,
  onTogglePin,
  onRecordUsage,
}: ToolCardProps) {
  const Icon = ICONS[tool.icon];

  return (
    <div className="relative group">
      <Link
        href={tool.path}
        className="block"
        onClick={() => onRecordUsage(tool.id)}
      >
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm pl-4 pr-9 py-3.5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all">
          {Icon && (
            <Icon className="size-5 shrink-0 text-gray-500 dark:text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t(tool.i18nKey as Parameters<typeof t>[0])}
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTogglePin(tool.id);
        }}
        className={`absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-md transition-opacity ${
          isPinned
            ? "opacity-100 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        }`}
        aria-label={
          isPinned
            ? t("unpinTool" as Parameters<typeof t>[0])
            : t("pinTool" as Parameters<typeof t>[0])
        }
      >
        {isPinned ? (
          <PinOff className="size-3.5" />
        ) : (
          <Pin className="size-3.5" />
        )}
      </button>
    </div>
  );
}

interface ToolChipProps {
  tool: ToolDefinition;
  t: ReturnType<typeof useTranslations<"home">>;
  onRecordUsage: (toolId: string) => void;
  onUnpin?: (toolId: string) => void;
}

function ToolChip({ tool, t, onRecordUsage, onUnpin }: ToolChipProps) {
  const Icon = ICONS[tool.icon];

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <Link
        href={tool.path}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm"
        onClick={() => onRecordUsage(tool.id)}
      >
        {Icon && (
          <Icon className="size-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
        )}
        <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {t(tool.i18nKey as Parameters<typeof t>[0])}
        </span>
      </Link>
      {onUnpin && (
        <button
          type="button"
          onClick={() => onUnpin(tool.id)}
          className="pr-2.5 pl-0.5 py-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label={t("unpinTool" as Parameters<typeof t>[0])}
        >
          <PinOff className="size-3" />
        </button>
      )}
    </div>
  );
}

interface ToolSectionProps {
  category: ToolCategory;
  tools: ToolDefinition[];
  t: ReturnType<typeof useTranslations<"home">>;
  isPinned: (toolId: string) => boolean;
  onTogglePin: (toolId: string) => void;
  onRecordUsage: (toolId: string) => void;
}

function ToolSection({
  category,
  tools,
  t,
  isPinned,
  onTogglePin,
  onRecordUsage,
}: ToolSectionProps) {
  const CategoryIcon = CATEGORY_ICONS[category];
  const categoryConfig = TOOL_CATEGORIES[category];

  if (tools.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 flex items-center gap-1.5">
        <CategoryIcon className="size-3.5" />
        {t(categoryConfig.i18nKey as Parameters<typeof t>[0])}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            t={t}
            isPinned={isPinned(tool.id)}
            onTogglePin={onTogglePin}
            onRecordUsage={onRecordUsage}
          />
        ))}
      </div>
    </section>
  );
}

interface PinnedSectionProps {
  toolIds: string[];
  t: ReturnType<typeof useTranslations<"home">>;
  onRecordUsage: (toolId: string) => void;
  onUnpin: (toolId: string) => void;
}

function PinnedSection({
  toolIds,
  t,
  onRecordUsage,
  onUnpin,
}: PinnedSectionProps) {
  if (toolIds.length === 0) return null;

  const tools = toolIds
    .map((id) => TOOL_MAP.get(id))
    .filter((tool): tool is ToolDefinition => tool !== undefined);

  if (tools.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
        <Pin className="size-3.5" />
        {t("sectionPinned" as Parameters<typeof t>[0])}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <ToolChip
            key={tool.id}
            tool={tool}
            t={t}
            onRecordUsage={onRecordUsage}
            onUnpin={onUnpin}
          />
        ))}
      </div>
    </section>
  );
}

interface RecentSectionProps {
  toolIds: string[];
  t: ReturnType<typeof useTranslations<"home">>;
  onRecordUsage: (toolId: string) => void;
}

function RecentSection({ toolIds, t, onRecordUsage }: RecentSectionProps) {
  if (toolIds.length === 0) return null;

  const tools = toolIds
    .map((id) => TOOL_MAP.get(id))
    .filter((tool): tool is ToolDefinition => tool !== undefined);

  if (tools.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {t("sectionRecent" as Parameters<typeof t>[0])}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <ToolChip
            key={tool.id}
            tool={tool}
            t={t}
            onRecordUsage={onRecordUsage}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const t = useTranslations("home");
  const toolsByCategory = getToolsByCategory();
  const {
    pinnedToolIds,
    isPinned,
    togglePin,
    isInitialized: pinsInitialized,
  } = useToolPins();
  const {
    recentToolIds,
    recordUsage,
    isInitialized: recentInitialized,
  } = useRecentTools();

  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl space-y-5">
        {/* ピン留め・最近使ったツール（コンパクトチップ） */}
        {pinsInitialized && (
          <PinnedSection
            toolIds={pinnedToolIds}
            t={t}
            onRecordUsage={recordUsage}
            onUnpin={togglePin}
          />
        )}
        {recentInitialized && (
          <RecentSection
            toolIds={recentToolIds}
            t={t}
            onRecordUsage={recordUsage}
          />
        )}

        {/* カテゴリセクション */}
        {CATEGORY_ORDER.map((category) => (
          <ToolSection
            key={category}
            category={category}
            tools={toolsByCategory[category]}
            t={t}
            isPinned={isPinned}
            onTogglePin={togglePin}
            onRecordUsage={recordUsage}
          />
        ))}
      </div>
    </div>
  );
}
