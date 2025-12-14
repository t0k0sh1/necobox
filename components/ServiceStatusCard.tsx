"use client";

import { Button } from "@/components/ui/button";
import { ServiceStatusInfo } from "@/lib/utils/service-status";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ServiceStatusCardProps {
  service: ServiceStatusInfo;
  onRefresh?: (serviceId: string) => Promise<void>;
}

export function ServiceStatusCard({
  service,
  onRefresh,
}: ServiceStatusCardProps) {
  const t = useTranslations("serviceStatus");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-orange-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return t("status.operational");
      case "degraded":
        return t("status.degraded");
      case "down":
        return t("status.down");
      default:
        return t("status.unknown");
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh(service.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(
              service.status
            )}`}
            title={getStatusText(service.status)}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {service.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getStatusText(service.status)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={t("refresh")}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
          <a
            href={service.statusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title={t("viewStatusPage")}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
