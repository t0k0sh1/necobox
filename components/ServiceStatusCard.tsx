"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { getServiceIcon } from "@/lib/utils/service-icons";
import { ServiceStatusInfo } from "@/lib/utils/service-status";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Flag,
  RefreshCw,
} from "lucide-react";
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
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);

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

  const getBorderColor = (status: string) => {
    switch (status) {
      case "operational":
        return "border-l-green-500";
      case "degraded":
        return "border-l-orange-500";
      case "down":
        return "border-l-red-500";
      default:
        return "border-l-gray-400";
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

  const getResponseTimeColor = (ms?: number) => {
    if (ms === undefined) return "text-gray-400";
    if (ms < 200) return "text-green-600 dark:text-green-400";
    if (ms < 500) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
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

    const maintenancesWithDate = service.scheduledMaintenances
      .map((m) => {
        const scheduledFor = new Date(m.scheduled_for);
        if (isNaN(scheduledFor.getTime())) {
          return null;
        }
        return { maintenance: m, scheduledFor };
      })
      .filter(
        (
          item
        ): item is {
          maintenance: (typeof service.scheduledMaintenances)[0];
          scheduledFor: Date;
        } => item !== null
      );

    const futureMaintenances = maintenancesWithDate.filter(
      (m) => m.scheduledFor > now
    );

    if (futureMaintenances.length === 0) {
      return null;
    }

    return futureMaintenances.sort(
      (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
    )[0].maintenance;
  }, [service]);

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
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

  const ServiceIcon = getServiceIcon(service.id);

  // DownDetector のページが存在しないサービス
  const SERVICES_WITHOUT_DOWNDETECTOR = new Set(["jira"]);
  // ステータスページが無効化されているサービス
  const SERVICES_WITHOUT_STATUS_PAGE = new Set(["x"]);

  // ロケールに応じた DownDetector URL
  const downdetectorUrl = useMemo(() => {
    if (!service.downdetectorUrl || SERVICES_WITHOUT_DOWNDETECTOR.has(service.id)) return undefined;
    if (locale === "ja") {
      return service.downdetectorUrl
        .replace("downdetector.com", "downdetector.jp")
        .replace("/status/", "/shougai/");
    }
    return service.downdetectorUrl;
  }, [service.downdetectorUrl, locale]);

  // コンポーネントの正常数
  const componentsOk = service.components
    ? service.components.filter((c) => c.status === "operational").length
    : 0;
  const componentsTotal = service.components?.length || 0;

  return (
    <div
      className={`border border-gray-200 dark:border-gray-800 border-l-4 ${getBorderColor(service.status)} rounded-lg p-4 bg-white dark:bg-gray-950 hover:shadow-md transition-shadow`}
    >
      {/* ヘッダー: アイコン + サービス名 + アクションボタン */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <ServiceIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {service.name}
              </h3>
              {upcomingMaintenance && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center"
                      aria-label={t("scheduledMaintenance")}
                    >
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

            {/* ステータス + レスポンスタイム */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(service.status)}`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getStatusText(service.status)}
                </span>
              </div>
              {service.responseTimeMs !== undefined && (
                <span
                  className={`text-xs tabular-nums ${getResponseTimeColor(service.responseTimeMs)}`}
                >
                  {t("responseTime", { ms: String(service.responseTimeMs) })}
                </span>
              )}
            </div>

            {/* 最終チェック時刻 */}
            {service.lastChecked && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("lastChecked", {
                  time: formatRelativeTime(
                    new Date(service.lastChecked),
                    locale === "ja" ? "ja" : "en"
                  ),
                })}
              </p>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {downdetectorUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={downdetectorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Activity className="w-4 h-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{t("viewDownDetector")}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="w-8 h-8" />
          )}
          {service.statusGatorUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={service.statusGatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{t("viewStatusGator")}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="w-8 h-8" />
          )}
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
          {!SERVICES_WITHOUT_STATUS_PAGE.has(service.id) ? (
            <a
              href={service.statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t("viewStatusPage")}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      </div>

      {/* コンポーネント別ステータス */}
      {service.components && service.components.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setIsComponentsOpen(!isComponentsOpen)}
            aria-expanded={isComponentsOpen}
            aria-controls="components-list"
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
          >
            {isComponentsOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>{t("components")}</span>
            <span className="text-gray-400 dark:text-gray-500">
              ({t("componentsCount", {
                ok: String(componentsOk),
                total: String(componentsTotal),
              })})
            </span>
          </button>
          {isComponentsOpen && (
            <div id="components-list" className="mt-2 space-y-1 pl-5">
              {service.components.map((component) => (
                <div
                  key={component.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(component.status)}`}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {component.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
