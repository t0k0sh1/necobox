"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/routing";
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
  BookOpen,
  Braces,
  Cake,
  Calendar,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Key,
  Lock,
  Menu,
  Search,
  Shield,
  Sparkles,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Braces,
  Cake,
  Calendar,
  CheckSquare,
  Clock,
  Dices,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Key,
  Lock,
  Search,
  Shield,
  Sparkles,
  Type,
};

interface ToolNavItemProps {
  tool: ToolDefinition;
  label: string;
  isActive: boolean;
  onNavigate: () => void;
}

function ToolNavItem({ tool, label, isActive, onNavigate }: ToolNavItemProps) {
  const Icon = ICONS[tool.icon];

  return (
    <Link href={tool.path} onClick={onNavigate}>
      <div
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isActive
            ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            : "text-gray-600 dark:text-gray-400"
        }`}
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        <span>{label}</span>
      </div>
    </Link>
  );
}

interface ToolNavSectionProps {
  category: ToolCategory;
  tools: ToolDefinition[];
  t: ReturnType<typeof useTranslations<"home">>;
  currentPath: string;
  onNavigate: () => void;
}

function ToolNavSection({
  category,
  tools,
  t,
  currentPath,
  onNavigate,
}: ToolNavSectionProps) {
  const categoryConfig = TOOL_CATEGORIES[category];
  const CategoryIcon = ICONS[categoryConfig.icon];

  if (tools.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <CategoryIcon className="size-3.5" />
        {t(categoryConfig.i18nKey as Parameters<typeof t>[0])}
      </h3>
      {tools.map((tool) => (
        <ToolNavItem
          key={tool.id}
          tool={tool}
          label={t(tool.i18nKey as Parameters<typeof t>[0])}
          isActive={currentPath === tool.path}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function ToolNavigationMenu() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const toolsByCategory = getToolsByCategory();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={tc("toolMenu")}>
          <Menu className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{tc("toolMenu")}</SheetTitle>
          <SheetDescription className="sr-only">
            {tc("toolMenuDescription")}
          </SheetDescription>
        </SheetHeader>
        <nav className="space-y-4 px-4 pb-4" aria-label={tc("toolMenuDescription")}>
          {CATEGORY_ORDER.map((category) => (
            <ToolNavSection
              key={category}
              category={category}
              tools={toolsByCategory[category]}
              t={t}
              currentPath={pathname}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
