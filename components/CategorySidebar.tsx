"use client";

import { cn } from "@/lib/utils";
import { ServiceCategory } from "@/lib/utils/service-status";
import { useTranslations } from "next-intl";

interface CategorySidebarProps {
  categories: { category: ServiceCategory; count: number }[];
  selected: ServiceCategory | "all";
  totalCount: number;
  onSelect: (category: ServiceCategory | "all") => void;
}

export function CategorySidebar({
  categories,
  selected,
  totalCount,
  onSelect,
}: CategorySidebarProps) {
  const t = useTranslations("serviceStatus");

  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 flex-col gap-1 border-r border-gray-200 dark:border-gray-800 pr-4 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
          selected === "all"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
        )}
      >
        <span>{t("categories.all")}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500 tabular-nums">
          {totalCount}
        </span>
      </button>
      {categories.map(({ category, count }) => (
        <button
          type="button"
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
            selected === category
              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <span>{t(`categories.${category}`)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-500 tabular-nums">
            {count}
          </span>
        </button>
      ))}
    </aside>
  );
}
