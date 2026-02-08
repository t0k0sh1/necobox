"use client";

import { cn } from "@/lib/utils";
import { ServiceCategory } from "@/lib/utils/service-status";
import { useTranslations } from "next-intl";

interface CategoryChipsProps {
  categories: { category: ServiceCategory; count: number }[];
  selected: ServiceCategory | "all";
  totalCount: number;
  onSelect: (category: ServiceCategory | "all") => void;
}

export function CategoryChips({
  categories,
  selected,
  totalCount,
  onSelect,
}: CategoryChipsProps) {
  const t = useTranslations("serviceStatus");

  return (
    <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          selected === "all"
            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
      >
        {t("categories.all")} ({totalCount})
      </button>
      {categories.map(({ category, count }) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            selected === category
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          {t(`categories.${category}`)} ({count})
        </button>
      ))}
    </div>
  );
}
