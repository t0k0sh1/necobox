"use client";

import { CategoryChips } from "@/components/CategoryChips";
import { CategorySidebar } from "@/components/CategorySidebar";
import { ServiceStatusCard } from "@/components/ServiceStatusCard";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServiceStatusCache } from "@/lib/hooks/useServiceStatusCache";
import { ServiceCategory } from "@/lib/utils/service-status";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const CATEGORY_ORDER: ServiceCategory[] = [
  "cloud-vendor",
  "file-storage",
  "dev-tools",
  "communication",
  "hosting-cdn",
  "ai-ml",
  "design-tools",
  "other",
];

export default function ServiceStatusPage() {
  const t = useTranslations("serviceStatus");

  const { statuses, loading, refreshing, handleRefreshAll, handleRefreshService } =
    useServiceStatusCache();
  const [selectedCategory, setSelectedCategory] = useState<
    ServiceCategory | "all"
  >("all");

  // カテゴリ別のサービス数を集計
  const categoryStats = useMemo(() => {
    const stats: { category: ServiceCategory; count: number }[] = [];
    for (const category of CATEGORY_ORDER) {
      const count = statuses.filter((s) => s.category === category).length;
      if (count > 0) {
        stats.push({ category, count });
      }
    }
    return stats;
  }, [statuses]);

  // フィルタリング後のサービス一覧
  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return statuses;
    return statuses.filter((s) => s.category === selectedCategory);
  }, [statuses, selectedCategory]);

  const breadcrumbItems = [{ label: t("breadcrumb") }];

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 h-[calc(100vh-64px-48px)]">
        {/* ヘッダー */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <div className="max-w-7xl mx-auto space-y-3">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("title")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("description")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                disabled={refreshing || loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {t("refreshAll")}
              </Button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex overflow-hidden px-4 pb-4">
          <div className="max-w-7xl mx-auto flex flex-1 gap-6 overflow-hidden w-full">
            {/* サイドバー (md以上) */}
            {!loading && (
              <CategorySidebar
                categories={categoryStats}
                selected={selectedCategory}
                totalCount={statuses.length}
                onSelect={setSelectedCategory}
              />
            )}

            {/* メインエリア */}
            <main className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 dark:border-gray-800 border-l-4 border-l-gray-300 dark:border-l-gray-600 rounded-lg p-4 bg-white dark:bg-gray-950 animate-pulse"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* モバイル向けチップ (md未満) */}
                  <CategoryChips
                    categories={categoryStats}
                    selected={selectedCategory}
                    totalCount={statuses.length}
                    onSelect={setSelectedCategory}
                  />

                  {/* サービスカードグリッド */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 md:mt-0">
                    {filteredServices.map((service) => (
                      <ServiceStatusCard
                        key={service.id}
                        service={service}
                        onRefresh={handleRefreshService}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
