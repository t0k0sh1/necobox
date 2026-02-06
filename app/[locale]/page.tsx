"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  CATEGORY_ORDER,
  getToolsByCategory,
  TOOL_CATEGORIES,
  type IconName,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tools";
import {
  Activity,
  ArrowRightLeft,
  Braces,
  Cake,
  Calendar,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Key,
  Lock,
  Search,
  Sparkles,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";

// アイコン名からコンポーネントへのマッピング
const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Activity,
  ArrowRightLeft,
  Braces,
  Cake,
  Calendar,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Key,
  Lock,
  Search,
  Sparkles,
  Type,
};

// カテゴリアイコンのマッピング（TOOL_CATEGORIES.iconを単一ソースとして利用）
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
}

function ToolCard({ tool, t }: ToolCardProps) {
  const Icon = ICONS[tool.icon];

  return (
    <Link href={tool.path} className="block">
      <Button
        variant="outline"
        className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
      >
        {Icon && <Icon className="size-10" />}
        <span className="text-sm">
          {t(tool.i18nKey as Parameters<typeof t>[0])}
        </span>
      </Button>
    </Link>
  );
}

interface ToolSectionProps {
  category: ToolCategory;
  tools: ToolDefinition[];
  t: ReturnType<typeof useTranslations<"home">>;
}

function ToolSection({ category, tools, t }: ToolSectionProps) {
  const CategoryIcon = CATEGORY_ICONS[category];
  const categoryConfig = TOOL_CATEGORIES[category];

  // ツールがない場合はセクションを表示しない
  if (tools.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-950">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <CategoryIcon className="w-5 h-5" />
        {t(categoryConfig.i18nKey as Parameters<typeof t>[0])}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} t={t} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const t = useTranslations("home");
  const toolsByCategory = getToolsByCategory();

  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl space-y-8">
        {CATEGORY_ORDER.map((category) => (
          <ToolSection
            key={category}
            category={category}
            tools={toolsByCategory[category]}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
