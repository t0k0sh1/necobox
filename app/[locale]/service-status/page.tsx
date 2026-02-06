"use client";

import { ServiceStatusGroup } from "@/components/ServiceStatusGroup";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceCategory, ServiceStatusInfo } from "@/lib/utils/service-status";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const CATEGORY_ORDER: ServiceCategory[] = [
  "cloud-vendor",
  "file-storage",
  "dev-tools",
  "communication",
  "hosting-cdn",
  "other",
];

export default function ServiceStatusPage() {
  const t = useTranslations("serviceStatus");

  const [statuses, setStatuses] = useState<ServiceStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/v1/service-status");
      if (!response.ok) {
        throw new Error("Failed to fetch service statuses");
      }
      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("Error fetching service statuses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await fetchStatuses();
  };

  const handleRefreshService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/v1/service-status/${serviceId}`);
      if (!response.ok) {
        throw new Error("Failed to refresh service status");
      }
      const data = await response.json();
      if (data.status) {
        setStatuses((prev) =>
          prev.map((s) => (s.id === serviceId ? data.status : s))
        );
      }
    } catch (error) {
      console.error(`Error refreshing service ${serviceId}:`, error);
    }
  };

  // サービスをカテゴリ別にグループ化
  const groupedServices = statuses.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceCategory, ServiceStatusInfo[]>);

  const breadcrumbItems = [
    { label: t("breadcrumb") },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-1 items-start justify-center py-4 px-4">
        <div className="w-full max-w-6xl space-y-6">
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {CATEGORY_ORDER.map((category) => {
                const services = groupedServices[category] || [];
                if (services.length === 0) return null;
                return (
                  <ServiceStatusGroup
                    key={category}
                    category={category}
                    services={services}
                    onRefresh={handleRefreshService}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
