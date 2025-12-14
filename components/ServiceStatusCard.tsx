"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceStatusInfo } from "@/lib/utils/service-status";
import { ExternalLink, Flag, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface ServiceStatusCardProps {
  service: ServiceStatusInfo;
  onRefresh?: (serviceId: string) => Promise<void>;
}

export function ServiceStatusCard({
  service,
  onRefresh,
}: ServiceStatusCardProps) {
  const t = useTranslations("serviceStatus");
  const locale = useLocale();
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

  // 未来日のメンテナンス情報を取得（最も近い日時のものを優先）
  const upcomingMaintenance = useMemo(() => {
    if (
      !service.scheduledMaintenances ||
      service.scheduledMaintenances.length === 0
    ) {
      return null;
    }

    const now = new Date();
    const futureMaintenances = service.scheduledMaintenances.filter((m) => {
      const scheduledFor = new Date(m.scheduled_for);
      return scheduledFor > now;
    });

    if (futureMaintenances.length === 0) {
      return null;
    }

    // 最も近い日時のメンテナンスを返す
    return futureMaintenances.sort((a, b) => {
      const dateA = new Date(a.scheduled_for);
      const dateB = new Date(b.scheduled_for);
      return dateA.getTime() - dateB.getTime();
    })[0];
  }, [service.scheduledMaintenances]);

  // 日時フォーマット関数
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // ロケールに応じたフォーマット（日本語は"ja-JP"、英語は"en-US"）
      const localeCode = locale === "ja" ? "ja-JP" : "en-US";
      return new Intl.DateTimeFormat(localeCode, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <TooltipProvider>
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {service.name}
                </h3>
                {upcomingMaintenance && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Flag className="w-4 h-4 text-orange-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {t("scheduledMaintenance")}
                        </div>
                        <div>{upcomingMaintenance.name}</div>
                        <div className="text-xs">
                          {t("maintenanceFrom", {
                            date: formatDateTime(
                              upcomingMaintenance.scheduled_for
                            ),
                          })}
                        </div>
                        {upcomingMaintenance.scheduled_until && (
                          <div className="text-xs">
                            {t("maintenanceUntil", {
                              date: formatDateTime(
                                upcomingMaintenance.scheduled_until
                              ),
                            })}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
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
    </TooltipProvider>
  );
}
